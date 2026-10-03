"use server";

import { revalidatePath } from "next/cache";
import { siteRequestOtp } from "@/lib/api";
import { authedFetch } from "@/lib/server-api";
import { clearSession } from "@/lib/session";

type R = { ok: boolean; error?: string; data?: any };
const errMsg = (data: any, fallback: string) => {
  const m = data?.error?.message ?? data?.message;
  return (Array.isArray(m) ? m[0] : m) || fallback;
};

/** Code de vérification (WhatsApp, ou e-mail du compte) : preuve que la personne possède le numéro. */
export async function sendDeletionCodeAction(phone: string, channel?: "email"): Promise<R> {
  if (phone.replace(/[^0-9]/g, "").length < 8) return { ok: false, error: "Entrez un numéro de téléphone valide." };
  try {
    const { ok, data } = await siteRequestOtp(phone, undefined, channel ?? "auto");
    return ok ? { ok: true, data: { channel: data?.channel, emailHint: data?.emailHint, devCode: data?.devCode } } : { ok: false, error: errMsg(data, "Envoi impossible.") };
  } catch {
    return { ok: false, error: "Service indisponible. Réessayez plus tard." };
  }
}

export async function requestDeletionAction(input: { phone: string; code: string; scope: string; reason: string; details?: string; email?: string }): Promise<R> {
  const { ok, data } = await authedFetch("/site/account-deletion/request", { method: "POST", body: JSON.stringify(input) });
  return ok ? { ok: true, data } : { ok: false, error: errMsg(data, "Demande impossible.") };
}

export async function cancelDeletionAction(input: { phone: string; code: string }): Promise<R> {
  const { ok, data } = await authedFetch("/site/account-deletion/cancel", { method: "POST", body: JSON.stringify(input) });
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Annulation impossible.") };
}

/** Connecté : suppression de son propre compte (confirmation « SUPPRIMER »), puis déconnexion. */
export async function deleteMyAccountAction(input: { reason: string; details?: string; confirm: string }): Promise<R> {
  const { ok, data } = await authedFetch("/site/me/deletion", { method: "POST", body: JSON.stringify(input) });
  if (!ok) return { ok: false, error: errMsg(data, "Suppression impossible.") };
  clearSession();
  revalidatePath("/", "layout");
  return { ok: true, data };
}
