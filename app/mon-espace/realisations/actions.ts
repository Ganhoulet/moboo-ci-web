"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { getSession } from "@/lib/session";

const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Action impossible.";

async function call(path: string, method: string, body?: unknown) {
  const r = await authedFetch(`/site/me/deals${path}`, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const u = getSession()?.username;
  if (r.ok && u) revalidatePath(`/pro/${u}`);
  if (r.ok) revalidatePath("/mon-espace/annonces");
  return r.ok ? { ok: true as const, data: r.data } : { ok: false as const, error: err(r.data) };
}

export async function markListing(listingId: string, input: Record<string, unknown>) { return call(`/listing/${listingId}`, "POST", input); }
export async function addDeal(input: Record<string, unknown>) { return call("", "POST", input); }
export async function updateDeal(id: string, input: Record<string, unknown>) { return call(`/${id}`, "PUT", input); }
export async function removeDeal(id: string) { return call(`/${id}`, "DELETE"); }
