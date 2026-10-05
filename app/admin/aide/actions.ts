"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import type { HelpAudience } from "@/lib/help";

export interface HelpRow {
  id: string; slug: string; audience: string; category: string; kind: "guide" | "faq"; title: string; status: string; builtin: boolean;
  views: number; helpfulYes: number; helpfulNo: number; updatedAt: string;
}
export interface HelpInput {
  id?: string; slug: string; audience: string; category: string; kind: "guide" | "faq"; title: string; summary: string; body: string; sort: number; status: string;
}

const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Action impossible.";
const done = () => { revalidatePath("/admin/aide", "layout"); revalidateTag("site-help"); };

export async function listHelp(): Promise<{ audiences: HelpAudience[]; items: HelpRow[]; searches: { top: { q: string; count: number; results: number }[]; empty: { q: string; count: number }[] } } | null> {
  const r = await authedFetch("/site/admin/help", { method: "GET" });
  return r.ok ? r.data : null;
}
export async function getHelp(id: string): Promise<(HelpInput & HelpRow & { hasOriginal: boolean; audiences: HelpAudience[] }) | null> {
  const r = await authedFetch(`/site/admin/help/${encodeURIComponent(id)}`, { method: "GET" });
  return r.ok ? r.data : null;
}
export async function saveHelpAction(a: HelpInput): Promise<{ ok: boolean; id?: string; slug?: string; error?: string }> {
  const r = a.id
    ? await authedFetch(`/site/admin/help/${encodeURIComponent(a.id)}`, { method: "PATCH", body: JSON.stringify(a) })
    : await authedFetch("/site/admin/help", { method: "POST", body: JSON.stringify(a) });
  if (r.ok) done();
  return r.ok ? { ok: true, id: r.data.id, slug: r.data.slug } : { ok: false, error: err(r.data) };
}
export async function deleteHelpAction(id: string): Promise<{ ok: boolean; archived?: boolean; error?: string }> {
  const r = await authedFetch(`/site/admin/help/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (r.ok) done();
  return r.ok ? { ok: true, archived: r.data.archived } : { ok: false, error: err(r.data) };
}
export async function restoreHelpAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`/site/admin/help/${encodeURIComponent(id)}/restore`, { method: "POST", body: "{}" });
  if (r.ok) done();
  return r.ok ? { ok: true } : { ok: false, error: err(r.data) };
}
/** Capture d'écran → stockage Moboo (image déjà réduite dans le navigateur). */
export async function uploadHelpImageAction(dataUri: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const r = await authedFetch("/site/me/uploads", { method: "POST", body: JSON.stringify({ image: dataUri, kind: "aide" }) });
  return r.ok ? { ok: true, url: r.data.url } : { ok: false, error: err(r.data) };
}
