import { API_URL } from "./api";
import { relayHeaders } from "./relay";

/**
 * Modèles d'affichage des résultats (back-office → Apparence → Affichage des
 * résultats) : carte à gauche / à droite / en haut / plein écran ou sans carte,
 * largeur de la carte, grille ou liste, style des repères. Chaque modèle peut
 * être appliqué à des pages précises ; sinon le modèle par défaut.
 */
export type LayoutView = "standard" | "map-left" | "map-right" | "map-top" | "map-full";
export interface ResultLayout {
  id: string; name: string; view: LayoutView; listStyle: "grid" | "list"; columns: number;
  mapWidth: number; mapHeight: "small" | "medium" | "large"; marker: "pin" | "price" | "dot"; autoLoad: boolean;
}
export interface LayoutsConfig { defaultId: string; layouts: ResultLayout[]; assignments: { target: string; layoutId: string }[] }

export const LAYOUTS_TAG = "result-layouts";

export const FALLBACK_LAYOUT: ResultLayout = { id: "grille", name: "Grille sans carte", view: "standard", listStyle: "grid", columns: 4, mapWidth: 50, mapHeight: "medium", marker: "price", autoLoad: false };

export async function getResultLayouts(): Promise<LayoutsConfig | null> {
  try {
    const r = await fetch(`${API_URL}/site/result-layouts`, { next: { revalidate: 60, tags: [LAYOUTS_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    return r.ok ? ((await r.json()) as LayoutsConfig) : null;
  } catch {
    return null;
  }
}

export const zoneSlug = (s: string) =>
  String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Modèle d'une page : la cible la plus précise d'abord (page SEO, zone, agent, onglet). */
export async function layoutFor(candidates: (string | null | undefined)[]): Promise<ResultLayout> {
  const cfg = await getResultLayouts();
  if (!cfg) return FALLBACK_LAYOUT;
  const byId = new Map(cfg.layouts.map((l) => [l.id, l]));
  for (const c of candidates) {
    if (!c) continue;
    const a = cfg.assignments.find((x) => x.target === c);
    if (a && byId.has(a.layoutId)) return byId.get(a.layoutId)!;
  }
  return byId.get(cfg.defaultId) ?? cfg.layouts[0] ?? FALLBACK_LAYOUT;
}

export const hasMap = (l: ResultLayout) => l.view !== "standard";
