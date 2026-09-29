"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { TAXONOMY_TAG } from "@/lib/taxonomies";

const BASE = "/site/admin/realestate";
const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export interface AdminListingRow {
  id: string; title: string; transaction: "rent" | "sale"; propertyType: string; price: number; priceUnit: string | null;
  city: string; commune: string | null; photo: string | null; status: string; featured: boolean; labels: string[];
  expiresAt: string | null; createdAt: string; reference: number | null; views: number; inquiries: number;
  owner: { kind: "site" | "agent" | "contact"; name: string; username: string | null; phone: string | null };
}
export interface AdminListingPage { total: number; page: number; perPage: number; counts: Record<string, number>; items: AdminListingRow[] }

export async function listAdminListings(params: Record<string, string | undefined>): Promise<AdminListingPage | null> {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  const { ok, data } = await authedFetch(`${BASE}/listings${qs ? `?${qs}` : ""}`, { method: "GET" });
  return ok ? data : null;
}

export async function getAdminListing(id: string): Promise<Record<string, any> | null> {
  const { ok, data } = await authedFetch(`${BASE}/listings/${encodeURIComponent(id)}`, { method: "GET" });
  return ok ? data : null;
}

/** Le site public relit tout de suite (listes, fiches). */
function refresh() {
  revalidatePath("/", "layout");
}

export async function quickListingAction(id: string, patch: Record<string, unknown>): Promise<{ ok: boolean; error?: string; data?: any }> {
  const { ok, data } = await authedFetch(`${BASE}/listings/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(patch) });
  if (ok) refresh();
  return ok ? { ok: true, data } : { ok: false, error: errMsg(data, "Action impossible.") };
}

export async function duplicateListingAdminAction(id: string): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { ok, data } = await authedFetch(`${BASE}/listings/${encodeURIComponent(id)}/duplicate`, { method: "POST" });
  return ok ? { ok: true, id: data.id } : { ok: false, error: errMsg(data, "Duplication impossible.") };
}

export async function deleteListingAdminAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`${BASE}/listings/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (ok) refresh();
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Suppression impossible.") };
}

/** Enregistrement depuis l'éditeur (création si id absent). */
export async function saveAdminListingAction(id: string | null, payload: Record<string, any>): Promise<{ ok: boolean; id?: string; error?: string }> {
  const { ok, data } = await authedFetch(id ? `${BASE}/listings/${encodeURIComponent(id)}` : `${BASE}/listings`, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload),
  });
  if (!ok) return { ok: false, error: errMsg(data, "Enregistrement impossible.") };
  refresh();
  return { ok: true, id: data?.id ?? id ?? undefined };
}

/* ─── Listes ───────────────────────────────────────────────────────────── */

export interface AdminTaxItem { id: string; kind: string; slug: string; label: string; parent: string | null; color: string | null; sort: number; count: number }

export async function listTaxonomy(kind: string): Promise<AdminTaxItem[]> {
  const { ok, data } = await authedFetch(`${BASE}/taxonomies/${encodeURIComponent(kind)}`, { method: "GET" });
  return ok && Array.isArray(data?.items) ? data.items : [];
}

function refreshTax() {
  revalidateTag(TAXONOMY_TAG);
  revalidatePath("/admin/immobilier", "layout");
}

export async function addTaxonomyAction(kind: string, input: { label: string; parent?: string; color?: string }): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`${BASE}/taxonomies/${encodeURIComponent(kind)}`, { method: "POST", body: JSON.stringify(input) });
  if (ok) refreshTax();
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Ajout impossible.") };
}

export async function editTaxonomyAction(id: string, input: { label?: string; parent?: string | null; color?: string | null; sort?: number }): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`${BASE}/taxonomies/item/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(input) });
  if (ok) refreshTax();
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Modification impossible.") };
}

export async function removeTaxonomyAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`${BASE}/taxonomies/item/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (ok) refreshTax();
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Suppression impossible.") };
}

/* ─── Agences / agents ─────────────────────────────────────────────────── */

export interface AdminPerson { id: string; source: "site" | "reprise"; name: string; photoUrl: string | null; phone: string | null; email: string | null; city: string; username: string | null; active: boolean; listings: number; createdAt: string }

export async function listPeople(kind: "agencies" | "agents", q?: string): Promise<AdminPerson[]> {
  const { ok, data } = await authedFetch(`${BASE}/people/${kind}${q ? `?q=${encodeURIComponent(q)}` : ""}`, { method: "GET" });
  return ok && Array.isArray(data?.items) ? data.items : [];
}
