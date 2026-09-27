"use server";

import { revalidatePath } from "next/cache";
import { siteRequestOtp, siteVerifyOtp, siteLogout } from "@/lib/api";
import { setSession, clearSession, getRefreshToken } from "@/lib/session";

export type OtpState =
  | { step: "phone"; error?: string }
  | { step: "code"; phone: string; error?: string; devCode?: string }
  | { step: "done" }
  | null;

/** Étape 1 : envoyer le code OTP au numéro saisi. */
export async function sendOtpAction(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const phone = String(formData.get("phone") || "").trim();
  if (phone.replace(/[^0-9]/g, "").length < 8) {
    return { step: "phone", error: "Entrez un numéro de téléphone valide." };
  }
  try {
    const { ok, data } = await siteRequestOtp(phone);
    if (!ok) {
      return { step: "phone", error: data?.message || "Envoi impossible. Réessayez." };
    }
    // devCode renvoyé uniquement en dev/staging (pas de SMS configuré).
    return { step: "code", phone, devCode: data?.devCode };
  } catch {
    return { step: "phone", error: "Service indisponible. Réessayez plus tard." };
  }
}

/** Étape 2 : vérifier le code → connexion + pose des cookies de session. */
export async function verifyOtpAction(_prev: OtpState, formData: FormData): Promise<OtpState> {
  const phone = String(formData.get("phone") || "").trim();
  const code = String(formData.get("code") || "").trim();
  const firstName = String(formData.get("firstName") || "").trim() || undefined;

  if (!phone || code.replace(/[^0-9]/g, "").length < 4) {
    return { step: "code", phone, error: "Entrez le code reçu par message." };
  }
  try {
    const { ok, data } = await siteVerifyOtp({ phone, code, firstName });
    if (!ok || !data?.accessToken || !data?.account) {
      return { step: "code", phone, error: data?.message || "Code incorrect ou expiré." };
    }
    setSession(data, data.account);
    revalidatePath("/", "layout");
    return { step: "done" };
  } catch {
    return { step: "code", phone, error: "Service indisponible. Réessayez plus tard." };
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
