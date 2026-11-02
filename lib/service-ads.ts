import { API_URL } from "./api";
import { relayHeaders } from "./relay";

/** Publicités de services (prestataires) : cartes « Sponsorisé » entre les annonces et mini-pages. */
export interface ServiceAdCardData {
  id: string; title: string; text: string | null; imageUrl: string | null; ctaLabel: string;
  provider: { slug: string; name: string; category: string; logoUrl: string | null };
}
export interface ServiceProviderPage {
  id: string; slug: string; name: string; category: string; tagline: string | null; description: string | null;
  logoUrl: string | null; coverUrl: string | null; photos: string[]; phone: string | null; whatsapp: string | null;
  website: string | null; zones: string[]; others: { slug: string; name: string; logoUrl: string | null; tagline: string | null }[];
}

export async function getServiceAdsFeed(q: string, transaction?: string): Promise<{ every: number; items: ServiceAdCardData[] }> {
  try {
    const p = new URLSearchParams({ ...(q ? { q } : {}), ...(transaction ? { transaction } : {}) });
    const r = await fetch(`${API_URL}/site/service-ads/feed?${p}`, { cache: "no-store", headers: { Accept: "application/json", ...relayHeaders(false) } });
    return r.ok ? await r.json() : { every: 6, items: [] };
  } catch {
    return { every: 6, items: [] };
  }
}

export async function getServiceProvider(slug: string): Promise<ServiceProviderPage | null> {
  try {
    const r = await fetch(`${API_URL}/site/service-ads/providers/${encodeURIComponent(slug)}`, { cache: "no-store", headers: { Accept: "application/json", ...relayHeaders(true) } });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

/** « cocody » → « Cocody », « port-bouet » → « Port Bouet » (zones enregistrées en clés). */
export const zoneLabel = (z: string) => z.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
