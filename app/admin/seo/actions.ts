"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { SEO_TAG, type SeoPage } from "@/lib/seo";
import bundled from "@/lib/wp-seo-pages.json";
import type { BottomPart, SeoBottom } from "@/lib/seo-bottom";

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

// ─── Texte du bas des pages « catégorie × lieu » ───

export interface BottomTextAdmin {
  status: "draft" | "published"; parts: BottomPart[]; autoMeta: boolean; source: "claude" | "manual";
  similar: { slug: string; score: number } | null; warnings: string[]; generatedAt: string | null; updatedAt: string;
}
export type BottomFactsAdmin = Omit<SeoBottom, "text">;

export async function getBottomTextAction(id: string): Promise<{ text: BottomTextAdmin | null; facts: BottomFactsAdmin | null } | null> {
  const r = await authedFetch(`/site/admin/seo/${encodeURIComponent(id)}/bottom`, { method: "GET" });
  return r.ok ? r.data : null;
}

export async function saveBottomTextAction(id: string, body: { parts: BottomPart[]; status: "draft" | "published"; autoMeta: boolean; source: "claude" | "manual" }): Promise<{ ok: boolean; error?: string; text?: BottomTextAdmin | null }> {
  const r = await authedFetch(`/site/admin/seo/${encodeURIComponent(id)}/bottom`, { method: "PUT", body: JSON.stringify(body) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Enregistrement impossible.") };
  done();
  return { ok: true, text: r.data.text };
}

export async function draftBottomTextAction(id: string): Promise<{ ok: boolean; error?: string; parts?: BottomPart[]; warnings?: string[]; similar?: { slug: string; score: number } | null }> {
  const r = await authedFetch(`/site/admin/seo/${encodeURIComponent(id)}/bottom/draft`, { method: "POST" });
  if (!r.ok) return { ok: false, error: msg(r.data, "Rédaction impossible.") };
  return { ok: true, ...r.data };
}

export interface BottomRow {
  id: string; slug: string; title: string; source: string; noindex: boolean; listingCount: number;
  text: { status: "draft" | "published"; source: string; similar: { slug: string; score: number } | null; warnings: number; updatedAt: string; words: number } | null;
}
export interface BottomJob { running: boolean; total: number; done: number; failed: { slug: string; error: string }[]; startedAt: string; finishedAt: string | null; publish: boolean }

export async function listBottomTextsAction(): Promise<{ items: BottomRow[]; job: BottomJob | null } | null> {
  const [a, b] = await Promise.all([
    authedFetch("/site/admin/seo/bottom/all", { method: "GET" }),
    authedFetch("/site/admin/seo/bottom/job", { method: "GET" }),
  ]);
  return a.ok ? { items: a.data.items, job: b.ok ? b.data.job : null } : null;
}

export async function draftMissingBottomAction(body: { limit?: number; publish?: boolean; slugs?: string[] }): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch("/site/admin/seo/bottom/draft-missing", { method: "POST", body: JSON.stringify(body) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Rédaction impossible.") };
  return { ok: true };
}

export async function setBottomStatusAction(slugs: string[], status: "draft" | "published"): Promise<{ ok: boolean; error?: string; updated?: number }> {
  const r = await authedFetch("/site/admin/seo/bottom/status", { method: "POST", body: JSON.stringify({ slugs, status }) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Modification impossible.") };
  done();
  return { ok: true, updated: r.data.updated };
}
