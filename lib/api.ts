import type {
  Espace,
  EspaceDetail,
  Paginated,
  Residence,
  ResidenceDetail,
} from "./types";

/**
 * Client du moteur NestJS (module `marketplace`, endpoints publics).
 * Base configurable via NEXT_PUBLIC_API_URL (inclut /api/v1).
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://resi.moboo.ci/api/v1";

async function apiGet<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate },
    headers: { Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return (await res.json()) as T;
}

/** Résidences meublées publiées sur la marketplace. Ne casse jamais le rendu. */
export async function listResidences(params?: {
  city?: string;
  perPage?: number;
}): Promise<Paginated<Residence>> {
  const q = new URLSearchParams();
  if (params?.city) q.set("city", params.city);
  q.set("perPage", String(params?.perPage ?? 24));
  try {
    return await apiGet<Paginated<Residence>>(`/marketplace/residences?${q}`);
  } catch {
    return { total: 0, page: 1, perPage: 0, items: [] };
  }
}

/** Espaces événementiels publiés sur la marketplace. */
export async function listEspaces(params?: {
  commune?: string;
  type?: string;
  perPage?: number;
}): Promise<Paginated<Espace>> {
  const q = new URLSearchParams();
  if (params?.commune) q.set("commune", params.commune);
  if (params?.type) q.set("type", params.type);
  q.set("perPage", String(params?.perPage ?? 24));
  try {
    return await apiGet<Paginated<Espace>>(`/marketplace/espaces?${q}`);
  } catch {
    return { total: 0, page: 1, perPage: 0, items: [] };
  }
}

/** Détail d'une résidence (avec ses appartements). null si introuvable. */
export async function getResidence(id: string): Promise<ResidenceDetail | null> {
  try {
    return await apiGet<ResidenceDetail>(`/marketplace/residences/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

/** Détail d'un espace événementiel. null si introuvable. */
export async function getEspace(idOrSlug: string): Promise<EspaceDetail | null> {
  try {
    return await apiGet<EspaceDetail>(`/marketplace/espaces/${encodeURIComponent(idOrSlug)}`);
  } catch {
    return null;
  }
}

/** Formate un montant en FCFA (XOF), sans décimales. Accepte number | string. */
export function formatXOF(n: number | string | null | undefined): string {
  const v = typeof n === "string" ? Number(n) : n;
  if (v == null || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("fr-FR").format(Math.round(v)) + " FCFA";
}
