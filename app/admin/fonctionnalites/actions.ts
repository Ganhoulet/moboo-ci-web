"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { FLAGS_TAG } from "@/lib/flags";

export interface Flag {
  key: string; label: string; description: string; enabled: boolean; rollout: number;
  audiences: string[]; include: string[]; builtin: boolean; updatedAt: string; updatedBy: string | null;
}

export async function getAdminFlags(): Promise<{ audiences: Record<string, string>; flags: Flag[] } | null> {
  const r = await authedFetch("/site/admin/flags", { method: "GET" });
  return r.ok ? r.data : null;
}

function done() {
  revalidateTag(FLAGS_TAG);
  revalidatePath("/", "layout");
}
const err = (d: any) => (Array.isArray(d?.message) ? d.message.join(" ") : d?.message) || "Enregistrement impossible.";

export async function saveFlagAction(key: string, values: Partial<Flag>): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`/site/admin/flags/${encodeURIComponent(key)}`, { method: "PATCH", body: JSON.stringify(values) });
  if (r.ok) done();
  return r.ok ? { ok: true } : { ok: false, error: err(r.data) };
}

export async function createFlagAction(values: Partial<Flag>): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch("/site/admin/flags", { method: "POST", body: JSON.stringify(values) });
  if (r.ok) done();
  return r.ok ? { ok: true } : { ok: false, error: err(r.data) };
}

export async function deleteFlagAction(key: string): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`/site/admin/flags/${encodeURIComponent(key)}`, { method: "DELETE" });
  if (r.ok) done();
  return r.ok ? { ok: true } : { ok: false, error: err(r.data) };
}
