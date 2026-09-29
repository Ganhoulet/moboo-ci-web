// Pages SEO (back-office → Pages SEO) : pages d'atterrissage reprises de
// l'ancien moboo.ci et réglages SEO des pages existantes. Cache 60 s, vidé à
// chaque modification dans le back-office.
import { API_URL } from "./api";
import { relayHeaders } from "./relay";

export const SEO_TAG = "site-seo";

export interface SeoFilters { transaction?: "rent" | "sale" | "furnished" | "event"; propertyType?: string; q?: string; priceMin?: number; priceMax?: number }

export interface SeoPage {
  id: string; slug: string; kind: "landing" | "override"; status: "draft" | "published";
  title: string; seoTitle: string | null; metaDescription: string | null; focusKeyword: string | null;
  canonical: string | null; noindex: boolean; ogImage: string | null; intro: string | null; content: string | null;
  filters: SeoFilters; perPage: number; sort: string | null;
  hubTab: string | null; hubColumn: string | null; hubLabel: string | null; hubOrder: number; updatedAt: string;
}

export interface SeoLink { slug: string; kind: string; title: string; hubLabel: string | null; hubTab: string | null; hubColumn: string | null; hubOrder: number; noindex: boolean; updatedAt: string }

export async function getSeoPage(slug: string): Promise<SeoPage | null> {
  try {
    const r = await fetch(`${API_URL}/site/seo/page?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 60, tags: [SEO_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) },
    });
    return r.ok ? ((await r.json()) as SeoPage) : null;
  } catch {
    return null;
  }
}

export async function getSeoLinks(): Promise<SeoLink[]> {
  try {
    const r = await fetch(`${API_URL}/site/seo/links`, {
      next: { revalidate: 60, tags: [SEO_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) },
    });
    return r.ok ? ((await r.json()).items as SeoLink[]) : [];
  } catch {
    return [];
  }
}

/** Réglages SEO d'une page existante (/annonces, /forfaits…), s'il y en a. */
export async function getSeoOverride(path: string): Promise<SeoPage | null> {
  const links = await getSeoLinks();
  if (!links.some((l) => l.kind === "override" && l.slug === path)) return null;
  return getSeoPage(path);
}

/** Lien vers la recherche complète correspondant aux filtres d'une page. */
export function searchHref(f: SeoFilters): string {
  const p = new URLSearchParams();
  if (f.transaction) p.set("transaction", f.transaction);
  if (f.propertyType) p.set("propertyType", f.propertyType);
  if (f.q) p.set("q", f.q);
  if (f.priceMin) p.set("priceMin", String(f.priceMin));
  if (f.priceMax) p.set("priceMax", String(f.priceMax));
  return `/annonces${p.toString() ? `?${p}` : ""}`;
}

export const seoLinkLabel = (l: Pick<SeoLink, "hubLabel" | "title">) => l.hubLabel || l.title;

/** Métadonnées d'une page existante, complétées par ses réglages SEO du back-office. */
export async function withSeoOverride(path: string, base: import("next").Metadata): Promise<import("next").Metadata> {
  const o = await getSeoOverride(path);
  if (!o) return base;
  const title = o.seoTitle || undefined;
  return {
    ...base,
    ...(title ? { title: { absolute: title } } : {}),
    ...(o.metaDescription ? { description: o.metaDescription } : {}),
    ...(o.canonical ? { alternates: { canonical: o.canonical } } : {}),
    ...(o.noindex ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      ...(base.openGraph ?? {}),
      ...(title ? { title } : {}),
      ...(o.metaDescription ? { description: o.metaDescription } : {}),
      ...(o.ogImage ? { images: [o.ogImage] } : {}),
    },
  };
}
