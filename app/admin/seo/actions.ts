"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { SEO_TAG, type SeoPage } from "@/lib/seo";
import bundled from "@/lib/wp-seo-pages.json";

export interface SeoRow {
  id: string; slug: string; kind: "landing" | "override"; status: "draft" | "published"; title: string;
  seoTitle: string | null; metaDescription: string | null; focusKeyword: string | null;
  hubTab: string | null; hubColumn: string | null; noindex: boolean; updatedAt: string; words: number;
}

const msg = (d: any, f: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || f;
const done = () => { revalidateTag(SEO_TAG); revalidatePath("/admin/seo"); revalidatePath("/", "layout"); };

export async function listSeoPages(): Promise<SeoRow[]> {
  const r = await authedFetch("/site/admin/seo", { method: "GET" });
  return r.ok ? r.data.items : [];
}

export async function getSeoPageAdmin(id: string): Promise<SeoPage | null> {
  const r = await authedFetch(`/site/admin/seo/${encodeURIComponent(id)}`, { method: "GET" });
  return r.ok ? r.data : null;
}

export async function saveSeoPageAction(id: string | null, body: Partial<SeoPage>): Promise<{ ok: boolean; error?: string; id?: string }> {
  const r = await authedFetch(id ? `/site/admin/seo/${encodeURIComponent(id)}` : "/site/admin/seo", { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Enregistrement impossible.") };
  done();
  return { ok: true, id: r.data.id };
}

export async function deleteSeoPageAction(id: string) {
  const r = await authedFetch(`/site/admin/seo/${encodeURIComponent(id)}`, { method: "DELETE" });
  done();
  return { ok: r.ok };
}

type ImportResult = { ok: boolean; error?: string; created?: number; updated?: number; skipped?: number; errors?: { slug: string; error: string }[] };

/** Import d'un lot de pages (fichier WordPress lu dans le navigateur). */
export async function importSeoPagesAction(items: unknown[], overwrite: boolean): Promise<ImportResult> {
  const r = await authedFetch("/site/admin/seo/import", { method: "POST", body: JSON.stringify({ items, overwrite }) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Import impossible.") };
  done();
  return { ok: true, ...r.data };
}

/** Pages de l'ancien moboo.ci (export WordPress du 29/09/2026, déjà converti). */
export async function importBundledAction(overwrite: boolean): Promise<ImportResult> {
  return importSeoPagesAction(bundled as unknown[], overwrite);
}
