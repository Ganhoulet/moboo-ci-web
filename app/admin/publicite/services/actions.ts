"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

/** Back-office → Publicité → Services (prestataires sponsorisés). */
type R = { ok: boolean; error?: string; data?: any };
const err = (d: any, fb: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || d?.error?.message || fb;

async function call(path: string, method = "GET", body?: unknown): Promise<R> {
  const { ok, data } = await authedFetch(`/site/admin/service-ads${path}`, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (ok && method !== "GET") revalidatePath("/admin/publicite/services");
  return ok ? { ok: true, data } : { ok: false, error: err(data, "Action impossible.") };
}

export async function getServiceAdsAdmin() { const r = await call(""); return r.ok ? r.data : null; }
export async function adminSaveProviderAction(input: Record<string, unknown>, id?: string) { return call(id ? `/providers/${id}` : "/providers", id ? "PUT" : "POST", input); }
export async function adminProviderStatusAction(id: string, status: string, note?: string) { return call(`/providers/${id}/status`, "POST", { status, note }); }
export async function adminCreateAdAction(input: Record<string, unknown>) { return call("/ads", "POST", input); }
export async function adminAdAction(id: string, action: string, note?: string) { return call(`/ads/${id}/${action}`, "POST", { note }); }
export async function adminLeadStatusAction(id: string, status: string) { return call(`/leads/${id}`, "PUT", { status }); }
