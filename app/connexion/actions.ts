"use server";

import { revalidatePath } from "next/cache";
import { apiPost } from "@/lib/api";
import { setSession } from "@/lib/session";
import { clearPendingTwoFactor, getPendingTwoFactor, type TwoFactorMethod } from "@/lib/two-factor";

const errMsg = (data: any, fallback: string) => (Array.isArray(data?.message) ? data.message[0] : data?.message) || fallback;

/** 2e étape : code de l'application, de l'e-mail ou de secours → session. */
export async function verifyTwoFactorAction(method: TwoFactorMethod, code: string): Promise<{ ok: boolean; error?: string; redirectTo?: string }> {
  const p = getPendingTwoFactor();
  if (!p) return { ok: false, error: "Vérification expirée : reconnectez-vous.", redirectTo: "/compte" };
  if (String(code || "").replace(/[\s-]/g, "").length < 6) return { ok: false, error: "Entrez le code complet." };
  try {
    const { ok, data } = await apiPost<any>("/site/auth/2fa/verify", { challenge: p.challenge, method, code });
    if (!ok || !data?.accessToken || !data?.account) {
      const expired = /expir.*reconnect/i.test(errMsg(data, ""));
      if (expired) clearPendingTwoFactor();
      return { ok: false, error: errMsg(data, "Code incorrect ou expiré."), ...(expired ? { redirectTo: "/compte" } : {}) };
    }
    setSession(data, data.account);
    clearPendingTwoFactor();
    revalidatePath("/", "layout");
    const next = p.next === "/mon-espace" && !data.account.onboarded ? "/inscription" : p.next;
    return { ok: true, redirectTo: next };
  } catch {
    return { ok: false, error: "Service indisponible. Réessayez plus tard." };
  }
}

export async function resendTwoFactorEmailAction(): Promise<{ ok: boolean; error?: string }> {
  const p = getPendingTwoFactor();
  if (!p) return { ok: false, error: "Vérification expirée : reconnectez-vous." };
  try {
    const { ok, data } = await apiPost<any>("/site/auth/2fa/send", { challenge: p.challenge });
    return ok ? { ok: true } : { ok: false, error: errMsg(data, "Envoi impossible.") };
  } catch {
    return { ok: false, error: "Service indisponible. Réessayez plus tard." };
  }
}

export async function cancelTwoFactorAction() {
  clearPendingTwoFactor();
}
