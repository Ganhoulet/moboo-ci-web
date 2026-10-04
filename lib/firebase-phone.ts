/**
 * Codes SMS envoyés par Firebase Authentication (Google) : protection anti-robots
 * (reCAPTCHA invisible), envoi et vérification du code dans le navigateur. Le site
 * transmet ensuite le jeton d'identité Firebase à l'API, qui le vérifie.
 * Le SDK n'est chargé qu'au moment d'envoyer un code (page de connexion).
 */
export interface FirebaseWebConfig { apiKey: string; authDomain: string; projectId: string; appId: string }

/** Configuration Firebase complète et activée dans le back-office (Connexion et inscription) ? */
export function firebaseConfigFrom(auth: {
  firebasePhone?: boolean; firebaseApiKey?: string; firebaseAuthDomain?: string; firebaseProjectId?: string; firebaseAppId?: string;
}): FirebaseWebConfig | null {
  if (!auth.firebasePhone) return null;
  const cfg = { apiKey: auth.firebaseApiKey ?? "", authDomain: auth.firebaseAuthDomain ?? "", projectId: auth.firebaseProjectId ?? "", appId: auth.firebaseAppId ?? "" };
  return Object.values(cfg).every((v) => v.trim()) ? cfg : null;
}

/** Même règle que l'API : numéro local ivoirien → +225, sinon indicatif déjà présent. */
export function toE164(raw: string): string | null {
  const d = raw.replace(/[^0-9]/g, "");
  if (d.length < 8) return null;
  return d.startsWith("225") ? `+${d}` : `+225${d}`;
}

type Confirmation = { confirm: (code: string) => Promise<{ user: { getIdToken: () => Promise<string> } }> };
let pending: { phone: string; confirmation: Confirmation } | null = null;

/** Messages compréhensibles pour les erreurs Firebase les plus courantes. */
export function firebaseErrorMessage(e: any): string {
  const code = String(e?.code || "");
  if (code.includes("invalid-verification-code")) return "Code incorrect. Vérifiez le SMS reçu.";
  if (code.includes("code-expired")) return "Code expiré : demandez un nouveau code.";
  if (code.includes("too-many-requests") || code.includes("quota-exceeded")) return "Trop de demandes de code pour ce numéro : réessayez plus tard ou recevez le code par WhatsApp / e-mail.";
  if (code.includes("invalid-phone-number")) return "Numéro de téléphone invalide.";
  return "Envoi du SMS impossible pour le moment.";
}

async function authFor(cfg: FirebaseWebConfig) {
  const [{ initializeApp, getApps }, { getAuth }] = await Promise.all([import("firebase/app"), import("firebase/auth")]);
  const app = getApps().find((a) => a.name === "moboo-phone") ?? initializeApp(cfg, "moboo-phone");
  const auth = getAuth(app);
  auth.languageCode = "fr";
  return auth;
}

/**
 * Envoie le code par SMS. `buttonOrContainerId` : élément qui porte le reCAPTCHA invisible
 * (doit exister dans la page). Lève une erreur Firebase en cas d'échec.
 */
export async function sendFirebaseSms(cfg: FirebaseWebConfig, rawPhone: string, containerId: string) {
  const phone = toE164(rawPhone);
  if (!phone) throw Object.assign(new Error("Numéro invalide"), { code: "auth/invalid-phone-number" });
  const auth = await authFor(cfg);
  const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");
  const w = window as any;
  try { w.__mobooRecaptcha?.clear?.(); } catch { /* ancien widget déjà retiré */ }
  w.__mobooRecaptcha = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  const confirmation = await signInWithPhoneNumber(auth, phone, w.__mobooRecaptcha);
  pending = { phone, confirmation: confirmation as unknown as Confirmation };
  return phone;
}

/** Vérifie le code saisi et renvoie le jeton d'identité Firebase à transmettre à l'API. */
export async function confirmFirebaseCode(rawPhone: string, code: string): Promise<string> {
  const phone = toE164(rawPhone);
  if (!pending || pending.phone !== phone) throw Object.assign(new Error("Aucun code en attente"), { code: "auth/code-expired" });
  const cred = await pending.confirmation.confirm(code.replace(/\D/g, ""));
  return cred.user.getIdToken();
}

/** Un SMS Firebase est-il en attente pour ce numéro (sur cette page) ? */
export const hasPendingFirebaseSms = (rawPhone: string) => !!pending && pending.phone === toE164(rawPhone);
