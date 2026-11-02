"use server";

import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import { revalidatePath } from "next/cache";

/** Bourse des demandes côté demandeur : déposer, suivre et fermer sa recherche. */
const err = (d: any, fb: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || d?.error?.message || fb;

export async function createLeadRequestAction(input: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  if (getSession()) {
    const { ok, data } = await authedFetch("/site/me/lead-requests", { method: "POST", body: JSON.stringify(input) });
    revalidatePath("/je-cherche");
    return ok ? { ok: true } : { ok: false, error: err(data, "Envoi impossible. Réessayez.") };
  }
  try {
    const r = await fetch(`${API_URL}/site/leads`, { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", ...relayHeaders(true) }, body: JSON.stringify(input) });
    const d = await r.json().catch(() => ({}));
    return r.ok ? { ok: true } : { ok: false, error: r.status === 429 ? "Trop de demandes : réessayez plus tard." : err(d, "Envoi impossible. Réessayez.") };
  } catch {
    return { ok: false, error: "Service indisponible. Réessayez." };
  }
}

export interface MyLeadRequest { id: string; purpose: string; propType: string; commune: string; quartier: string | null; budgetMax: number | null; status: string; agents: number; maxBuyers: number; expiresAt: string; createdAt: string }

export async function getMyLeadRequests(): Promise<MyLeadRequest[]> {
  if (!getSession()) return [];
  const { ok, data } = await authedFetch("/site/me/lead-requests", { method: "GET" });
  return ok && Array.isArray(data) ? data : [];
}

export async function closeLeadRequestAction(id: string) {
  const { ok } = await authedFetch(`/site/me/lead-requests/${id}/close`, { method: "POST", body: "{}" });
  revalidatePath("/je-cherche");
  return { ok };
}
