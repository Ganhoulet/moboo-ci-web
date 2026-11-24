"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { PAGES_TAG } from "@/lib/pages";

export interface FreeRow { slug: string; path: string; title: string; published: boolean; publishedAt: string | null; updatedAt: string; dirty: boolean }

const errMsg = (data: any, fallback: string) => (Array.isArray(data?.message) ? data.message[0] : data?.message) || data?.error?.message || fallback;

export async function listFreePages(): Promise<FreeRow[]> {
  const { ok, data } = await authedFetch("/site/admin/pages-libres", { method: "GET" });
  return ok && Array.isArray(data) ? data : [];
}

export async function createFreePageAction(title: string, path: string): Promise<{ ok: boolean; slug?: string; error?: string }> {
  const { ok, data } = await authedFetch("/site/admin/pages-libres", { method: "POST", body: JSON.stringify({ title, path }) });
  revalidatePath("/admin/pages-site");
  return ok ? { ok: true, slug: data?.slug } : { ok: false, error: errMsg(data, "Création impossible.") };
}

export async function deleteFreePageAction(slug: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`/site/admin/pages-libres/${encodeURIComponent(slug)}`, { method: "DELETE" });
  revalidateTag(PAGES_TAG);
  revalidatePath("/admin/pages-site");
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Suppression impossible.") };
}
