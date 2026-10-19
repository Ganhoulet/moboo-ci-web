"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { SEO_TAG } from "@/lib/seo";

const BASE = "/site/admin/seo";
const msg = (d: any, f: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || (Array.isArray(d?.error?.message) ? d.error.message[0] : d?.error?.message) || f;
const done = () => { revalidateTag(SEO_TAG); revalidatePath("/admin/seo"); revalidatePath("/admin/seo/generateur"); revalidatePath("/admin/seo/quartiers"); revalidatePath("/admin/seo/qualite"); };

export interface GenSpec { tx: string[]; types: string[]; zones: string[]; mods: string[]; national: boolean; hubs: boolean }
export interface GenZone { slug: string; name: string; city: string; level: string; rent: number; sale: number; furnished: number; event: number; total: number; owners: number; guide: string | null }
export interface GenDashboard {
  generated: number; indexable: number; notIndexed: number; manual: number; guides: number; minIndex: number; minCreate: number; nightly: boolean;
  lastRun: { at: string; checked: number; indexable: number } | null; byTx: { tx: string; pages: number; indexable: number }[];
}
export interface GenPlanRow { slug: string; title: string; tx: string; type: string | null; zone: string; mod: string | null; count: number; indexable: boolean; action: string }
export interface GenPlan { minIndex: number; minCreate: number; total: number; create: number; update: number; skipped: number; manual: number; indexable: number; rows: GenPlanRow[] }
export interface Opportunity { slug: string; title: string; searches: number; avgResults: number; tx: string; type: string | null; zone: string; exists: boolean }
export interface ZoneGuide { slug: string; name: string; city: string; summary: string; sections: Record<string, string>; image: string | null; status: string; updatedAt: string | null }

async function get<T>(path: string): Promise<T | null> {
  const r = await authedFetch(`${BASE}${path}`, { method: "GET" });
  return r.ok ? (r.data as T) : null;
}

export const getGenDashboard = () => get<GenDashboard>("/generator/dashboard");
export const getGenZones = async () => (await get<{ items: GenZone[] }>("/generator/zones"))?.items ?? [];
export const getOpportunities = async () => (await get<{ items: Opportunity[] }>("/generator/opportunities"))?.items ?? [];
export const getGuides = async () => (await get<{ items: ZoneGuide[] }>("/guides/all"))?.items ?? [];
export const getGuide = (slug: string) => get<ZoneGuide>(`/guides/${encodeURIComponent(slug)}`);

export async function planAction(spec: GenSpec): Promise<{ ok: boolean; plan?: GenPlan; error?: string }> {
  const r = await authedFetch(`${BASE}/generator/plan`, { method: "POST", body: JSON.stringify(spec) });
  return r.ok ? { ok: true, plan: r.data } : { ok: false, error: msg(r.data, "Aperçu impossible.") };
}

export async function runAction(spec: GenSpec): Promise<{ ok: boolean; created?: number; updated?: number; skipped?: number; error?: string }> {
  const r = await authedFetch(`${BASE}/generator/run`, { method: "POST", body: JSON.stringify(spec) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Génération impossible.") };
  done();
  return { ok: true, ...r.data };
}

export async function refreshAction(): Promise<{ ok: boolean; checked?: number; indexable?: number; error?: string }> {
  const r = await authedFetch(`${BASE}/generator/refresh`, { method: "POST" });
  if (!r.ok) return { ok: false, error: msg(r.data, "Contrôle impossible.") };
  done();
  return { ok: true, ...r.data };
}

export async function removeGeneratedAction(filter: { zone?: string; tx?: string; all?: boolean }): Promise<{ ok: boolean; deleted?: number; error?: string }> {
  const r = await authedFetch(`${BASE}/generator/remove`, { method: "POST", body: JSON.stringify(filter) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Suppression impossible.") };
  done();
  return { ok: true, deleted: r.data.deleted };
}

export async function saveGuideAction(slug: string, body: Partial<ZoneGuide>): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`${BASE}/guides/${encodeURIComponent(slug)}`, { method: "PUT", body: JSON.stringify(body) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Enregistrement impossible.") };
  done();
  return { ok: true };
}

export async function draftGuideAction(slug: string): Promise<{ ok: boolean; draft?: Record<string, string>; error?: string }> {
  const r = await authedFetch(`${BASE}/guides/${encodeURIComponent(slug)}/draft`, { method: "POST" });
  return r.ok ? { ok: true, draft: r.data } : { ok: false, error: msg(r.data, "Rédaction impossible pour le moment.") };
}

// ─── Qualité des pages et zones en double ───
export interface QualityRow {
  id: string; slug: string; title: string; status: string; listings: number; text: "rédigé" | "guide" | "chiffres" | null; duplicate: string | null;
  noindex: boolean; zone: string | null; tx: string | null; level: "bon" | "moyen" | "faible"; todo: string; checkedAt: string | null;
}
export interface ZoneRef { slug: string; label: string; n: number }
export interface SeoQuality {
  minIndex: number;
  summary: { total: number; bon: number; moyen: number; faible: number; noindex: number; duplicates: number; withoutText: number };
  rows: QualityRow[];
  merges: { pending: { page: string; zone: string | null }[]; suggestions: { from: ZoneRef; to: ZoneRef; reason: string }[]; aliases: { from: string; to: string }[] };
}
export const getSeoQuality = () => get<SeoQuality>("/generator/quality");

export async function mergeZoneAction(from?: string, to?: string): Promise<{ ok: boolean; renamed?: number; merged?: number; redirects?: number; error?: string }> {
  const r = await authedFetch(`${BASE}/generator/merge-zones`, { method: "POST", body: JSON.stringify(from ? { from, to } : {}) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Fusion impossible.") };
  done();
  revalidatePath("/agents-immobiliers");
  return { ok: true, ...r.data };
}

export async function unmergeZoneAction(from: string): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`${BASE}/generator/unmerge-zone`, { method: "POST", body: JSON.stringify({ from }) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Annulation impossible.") };
  done();
  return { ok: true };
}
