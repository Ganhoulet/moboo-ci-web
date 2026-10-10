"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { getSession } from "@/lib/session";

const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Action impossible.";

async function call(path: string, method: string, body?: unknown) {
  const r = await authedFetch(`/site/me/team${path}`, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  const u = getSession()?.username;
  if (r.ok && u) revalidatePath(`/pro/${u}`);
  return r.ok ? { ok: true as const, data: r.data } : { ok: false as const, error: err(r.data) };
}

export async function addMember(input: Record<string, string>) { return call("", "POST", input); }
export async function updateMember(id: string, input: Record<string, string>) { return call(`/${id}`, "PUT", input); }
export async function removeMember(id: string) { return call(`/${id}`, "DELETE"); }
export async function reorderTeam(ids: string[]) { return call("/order", "PUT", { ids }); }
