"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { NOTICES_TAG } from "@/lib/notices";

export interface NoticeInput {
  id?: string; title: string; body: string; kind: string; audiences: string[]; places: string[]; placements: string[];
  ctaLabel: string; ctaUrl: string; startsAt: string | null; endsAt: string | null; dismissible: boolean; pinned: boolean; status?: string;
}
export interface NoticeRow extends NoticeInput {
  id: string; status: "draft" | "published" | "archived"; live: boolean; views: number; clicks: number; dismissals: number; reads: number;
  createdAt: string; publishedAt: string | null;
}
export interface NoticeMeta { audiences: Record<string, string>; placements: Record<string, string>; kinds: string[] }

const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Action impossible.";
const done = () => { revalidatePath("/admin/centre-marketing/informations", "layout"); revalidateTag(NOTICES_TAG); };

export async function listNotices(): Promise<({ items: NoticeRow[] } & NoticeMeta) | null> {
  const r = await authedFetch("/site/admin/notices", { method: "GET" });
  return r.ok ? r.data : null;
}
export async function getNotice(id: string): Promise<(NoticeRow & { reach: { accounts: number; visitors: boolean } }) | null> {
  const r = await authedFetch(`/site/admin/notices/${encodeURIComponent(id)}`, { method: "GET" });
  return r.ok ? r.data : null;
}
export async function reachAction(n: Pick<NoticeInput, "audiences" | "places">): Promise<{ accounts: number; visitors: boolean } | null> {
  const r = await authedFetch("/site/admin/notices/preview", { method: "POST", body: JSON.stringify(n) });
  return r.ok ? r.data : null;
}
export async function saveNoticeAction(n: NoticeInput): Promise<{ ok: boolean; id?: string; error?: string }> {
  const r = n.id
    ? await authedFetch(`/site/admin/notices/${encodeURIComponent(n.id)}`, { method: "PATCH", body: JSON.stringify(n) })
    : await authedFetch("/site/admin/notices", { method: "POST", body: JSON.stringify(n) });
  if (r.ok) done();
  return r.ok ? { ok: true, id: r.data.id } : { ok: false, error: err(r.data) };
}
export async function noticeStatusAction(id: string, status: string): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`/site/admin/notices/${encodeURIComponent(id)}/status`, { method: "POST", body: JSON.stringify({ status }) });
  if (r.ok) done();
  return r.ok ? { ok: true } : { ok: false, error: err(r.data) };
}
export async function duplicateNoticeAction(id: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const r = await authedFetch(`/site/admin/notices/${encodeURIComponent(id)}/duplicate`, { method: "POST", body: "{}" });
  if (r.ok) done();
  return r.ok ? { ok: true, id: r.data.id } : { ok: false, error: err(r.data) };
}
export async function deleteNoticeAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`/site/admin/notices/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (r.ok) done();
  return r.ok ? { ok: true } : { ok: false, error: err(r.data) };
}
