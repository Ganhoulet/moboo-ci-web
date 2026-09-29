// Lecture des pages du constructeur (publiées ; brouillon pour l'aperçu admin).
import { API_URL } from "./api";
import { relayHeaders } from "./relay";
import { normalizeChrome, normalizeHome, type ChromeContent, type PageContent } from "./page-blocks";

export const PAGES_TAG = "site-pages";

async function published(slug: string): Promise<any | null> {
  try {
    const r = await fetch(`${API_URL}/site/pages/${slug}`, { next: { revalidate: 60, tags: [PAGES_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    return r.ok ? (await r.json())?.content ?? null : null;
  } catch {
    return null;
  }
}

export async function getHomePage(): Promise<PageContent> {
  return normalizeHome(await published("home"));
}

export async function getChrome(): Promise<ChromeContent> {
  return normalizeChrome(await published("chrome"));
}

export interface HomeData {
  totals: {
    listings: number; pros: number; cities: number;
    /** Détail des professionnels (comptes du site + reprise moboo.ci) et bureaux en ligne. */
    agencies?: number; agents?: number; promoters?: number; hosts?: number; owners?: number; offices?: number;
  };
  types: { slug: string; label: string; count: number }[];
  cities: { label: string; count: number }[];
  areas: { label: string; city: string; count: number }[];
  pros: { username: string | null; href?: string; name: string; accountType: string; avatarUrl: string | null; city: string; verified: boolean; listings: number }[];
}

export async function getHomeData(): Promise<HomeData> {
  try {
    const r = await fetch(`${API_URL}/site/home-data`, { next: { revalidate: 60, tags: [PAGES_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    if (r.ok) return await r.json();
  } catch { /* valeurs vides */ }
  return { totals: { listings: 0, pros: 0, cities: 0 }, types: [], cities: [], areas: [], pros: [] };
}
