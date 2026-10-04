// Espace annonceur (façon Zillow) : annonces sponsorisées, agents partenaires de zone, tarifs.
import { API_URL } from "./api";
import { relayHeaders } from "./relay";
import { mapListing, type Property } from "./property";
import type { ListingItem } from "./types";

export interface AdsPricing {
  enabled: boolean;
  packs: { amount: number; bonusPct: number; credits: number }[];
  boost: { pricePerDay: number; cityFactor: number; durations: number[] };
  showcase: { price30: number };
  partner: { price30: number; cityFactor: number; slots: number; types: string[] };
  banner: { pricePerDay: number; review: boolean };
}
export interface AdZone { zone: string; label: string; kind: "city" | "area"; city: string | null; listings: number }
export interface ZonePartner { id: string; name: string; company: string | null; avatarUrl: string | null; username: string | null; phone: string | null; whatsapp: string | null; verified: boolean }

async function get<T>(path: string, revalidate: number | false = 0): Promise<T | null> {
  try {
    const r = await fetch(`${API_URL}${path}`, {
      ...(revalidate === false ? { cache: "no-store" as const } : { next: { revalidate } }),
      headers: { Accept: "application/json", ...relayHeaders(false) },
      signal: AbortSignal.timeout(4000),
    });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

/** Slug d'une zone (même règle que l'API). */
export function zoneKey(label: string) {
  return String(label || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/['’]/g, "-").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Zones possibles d'une recherche libre : groupes de 1 à 3 mots (« grand bassam » → grand-bassam). */
export function zonesOfQuery(q: string): string[] {
  const words = zoneKey(q).split("-").filter(Boolean);
  const out = new Set<string>();
  for (let n = 1; n <= 3; n++) for (let i = 0; i + n <= words.length; i++) out.add(words.slice(i, i + n).join("-"));
  return [...out].slice(0, 20);
}

export const getAdsPricing = () => get<AdsPricing>("/site/ads/pricing", 60);
export const getAdZones = async () => (await get<{ items: AdZone[] }>("/site/ads/zones", 300))?.items ?? [];

/** Annonces sponsorisées d'une recherche (jamais en cache : rotation et impressions). */
export async function getSponsored(params: { q?: string; transaction?: string; propertyType?: string }): Promise<Property[]> {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  const d = await get<{ items: ListingItem[] }>(`/site/ads/sponsored${qs ? `?${qs}` : ""}`, false);
  return (d?.items ?? []).map(mapListing);
}

export async function getZonePartners(listingId: string) {
  return (await get<{ zone: string | null; items: ZonePartner[] }>(`/site/ads/partners/${encodeURIComponent(listingId)}`, false)) ?? { zone: null, items: [] };
}

/** Clic compté (annonce sponsorisée ou partenaire), sans bloquer la page. */
export function trackAdClick(type: "boost" | "partner", id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  void fetch(`${API_URL}/site/ads/click`, {
    method: "POST", headers: { "Content-Type": "application/json", ...relayHeaders(false) }, body: JSON.stringify({ type, id }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => {});
}
