// Indice des prix par quartier (façon Zestimate) : médianes calculées par l'API
// sur les annonces réelles. Ne casse jamais le rendu (null si indisponible).
import { API_URL } from "./api";
import { relayHeaders } from "./relay";

export interface PriceStat { median: number; p25: number; p75: number; count: number }
export interface PriceSegment extends PriceStat { segment: string; label: string }
export interface PriceSide { overall: PriceStat | null; segments: PriceSegment[]; trend: { since: string; median: number; changePct: number } | null }
export interface CommunePrices {
  city: string; commune: string | null; zone: string; slug: string; year: number;
  rent: PriceSide | null; sale: PriceSide | null;
  neighbours: { commune: string; slug: string; rentMedian: number; count: number }[];
  minSample: number; updatedAt: string;
}
export interface CommuneRow { city: string; commune: string; slug: string; rent: PriceStat | null; sale: PriceStat | null }
export interface MarketEstimate extends PriceStat { segment: string; label: string; zone: string; slug: string; transaction: "rent" | "sale"; diffPct: number }

async function get<T>(path: string, revalidate = 3600): Promise<T | null> {
  try {
    const r = await fetch(`${API_URL}${path}`, { next: { revalidate }, headers: { Accept: "application/json", ...relayHeaders(false) }, signal: AbortSignal.timeout(5000) });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

export const getPriceCommunes = () => get<{ items: CommuneRow[] }>("/site/prices").then((d) => d?.items ?? null);
export const getCommunePrices = (slug: string) => get<CommunePrices>(`/site/prices/${encodeURIComponent(slug)}`);
export const getMarketEstimate = (listingId: string) => get<{ estimate: MarketEstimate | null }>(`/site/prices/estimate/${encodeURIComponent(listingId)}`, 600).then((d) => d?.estimate ?? null);

/** « 125 000 FCFA » */
export const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ")} FCFA`;
