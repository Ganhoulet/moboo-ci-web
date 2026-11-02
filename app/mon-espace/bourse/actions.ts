"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

/** Bourse des demandes côté agent. */
const err = (d: any, fb: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || d?.error?.message || fb;

export async function getLeadMarket(q: { commune?: string; purpose?: string }) {
  const p = new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]);
  const { ok, data, status } = await authedFetch(`/site/me/lead-market${p.toString() ? `?${p}` : ""}`, { method: "GET" });
  return ok ? { ok: true as const, data } : { ok: false as const, error: err(data, status === 403 ? "Accès réservé aux professionnels." : "Bourse indisponible.") };
}

export async function unlockLeadAction(id: string) {
  const { ok, data } = await authedFetch(`/site/me/lead-market/${id}/unlock`, { method: "POST", body: "{}" });
  revalidatePath("/mon-espace/bourse");
  return ok ? { ok: true } : { ok: false, error: err(data, "Déblocage impossible.") };
}

export async function reportLeadAction(purchaseId: string, reason: string) {
  const { ok, data } = await authedFetch(`/site/me/lead-market/purchases/${purchaseId}/report`, { method: "POST", body: JSON.stringify({ reason }) });
  revalidatePath("/mon-espace/bourse");
  return ok ? { ok: true, refunded: !!data?.refunded } : { ok: false, error: err(data, "Signalement impossible.") };
}
