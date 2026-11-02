"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

/** Espace annonceur → Publicités de services. */
type R = { ok: boolean; error?: string; data?: any };
const err = (d: any, fb: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || d?.error?.message || fb;

async function call(path: string, method = "GET", body?: unknown): Promise<R> {
  const { ok, data } = await authedFetch(`/site/me/service-ads${path}`, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (ok && method !== "GET") revalidatePath("/mon-espace/publicite-services");
  return ok ? { ok: true, data } : { ok: false, error: err(data, "Action impossible.") };
}

export async function getMyServiceAds() { const r = await call(""); return r.ok ? r.data : null; }
export async function saveProviderAction(input: Record<string, unknown>, id?: string) { return call(id ? `/providers/${id}` : "/providers", id ? "PUT" : "POST", input); }
export async function createServiceAdAction(input: Record<string, unknown>) { return call("/ads", "POST", input); }
export async function cancelServiceAdAction(id: string) { return call(`/ads/${id}/cancel`, "POST", {}); }
export async function setLeadStatusAction(id: string, status: string) { return call(`/leads/${id}`, "PUT", { status }); }
