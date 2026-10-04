"use server";

import { siteCheckSignup, siteRequestOtp, siteVerifyOtp, type SignupProfile } from "@/lib/api";
import { setSession, setProfile, getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";

export type Availability = { usernameAvailable: boolean; emailAvailable: boolean; phoneRegistered: boolean } | null;

/** Vérification en direct pendant la saisie (nom d'utilisateur / e-mail). */
export async function checkAvailabilityAction(input: { username?: string; email?: string; phone?: string }): Promise<Availability> {
  try {
    const { ok, data } = await siteCheckSignup(input);
    return ok ? data : null;
  } catch {
    return null;
  }
}

export type SendCodeResult = { ok: boolean; error?: string; devCode?: string; phoneRegistered?: boolean };

/** Étape « Téléphone » : contrôle des identifiants puis envoi du code. */
export async function sendSignupCodeAction(input: { phone: string; username?: string; email?: string; checkOnly?: boolean }): Promise<SendCodeResult> {
  if (input.phone.replace(/[^0-9]/g, "").length < 8) {
    return { ok: false, error: "Entrez un numéro de téléphone valide." };
  }
  try {
    const check = await siteCheckSignup(input);
    if (check.ok) {
      if (input.username && !check.data.usernameAvailable) return { ok: false, error: "Ce nom d'utilisateur est déjà pris." };
      if (input.email && !check.data.emailAvailable) return { ok: false, error: "Cette adresse e-mail est déjà utilisée." };
    }
    // SMS Firebase : le navigateur envoie le code ; ici on ne fait que les contrôles.
    if (input.checkOnly) return { ok: true, phoneRegistered: check.ok ? check.data.phoneRegistered : false };
    const { ok, data } = await siteRequestOtp(input.phone);
    if (!ok) return { ok: false, error: data?.message || "Envoi du code impossible. Réessayez." };
    return { ok: true, devCode: data?.devCode, phoneRegistered: check.ok ? check.data.phoneRegistered : false };
  } catch {
    return { ok: false, error: "Service indisponible. Réessayez plus tard." };
  }
}

/** Étape « Code » : vérification → création du compte avec son profil → session. */
export async function verifySignupAction(input: { phone: string; code?: string; firebaseIdToken?: string } & SignupProfile): Promise<{ ok: boolean; error?: string; firstName?: string | null }> {
  if (!input.firebaseIdToken && String(input.code ?? "").replace(/[^0-9]/g, "").length < 4) return { ok: false, error: "Entrez le code reçu par message." };
  try {
    const { ok, data } = await siteVerifyOtp(input);
    if (ok && (data as any)?.twoFactor) return { ok: false, error: "Ce compte est protégé par la double authentification : connectez-vous depuis « Se connecter »." };
    if (!ok || !data?.accessToken || !data?.account) {
      const m = Array.isArray(data?.message) ? data.message[0] : data?.message;
      return { ok: false, error: m || "Code incorrect ou expiré." };
    }
    setSession(data, data.account);
    // Pas de revalidatePath ici : il re-rendrait /inscription (→ /compte) avant
    // l'écran de bienvenue. Le rafraîchissement se fait à « Découvrir mon espace ».
    return { ok: true, firstName: data.account.firstName };
  } catch {
    return { ok: false, error: "Service indisponible. Réessayez plus tard." };
  }
}

/** Compte déjà connecté : compléter / changer son type de compte et son profil. */
export async function completeProfileAction(input: SignupProfile): Promise<{ ok: boolean; error?: string }> {
  if (!getSession()) return { ok: false, error: "Connectez-vous d'abord." };
  const { ok, data } = await authedFetch("/site/auth/me", { method: "PATCH", body: JSON.stringify(input) });
  if (!ok) {
    const m = Array.isArray(data?.message) ? data.message[0] : data?.message;
    return { ok: false, error: m || "Enregistrement impossible. Réessayez." };
  }
  setProfile(data);
  return { ok: true };
}
