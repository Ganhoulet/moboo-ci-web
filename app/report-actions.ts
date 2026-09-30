"use server";

import { authedFetch } from "@/lib/server-api";

/** Signalement d'une annonce ou d'un compte (visiteur connecté ou non). */
export async function reportAction(input: { targetType: "listing" | "account"; targetId: string; reason: string; details?: string; name?: string; contact?: string }): Promise<{ ok: boolean; error?: string }> {
  const { ok, status, data } = await authedFetch("/site/reports", { method: "POST", body: JSON.stringify(input) });
  if (ok) return { ok: true };
  if (status === 429) return { ok: false, error: "Trop de signalements envoyés : réessayez plus tard." };
  const m = data?.error?.message ?? data?.message;
  return { ok: false, error: (Array.isArray(m) ? m[0] : m) || "Envoi impossible." };
}
