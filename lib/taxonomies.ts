// Listes du back-office « Immobilier » (types de bien, équipements, étiquettes,
// villes, quartiers). Lues côté serveur, cache 60 s (étiquette vidée à chaque
// modification dans le back-office). Valeurs de secours : celles du code.
import { API_URL } from "./api";
import { relayHeaders } from "./relay";
import { COMMUNES, LISTING_FEATURES, PROPERTY_TYPES } from "./accounts";

export interface TaxItem { slug: string; label: string; parent: string | null; color: string | null }
export interface Taxonomies { type: TaxItem[]; feature: TaxItem[]; label: TaxItem[]; city: TaxItem[]; area: TaxItem[] }

export const TAXONOMY_TAG = "site-taxonomies";

const FALLBACK: Taxonomies = {
  type: PROPERTY_TYPES.map((t) => ({ slug: t.key, label: t.label, parent: null, color: null })),
  feature: LISTING_FEATURES.map((f) => ({ slug: f, label: f, parent: null, color: null })),
  label: [],
  city: [],
  area: COMMUNES.map((c) => ({ slug: c, label: c, parent: null, color: null })),
};

export async function getTaxonomies(): Promise<Taxonomies> {
  try {
    const res = await fetch(`${API_URL}/site/taxonomies`, {
      next: { revalidate: 60, tags: [TAXONOMY_TAG] },
      headers: { Accept: "application/json", ...relayHeaders(false) },
    });
    if (!res.ok) return FALLBACK;
    const d = (await res.json()) as Partial<Taxonomies>;
    return {
      type: d.type?.length ? d.type : FALLBACK.type,
      feature: d.feature?.length ? d.feature : FALLBACK.feature,
      label: d.label ?? [],
      city: d.city ?? [],
      area: d.area?.length ? d.area : FALLBACK.area,
    };
  } catch {
    return FALLBACK;
  }
}

/** Formes attendues par l'éditeur d'annonce. */
export const editorLists = (t: Taxonomies) => ({
  types: t.type.map((x) => ({ key: x.slug, label: x.label })),
  features: t.feature.map((x) => x.label),
  communes: t.area.map((x) => x.label),
});

export const typeLabel = (t: Taxonomies, slug: string) => t.type.find((x) => x.slug === slug)?.label ?? "Bien";
