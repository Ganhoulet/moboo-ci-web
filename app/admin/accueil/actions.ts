"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { PAGES_TAG } from "@/lib/pages";

const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export interface AdminPage {
  slug: string; draft: any; published: any; hasPrevious: boolean; dirty: boolean;
  publishedAt: string | null; updatedAt: string | null;
}
type R = { ok: boolean; page?: AdminPage; error?: string };

export async function getAdminPage(slug: string): Promise<AdminPage | null> {
  const { ok, data } = await authedFetch(`/site/admin/pages/${slug}`, { method: "GET" });
  return ok ? data : null;
}

function refresh() {
  revalidateTag(PAGES_TAG);
  revalidatePath("/", "layout");
}

export async function saveDraftAction(slug: string, content: unknown): Promise<R> {
  const { ok, data } = await authedFetch(`/site/admin/pages/${slug}`, { method: "PUT", body: JSON.stringify({ content }) });
  return ok ? { ok: true, page: data } : { ok: false, error: errMsg(data, "Enregistrement impossible.") };
}

export async function publishAction(slug: string, content: unknown): Promise<R> {
  const { ok, data } = await authedFetch(`/site/admin/pages/${slug}/publish`, { method: "POST", body: JSON.stringify({ content }) });
  if (ok) refresh();
  return ok ? { ok: true, page: data } : { ok: false, error: errMsg(data, "Publication impossible.") };
}

export async function restoreAction(slug: string): Promise<R> {
  const { ok, data } = await authedFetch(`/site/admin/pages/${slug}/restore`, { method: "POST" });
  if (ok) refresh();
  return ok ? { ok: true, page: data } : { ok: false, error: errMsg(data, "Restauration impossible.") };
}

export async function discardAction(slug: string): Promise<R> {
  const { ok, data } = await authedFetch(`/site/admin/pages/${slug}/discard`, { method: "POST" });
  return ok ? { ok: true, page: data } : { ok: false, error: errMsg(data, "Action impossible.") };
}
