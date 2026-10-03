"use server";

import { revalidatePath } from "next/cache";
import { siteRequestOtp, siteVerifyOtp, siteLogout, sitePasswordLogin, siteGoogleLogin } from "@/lib/api";
import { setSession, clearSession, getRefreshToken } from "@/lib/session";
import { setAgentSession, type AgentProfile } from "@/lib/agent";
import { safeNext, startTwoFactor } from "@/lib/two-factor";

const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export type OtpState =
  | { step: "phone"; error?: string; googleTicket?: string }
  | { step: "code"; phone: string; error?: string; devCode?: string; googleTicket?: string; channel?: "whatsapp" | "sms" | "email" | "none"; emailHint?: string | null }
  | { step: "done"; redirectTo?: string }
  | null;

/** Étape 1 : envoyer le code OTP au numéro saisi. */
export async function sendOtpAction(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const phone = String(formData.get("phone") || "").trim();
  const googleTicket = String(formData.get("googleTicket") || "") || undefined;
  const byEmail = formData.get("channel") === "email";
  if (phone.replace(/[^0-9]/g, "").length < 8) {
    return { step: "phone", error: "Entrez un numéro de téléphone valide.", googleTicket };
  }
  try {
    const { ok, data } = await siteRequestOtp(phone, undefined, byEmail ? "email" : "auto");
    if (!ok) {
      // « Recevoir par e-mail » refusé : on reste sur l'étape du code, avec le message.
      if (byEmail) return { step: "code", phone, error: errMsg(data, "Envoi par e-mail impossible."), googleTicket };
      return { step: "phone", error: errMsg(data, "Envoi impossible. Réessayez."), googleTicket };
    }
    // devCode renvoyé uniquement en dev/staging (pas de SMS configuré).
    return { step: "code", phone, devCode: data?.devCode, googleTicket, channel: data?.channel, emailHint: data?.emailHint };
  } catch {
    return { step: "phone", error: "Service indisponible. Réessayez plus tard.", googleTicket };
  }
}

/** Étape 2 : vérifier le code → connexion + pose des cookies de session. */
export async function verifyOtpAction(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const phone = String(formData.get("phone") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const firstName = String(formData.get("firstName") || "").trim() || undefined;
  const googleTicket = String(formData.get("googleTicket") || "") || undefined;

  if (!phone || code.replace(/[^0-9]/g, "").length < 4) {
    return { step: "code", phone, error: "Entrez le code reçu par message.", googleTicket };
  }
  try {
    const { ok, data } = await siteVerifyOtp({ phone, code, firstName, googleTicket });
    if (ok && (data as any)?.twoFactor) return { step: "done", redirectTo: startTwoFactor(data, safeNext(formData.get("next"))) };
    if (!ok || !data?.accessToken || !data?.account) {
      return { step: "code", phone, error: errMsg(data, "Code incorrect ou expiré."), googleTicket };
    }
    setSession(data, data.account);
    revalidatePath("/", "layout");
    return { step: "done" };
  } catch {
    return { step: "code", phone, error: "Service indisponible. Réessayez plus tard." };
  }
}

/* ─── Connexion par identifiant + mot de passe ────────────────────────── */

export type PasswordState = { error?: string; redirectTo?: string; linkTicket?: string; linkEmail?: string } | null;

export async function passwordLoginAction(_prev: PasswordState, formData: FormData): Promise<PasswordState> {
  const identifier = String(formData.get("identifier") || "").trim();
  const password = String(formData.get("password") || "");
  if (identifier.length < 3 || !password) return { error: "Entrez votre identifiant et votre mot de passe." };
  try {
    const { ok, data } = await sitePasswordLogin(identifier, password);
    if (!ok) return { error: errMsg(data, "Identifiant ou mot de passe incorrect.") };
    const next = formData.get("next") ? safeNext(formData.get("next")) : null;
    if (data?.twoFactor) return { redirectTo: startTwoFactor(data, next ?? "/mon-espace") };
    if (data?.kind === "agent" && data.accessToken) {
      // Identifiants moboo.ci d'un agent de la reprise : son espace agent.
      setAgentSession(data.accessToken, data.agent as AgentProfile);
      return { redirectTo: "/agent" };
    }
    // Compte moboo.ci reconnu, 1re connexion ici : numéro à confirmer une fois (puis relié).
    if (data?.status === "need_phone" && data.googleTicket) return { linkTicket: data.googleTicket, linkEmail: data.email };
    if (!data?.accessToken || !data?.account) return { error: "Connexion impossible. Réessayez." };
    setSession(data, data.account);
    revalidatePath("/", "layout");
    return { redirectTo: next ?? (data.account.onboarded ? "/mon-espace" : "/inscription") };
  } catch {
    return { error: "Service indisponible. Réessayez plus tard." };
  }
}

/* ─── Google ───────────────────────────────────────────────────────────── */

export type GoogleResult =
  | { status: "ok"; redirectTo: string }
  | { status: "need_phone"; googleTicket: string; email?: string | null; firstName?: string | null }
  | { status: "error"; error: string };

/** Jeton d'identité reçu du bouton Google → connexion, ou numéro à confirmer une fois. */
export async function googleLoginAction(credential: string, nextPath?: string): Promise<GoogleResult> {
  try {
    const { ok, data } = await siteGoogleLogin(credential);
    if (!ok) return { status: "error", error: errMsg(data, "Connexion Google impossible.") };
    const next = nextPath ? safeNext(nextPath) : null;
    if (data?.twoFactor) return { status: "ok", redirectTo: startTwoFactor(data, next ?? "/mon-espace") };
    if (data?.status === "need_phone" && data.googleTicket) {
      return { status: "need_phone", googleTicket: data.googleTicket, email: data.email, firstName: data.firstName };
    }
    if (!data?.accessToken || !data?.account) return { status: "error", error: "Connexion Google impossible." };
    setSession(data, data.account);
    revalidatePath("/", "layout");
    return { status: "ok", redirectTo: next ?? (data.account.onboarded ? "/mon-espace" : "/inscription") };
  } catch {
    return { status: "error", error: "Service indisponible. Réessayez plus tard." };
  }
}

/** Déconnexion : révoque le refresh token côté moteur + efface les cookies. */
export async function logoutAction() {
  const rt = getRefreshToken();
  if (rt) {
    try {
      await siteLogout(rt);
    } catch {
      /* best-effort */
    }
  }
  clearSession();
  revalidatePath("/", "layout");
}
