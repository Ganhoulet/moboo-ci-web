import { API_URL } from "./api";
import { relayHeaders } from "./relay";

/** Programmes neufs des promoteurs (pages dédiées, mise en avant, contacts qualifiés). */
export interface ProgramUnit { label: string; rooms: number | null; surface: number | null; price: number | null; available: boolean }
export interface DevProgram {
  id: string; slug: string; name: string; developer: string; developerLogo: string | null; kind: string; city: string; commune: string; address: string | null;
  priceFrom: number | null; priceTo: number | null; units: ProgramUnit[]; delivery: string | null; progress: string | null; legalStatus: string | null; verified: boolean;
  paymentPlan: string | null; description: string | null; highlights: string[]; coverUrl: string | null; photos: string[]; videoUrl: string | null; brochureUrl: string | null;
  phone: string | null; whatsapp: string | null; featured: boolean;
}
export const KIND_LABEL: Record<string, string> = { appartements: "Appartements", villas: "Villas", terrains: "Terrains / lotissement", bureaux: "Bureaux", mixte: "Programme mixte" };

export async function listPrograms(q: { commune?: string; kind?: string; featured?: boolean; limit?: number } = {}): Promise<DevProgram[]> {
  try {
    const p = new URLSearchParams({ ...(q.commune ? { commune: q.commune } : {}), ...(q.kind ? { kind: q.kind } : {}), ...(q.featured ? { featured: "1" } : {}), ...(q.limit ? { limit: String(q.limit) } : {}) });
    const r = await fetch(`${API_URL}/site/programs?${p}`, { next: { revalidate: 60 }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

export async function getProgram(slug: string): Promise<DevProgram | null> {
  try {
    const r = await fetch(`${API_URL}/site/programs/${encodeURIComponent(slug)}`, { cache: "no-store", headers: { Accept: "application/json", ...relayHeaders(true) } });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

export const priceRange = (p: Pick<DevProgram, "priceFrom" | "priceTo">) =>
  p.priceFrom ? `${p.priceTo && p.priceTo !== p.priceFrom ? "De " : "À partir de "}${p.priceFrom.toLocaleString("fr-FR")} F${p.priceTo && p.priceTo !== p.priceFrom ? ` à ${p.priceTo.toLocaleString("fr-FR")} F` : ""}` : "Prix sur demande";
