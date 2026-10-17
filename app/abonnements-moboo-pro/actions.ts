"use server";

import { authedFetch } from "@/lib/server-api";
import type { MyProPlan } from "@/lib/pro-plans";

const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export async function getMyProPlan(): Promise<MyProPlan | null> {
  const { ok, data } = await authedFetch("/site/me/pro-plan", { method: "GET" });
  return ok ? (data as MyProPlan) : null;
}

/** Démarre le paiement Mobile Money d'un forfait Moboo Pro ou de crédits d'états des lieux. */
export async function proPlanCheckoutAction(input: { kind: string; months?: number; quantity?: number }): Promise<{ ok: boolean; url?: string; error?: string }> {
  const { ok, data } = await authedFetch("/site/me/pro-plan/checkout", { method: "POST", body: JSON.stringify(input) });
  return ok && data?.url ? { ok: true, url: data.url } : { ok: false, error: errMsg(data, "Paiement impossible pour le moment.") };
}

export async function proPaymentStatusAction(id: number): Promise<{ statut: string } | null> {
  const { ok, data } = await authedFetch(`/site/me/pro-plan/payments/${id}`, { method: "GET" });
  return ok ? { statut: String(data?.statut ?? "inconnu") } : null;
}
