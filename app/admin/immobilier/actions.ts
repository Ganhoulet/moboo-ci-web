"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { TAXONOMY_TAG } from "@/lib/taxonomies";
import { PACKAGES_TAG, PARTNERS_TAG } from "@/lib/community";

const BASE = "/site/admin/realestate";
const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export interface AdminListingRow {
  id: string; title: string; transaction: "rent" | "sale"; propertyType: string; price: number; priceUnit: string | null;
  city: string; commune: string | null; photo: string | null; status: string; featured: boolean; labels: string[]; moderation?: string;
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
  revalidatePath("/", "layout"); // cartes et fiches : statuts / étiquettes renommés tout de suite
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

/* ─── Partenaires ──────────────────────────────────────────────────────── */

export interface AdminPartner { id: string; name: string; logoUrl: string; url: string | null; sort: number; active: boolean }

export async function listPartners(): Promise<AdminPartner[]> {
  const { ok, data } = await authedFetch(`${BASE}/partners`, { method: "GET" });
  return ok && Array.isArray(data?.items) ? data.items : [];
}

type R = { ok: boolean; error?: string };
async function call(path: string, method: string, body: unknown, fallback: string, after?: () => void): Promise<R> {
  const { ok, data } = await authedFetch(path, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (ok) { after?.(); revalidatePath("/admin/immobilier", "layout"); }
  return ok ? { ok: true } : { ok: false, error: errMsg(data, fallback) };
}
const refreshPartners = () => revalidateTag(PARTNERS_TAG);

export async function savePartnerAction(id: string | null, input: Partial<AdminPartner>): Promise<R> {
  return call(id ? `${BASE}/partners/${encodeURIComponent(id)}` : `${BASE}/partners`, id ? "PATCH" : "POST", input, "Enregistrement impossible.", refreshPartners);
}
export async function removePartnerAction(id: string): Promise<R> {
  return call(`${BASE}/partners/${encodeURIComponent(id)}`, "DELETE", undefined, "Suppression impossible.", refreshPartners);
}

/* ─── Avis ─────────────────────────────────────────────────────────────── */

export interface AdminReview {
  id: string; targetType: "listing" | "pro"; rating: number; title: string | null; comment: string; status: "pending" | "approved" | "rejected";
  authorName: string; createdAt: string; target: { title: string; href: string | null };
  author: { name: string; phone: string | null; email: string | null } | null;
}
export interface AdminReviewPage { total: number; page: number; perPage: number; counts: Record<string, number>; items: AdminReview[] }

export async function listReviews(params: Record<string, string | undefined>): Promise<AdminReviewPage | null> {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  const { ok, data } = await authedFetch(`${BASE}/reviews${qs ? `?${qs}` : ""}`, { method: "GET" });
  return ok ? data : null;
}
export async function reviewStatusAction(id: string, status: string): Promise<R> {
  return call(`${BASE}/reviews/${encodeURIComponent(id)}`, "PATCH", { status }, "Action impossible.", () => revalidatePath("/", "layout"));
}
export async function removeReviewAction(id: string): Promise<R> {
  return call(`${BASE}/reviews/${encodeURIComponent(id)}`, "DELETE", undefined, "Suppression impossible.", () => revalidatePath("/", "layout"));
}

/* ─── Forfaits et factures ─────────────────────────────────────────────── */

const BILL = "/site/admin/billing";

export interface AdminPackage {
  id: string; name: string; description: string | null; price: number; durationDays: number; listings: number; featured: number; credits?: number;
  popular: boolean; active: boolean; sort: number; subscribers: number;
}
export async function listPackages(): Promise<AdminPackage[]> {
  const { ok, data } = await authedFetch(`${BILL}/packages`, { method: "GET" });
  return ok && Array.isArray(data?.items) ? data.items : [];
}
const refreshPackages = () => revalidateTag(PACKAGES_TAG);
export async function savePackageAction(id: string | null, input: Partial<AdminPackage>): Promise<R> {
  return call(id ? `${BILL}/packages/${encodeURIComponent(id)}` : `${BILL}/packages`, id ? "PATCH" : "POST", input, "Enregistrement impossible.", refreshPackages);
}
/** Les 4 forfaits actuels de moboo.ci (page /abonnements de WordPress). */
const MOBOO_PACKAGES = [
  { name: "Chap Chap", price: 3000, durationDays: 18, listings: 3, featured: 1, popular: false },
  { name: "Standard", price: 10000, durationDays: 30, listings: 8, featured: 3, popular: false },
  { name: "Lancement", price: 25000, durationDays: 90, listings: 15, featured: 5, popular: true },
  { name: "Croissance", price: 60000, durationDays: 90, listings: 65, featured: 17, popular: false },
];
/** Crée ceux qui manquent (comparaison par nom) ; l'extension de migration les rattachera ensuite. */
export async function createMobooPackagesAction(): Promise<R & { created?: number }> {
  const existing = new Set((await listPackages()).map((p) => p.name.trim().toLowerCase()));
  let created = 0;
  for (const p of MOBOO_PACKAGES) {
    if (existing.has(p.name.toLowerCase())) continue;
    const { ok, data } = await authedFetch(`${BILL}/packages`, { method: "POST", body: JSON.stringify({ ...p, active: true }) });
    if (!ok) return { ok: false, error: errMsg(data, `Création de « ${p.name} » impossible.`) };
    created++;
  }
  refreshPackages();
  revalidatePath("/admin/immobilier", "layout");
  return { ok: true, created };
}
export async function removePackageAction(id: string): Promise<R> {
  return call(`${BILL}/packages/${encodeURIComponent(id)}`, "DELETE", undefined, "Suppression impossible.", refreshPackages);
}

export interface Invoice {
  id: string; number: string; label: string; amount: number; status: "pending" | "paid" | "cancelled" | "failed"; method: string | null;
  paymentRef: string | null; billingName: string | null; billingPhone: string | null; billingEmail: string | null; createdAt: string; paidAt: string | null;
  test?: boolean; kind?: "package" | "listing" | "featured" | "credits";
  subscription?: { packageName: string; startsAt: string; endsAt: string } | null;
  issuer?: { name: string; address: string; taxId: string; note: string };
}
export interface AdminInvoicePage { total: number; page: number; perPage: number; revenue: number; testCount?: number; counts: Record<string, number>; items: Invoice[] }

export async function listInvoices(params: Record<string, string | undefined>): Promise<AdminInvoicePage | null> {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  const { ok, data } = await authedFetch(`${BILL}/invoices${qs ? `?${qs}` : ""}`, { method: "GET" });
  return ok ? data : null;
}
export async function getAdminInvoice(id: string): Promise<Invoice | null> {
  const { ok, data } = await authedFetch(`${BILL}/invoices/${encodeURIComponent(id)}`, { method: "GET" });
  return ok ? data : null;
}
export async function invoiceStatusAction(id: string, status: "paid" | "cancelled", method?: string): Promise<R> {
  return call(`${BILL}/invoices/${encodeURIComponent(id)}`, "PATCH", { status, method }, "Action impossible.");
}
export async function grantPackageAction(input: { phone: string; packageId: string; method?: string }): Promise<R> {
  return call(`${BILL}/invoices`, "POST", input, "Attribution impossible.");
}
/** Mode test : supprime les factures de test et les forfaits qu'elles ont activés. */
export async function purgeTestInvoicesAction(): Promise<R> {
  return call(`${BILL}/test-data/purge`, "POST", {}, "Suppression impossible.");
}

/** Rattache les biens repris de moboo.ci (WordPress) aux comptes du site (même téléphone / e-mail). */
export async function linkLegacyListings(): Promise<{ ok: boolean; error?: string; accounts?: number; linked?: number }> {
  const { ok, data } = await authedFetch(`${BASE}/link-legacy`, { method: "POST" });
  if (!ok) return { ok: false, error: errMsg(data, "Rattachement impossible.") };
  revalidatePath("/admin/immobilier");
  return { ok: true, accounts: data?.accounts ?? 0, linked: data?.linked ?? 0 };
}
