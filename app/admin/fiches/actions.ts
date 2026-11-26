"use server";

import { revalidatePath } from "next/cache";
import { API_URL } from "@/lib/api";
import { authedFetch } from "@/lib/server-api";
import { cleanTitle, communeOf, FICHE_TEMPLATE, newFicheData, readFiche, zoneOf, type FicheData, type FicheItem, type FicheTx } from "@/lib/fiches/fiche";
import type { DocRow } from "@/lib/documents/types";

const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Action impossible.";
const BASE = "/site/admin/documents";

export interface FicheRow { id: string; title: string; edition: number; editionDate: string; status: string; updatedAt: string; format: string }
export interface FicheDoc { id: string; title: string; edition: number; editionDate: string; status: string; data: FicheData }

/** Éditions de fiches enregistrées (documents imprimables du modèle « fiches-annonces »). */
export async function listFiches(): Promise<FicheRow[] | null> {
  const r = await authedFetch(BASE, { method: "GET" });
  if (!r.ok) return null;
  return (r.data.items as DocRow[]).filter((d) => d.template === FICHE_TEMPLATE)
    .map((d) => ({ id: d.id, title: d.title, edition: d.edition, editionDate: d.editionDate, status: d.status, updatedAt: d.updatedAt, format: d.format }));
}

export async function getFiche(id: string): Promise<FicheDoc | null> {
  const r = await authedFetch(`${BASE}/${encodeURIComponent(id)}`, { method: "GET" });
  if (!r.ok || r.data?.template !== FICHE_TEMPLATE) return null;
  return { id: r.data.id, title: r.data.title, edition: r.data.edition, editionDate: r.data.editionDate ?? "", status: r.data.status, data: readFiche(r.data.data) };
}

export async function createFicheAction(): Promise<{ ok: boolean; id?: string; error?: string }> {
  const date = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Abidjan" });
  const body = { title: "Fiche annonces à louer", kind: "autre", format: "A4", edition: 1, editionDate: date, status: "draft", template: FICHE_TEMPLATE, data: newFicheData() };
  const r = await authedFetch(BASE, { method: "POST", body: JSON.stringify(body) });
  if (r.ok) revalidatePath("/admin/fiches");
  return r.ok ? { ok: true, id: r.data.id } : { ok: false, error: err(r.data) };
}

export async function saveFicheAction(id: string, meta: { title: string; edition: number; editionDate: string; status: string }, data: FicheData): Promise<{ ok: boolean; error?: string }> {
  const format = ["A4", "A5"].includes(data.settings.paper) ? data.settings.paper : "A4";
  const r = await authedFetch(`${BASE}/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ ...meta, format, data }) });
  if (r.ok) revalidatePath("/admin/fiches");
  return r.ok ? { ok: true } : { ok: false, error: err(r.data) };
}

// ─── Recherche d'annonces ──────────────────────────────────────────────────
export interface FicheSearch { tx: FicheTx; type?: string; commune?: string; q?: string; priceMin?: number; priceMax?: number; page?: number; complete?: boolean }
export interface FicheSearchResult { items: FicheItem[]; total: number; page: number; pages: number; dropped: number }

async function apiGet(path: string): Promise<any> {
  const r = await fetch(`${API_URL}${path}`, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

/** Prix plausible pour une annonce imprimée (les vieilles annonces importées ont des prix 0 ou fantaisistes). */
function plausible(tx: FicheTx, price: number, unit: string) {
  if (!price) return false;
  if (tx === "sale") return price >= 1_000_000;
  if (tx === "furnished" || unit === "/ nuit") return price >= 5_000 && price <= 1_000_000;
  return price >= 20_000 && price <= 10_000_000;
}

const PER = 50;

/** Zone affichée et commune ; « Abidjan » seul est remplacé par la commune trouvée dans le titre. */
function place(zoneFields: (string | null)[], all: (string | null)[]) {
  const commune = communeOf(all);
  const zone = zoneOf(zoneFields);
  return { commune, zone: zone === "Abidjan" && commune !== "Abidjan" ? commune : zone };
}

/** Annonces publiées (location, vente) ou résidences meublées, filtrées pour la fiche. */
export async function searchFicheListingsAction(f: FicheSearch): Promise<FicheSearchResult> {
  const page = Math.max(1, f.page ?? 1);
  const q = new URLSearchParams({ perPage: String(PER), page: String(page) });
  const words = [f.commune, f.q].map((x) => x?.trim()).filter(Boolean).join(" ");
  if (words) q.set("q", words);
  if (f.priceMax) q.set("priceMax", String(f.priceMax));
  let raw: FicheItem[] = [];
  let total = 0;
  try {
    if (f.tx === "furnished") {
      const d = await apiGet(`/marketplace/residences?${q}`);
      total = d.total ?? 0;
      raw = (d.items ?? []).map((r: any): FicheItem => ({
        key: `residence:${r.id}`, src: "residence", id: r.id, tx: "furnished", title: cleanTitle(r.name),
        ...place([r.quartier, r.commune, r.city], [r.commune, r.quartier, r.city, r.name]),
        price: Number(r.minNightlyPrice) || 0, unit: "/ nuit", image: r.photos?.[0] ?? "", path: `/residence/${r.id}`,
      }));
    } else {
      q.set("transaction", f.tx);
      if (f.type) q.set("propertyType", f.type);
      if (f.priceMin) q.set("priceMin", String(f.priceMin));
      const d = await apiGet(`/marketplace/properties?${q}`);
      total = d.total ?? 0;
      raw = (d.items ?? []).map((l: any): FicheItem => ({
        key: `listing:${l.id}`, src: "listing", id: l.id, tx: l.listingKind === "furnished" || l.priceUnit === "night" ? "furnished" : f.tx, title: cleanTitle(l.title),
        ...place([l.quartier, l.commune, l.city], [l.commune, l.quartier, l.city, l.title]),
        price: Number(l.price) || 0, unit: l.priceUnit === "night" ? "/ nuit" : f.tx === "rent" ? "/ mois" : "", image: l.photos?.[0] ?? "", path: `/annonce/${l.id}`,
      }));
    }
  } catch {
    return { items: [], total: 0, page, pages: 0, dropped: 0 };
  }
  const items = f.complete === false ? raw : raw.filter((x) => !!x.image && plausible(x.tx, x.price, x.unit));
  // Commune : on ne garde que les biens vraiment situés dans la commune choisie.
  // Doublons : le même bien publié plusieurs fois (même photo, ou même titre et même prix).
  const seen = new Set<string>();
  const unique = (x: FicheItem) => { const a = `i:${x.image}`, b = `t:${x.title.toLowerCase()}|${x.price}`; if (seen.has(a) || seen.has(b)) return false; seen.add(a); seen.add(b); return true; };
  // Location : les meublés loués à la nuit relèvent de « Résidences meublées ».
  const inCommune = items.filter((x) => (!f.commune || x.commune === f.commune) && (f.tx !== "rent" || x.tx === "rent") && unique(x));
  return { items: inCommune, total, page, pages: Math.ceil(total / PER), dropped: raw.length - inCommune.length };
}
