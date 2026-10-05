import { API_URL } from "./api";
import { relayHeaders } from "./relay";

/**
 * Avis certifiés des agents et agences — mêmes données que l'écran « Avis »
 * de l'application Moboo.ci — et annuaire des pros par zone d'intervention.
 */

export const CATEGORIES = [
  { key: "fiabilite", label: "Fiabilité", help: "Informations exactes, engagements tenus" },
  { key: "reactivite", label: "Réactivité", help: "Répond vite, organise les visites" },
  { key: "secteur", label: "Connaissance du secteur", help: "Prix, quartiers, démarches" },
  { key: "accompagnement", label: "Accompagnement", help: "Suivi jusqu’à la signature" },
] as const;
export type CategoryKey = (typeof CATEGORIES)[number]["key"];

export interface AvisItem {
  id: string; note_globale: number; categories: Partial<Record<CategoryKey, number>>; recommande: boolean | null;
  qualites: string[]; commentaire: string; titre: string; client_nom: string; created_at: string;
  certifie: boolean; legacy: boolean; reponse: string; reponse_le: string | null; status?: string;
}
export interface Aggregates {
  nb_avis: number; note_globale: number; categories: Partial<Record<CategoryKey, number>>; pct_recommande: number | null;
  top_qualites: { cle: string; libelle: string; nb: number }[]; assez_d_avis: boolean; badges: { icone: string; libelle: string }[];
}
export interface ProReviews { success: boolean; enabled: boolean; agent_nom: string; aggregates: Aggregates; avis: AvisItem[] }
export interface Quality { cle: string; libelle: string }

async function get<T>(path: string, revalidate = 60): Promise<T | null> {
  try {
    const r = await fetch(`${API_URL}${path}`, { next: { revalidate }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

export const getProReviews = (ref: string) => get<ProReviews>(`/site/pros/${encodeURIComponent(ref)}/reviews`, 30);
export const getQualities = async () => (await get<{ qualites: Quality[] }>(`/site/reviews/qualities`, 3600))?.qualites ?? [];

// ─── Annuaire ───────────────────────────────────────────────────────────
export interface DirectoryPro {
  ref: string; href: string; name: string; kind: "agent" | "agence"; company: string | null; photo: string | null;
  zones: string[]; rating: number; reviews: number; recommend: number | null; listings: number;
  verified: boolean; businessVerified: boolean; phone: string | null; whatsapp: string | null; since: string; bio: string | null;
}
export interface DirectoryResult { total: number; page: number; perPage: number; pages: number; counts: { agent: number; agence: number }; items: DirectoryPro[] }
export interface DirectoryQuery { q?: string; zone?: string; type?: string; sort?: string; verified?: string; minRating?: string; page?: string | number }
export interface Zone { slug: string; label: string; n: number }

export async function searchPros(q: DirectoryQuery): Promise<DirectoryResult> {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(q)) if (v !== undefined && v !== null && String(v) !== "") p.set(k, String(v));
  return (await get<DirectoryResult>(`/site/pros/directory?${p}`, 60)) ?? { total: 0, page: 1, perPage: 18, pages: 1, counts: { agent: 0, agence: 0 }, items: [] };
}
export const getZones = async () => (await get<{ items: Zone[] }>(`/site/pros/zones`, 300))?.items ?? [];

export const slugZone = (s: string) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
