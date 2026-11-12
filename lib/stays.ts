import { API_URL } from "./api";

/**
 * Données « séjours » des pages locales (API site-stays) : logements libres ce
 * soir, prix réels de la nuitée, repères, indice des prix, avis vérifiés par le
 * check-in. Ne casse jamais le rendu : null si l'API ne répond pas.
 */

/** common = prix le plus fréquent (deux en cas d'égalité), commonCount = logements à ce(s) prix. */
export interface NightStats { count: number; min: number; median: number; p25: number; p75: number; common?: number[]; commonCount?: number }
export interface StayCard {
  id: string; name: string; href: string; quartier: string | null; commune: string | null; city: string; photo: string | null;
  fromPrice: number | null; apartments: number; tracked?: boolean; verified?: boolean; generator?: boolean; freeTonight: number; freeTonightFrom: number | null;
  distanceKm?: number; travel?: { normal: number; rush: number }; rating?: number; reviews?: number;
}
/** tracked = logements dont le calendrier est tenu dans Moboo Resi (seule base fiable du « libres ce soir »). */
export interface StaySummary { residences: number; apartments: number; tracked?: number; freeTonight: number; night: NightStats | null; freeTonightFrom: number | null }
/** Données du marché : relevés hors Moboo (plusieurs plateformes, jamais nommées). */
export interface MarketStats { median: number; low: number; high: number; listings: number; sources: number; occupancy: number | null; updatedAt: string }
export interface MarketFields { market?: MarketStats | null; combined?: { median: number; count: number } | null; marketSource?: string }
export interface LandmarkRef { slug: string; name: string; near: string }
export interface ZoneStays extends StaySummary, MarketFields { zone: { slug: string; label: string }; updatedAt: string; items: StayCard[]; landmarks: LandmarkRef[] }
export interface Landmark extends LandmarkRef { city: string; commune: string; lat: number; lng: number; radiusKm: number; why: string }
export interface NearStays extends StaySummary { landmark: Landmark; updatedAt: string; items: StayCard[]; others: LandmarkRef[] }
export interface LandmarkRow extends LandmarkRef { city: string; commune: string; residences: number }
export interface PriceIndexRow extends StaySummary, MarketFields { slug: string; name: string; byType: Record<string, NightStats> }
export interface PriceIndex { updatedAt: string; period: string; source: string; marketSource?: string; national: StaySummary; communes: PriceIndexRow[] }
export interface StayReview { id: string; authorName: string; rating: number; title: string | null; comment: string; qualities: string[]; certified: boolean; reply: string | null; createdAt: string }
export interface ResidenceReviews { rating: number | null; count: number; topQualities: { label: string; count: number }[]; items: StayReview[] }
export interface ReviewForm {
  residence: { id: string; name: string; place: string; href: string | null };
  stay: { from: string; to: string }; firstName: string; allowed: boolean; alreadyReviewed: boolean; qualities: string[];
}
export interface GbpKit {
  residence: { id: string; name: string; place: string; visibleOnMoboo: boolean; url: string };
  name: string; categories: { primary: string; secondary: string[] }; description: string;
  address: { quartier: string | null; commune: string | null; city: string; country: string; lat: number | null; lng: number | null };
  website: string; bookingLink: string; photos: string[]; attributes: string[]; posts: string[]; reviewRequest: string;
  reviews: { rating: number | null; count: number }; steps: string[];
}

async function get<T>(path: string, revalidate = 300): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}/site/stays${path}`, { next: { revalidate }, headers: { Accept: "application/json" } });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export const getZoneStays = (slug: string) => get<ZoneStays>(`/zone/${encodeURIComponent(slug)}`);
export const getLandmarks = () => get<LandmarkRow[]>("/landmarks/all", 600);
export const getNearStays = (slug: string) => get<NearStays>(`/near/${encodeURIComponent(slug)}`);
export const getPriceIndex = () => get<PriceIndex>("/price-index/all", 1800);
export interface StayEventRef { slug: string; name: string; venue: string; city: string; startDate: string; endDate: string }
export interface EventStays extends StaySummary {
  event: StayEventRef & { lat: number; lng: number; radiusKm: number; description: string | null };
  stay: { checkIn: string; checkOut: string }; freeDuring: number; items: (StayCard & { freeDuring?: number | null })[];
}
export const getEvents = () => get<StayEventRef[]>("/events/all", 600);
export const getEventStays = (slug: string) => get<EventStays>(`/event/${encodeURIComponent(slug)}`);
export const getResidenceReviews = (id: string) => get<ResidenceReviews>(`/residence/${encodeURIComponent(id)}/reviews`);
export interface StayCheck {
  verified: true; visitedAt: string; agent: string; videoUrl: string | null; photos: string[]; gpsChecked: boolean;
  conformity: "conforme" | "ecarts"; notes: string | null; comfort: { key: string; label: string; good: boolean }[];
}
export const getResidenceCheck = (id: string) => get<StayCheck | null>(`/residence/${encodeURIComponent(id)}/check`);
export interface Arrival {
  ready: boolean; state: "pending" | "confirmed" | "arrived" | "cancelled" | "done"; place: string; checkIn: string; checkOut: string; nights: number;
  name: string; bookedBy: string; code?: string; apartment?: string | null; checkInTime?: string | null; address?: string; lat?: number | null; lng?: number | null; mapsUrl?: string | null;
}
export const getArrival = (token: string) => get<Arrival>(`/arrival/${encodeURIComponent(token)}`, 0);
export const getReviewForm = (token: string) => get<ReviewForm>(`/review/${encodeURIComponent(token)}`, 0);
export const getGbpKit = (token: string) => get<GbpKit>(`/gbp-kit/${encodeURIComponent(token)}`, 0);

export const TYPE_LABEL: Record<string, string> = { STUDIO: "Studio", TWO_ROOMS: "2 pièces", THREE_ROOMS: "3 pièces", VILLA: "Villa" };
/** « 15 000 F et 20 000 F » ; null si aucun prix ne se répète assez. */
export const commonText = (s: NightStats | null | undefined) =>
  s?.common?.length ? s.common.map((n) => nightly(n)).join(" et ") : null;

export const nightly = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/ | /g, " ")} F`;

/** « du 20 décembre 2026 au 21 décembre 2026 » ou « le 20 décembre 2026 ». */
export const dateRange = (a: string, b: string) => {
  const o: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" };
  const s = new Date(a).toLocaleDateString("fr-FR", o), e = new Date(b).toLocaleDateString("fr-FR", o);
  return s === e ? `le ${s}` : `du ${s} au ${e}`;
};
