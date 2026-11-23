export type Tx = "rent" | "sale";
export interface Quote { id: string; commune: string; transaction: Tx; segment: string; label: string; median: number; count: number; active: number; change7: number | null; change30: number | null; sens: "hausse" | "baisse" | "stable" }
export interface MarketEvent { id: string; type: string; at: string; zone: string | null; texte: string; prix: number | null; ecartPct: number | null; sens: "hausse" | "baisse" | null }
export interface Fil { at: string; version: string; events: MarketEvent[]; quotes: Quote[] }
export interface Stat { median: number; p25: number; p75: number; count: number }
export interface Zone {
  commune: string; active: number; rent: number; sale: number; new7: number; new30: number; new30Prev: number; share: number; newVariation: number | null;
  quartiers: { quartier: string; active: number; rentMedian: number | null; rentCount: number }[];
  rentMedian: number | null; rentCount: number; rentChange7: number | null; rentChange30: number | null; saleMedian: number | null; saleCount: number; saleChange30: number | null;
  searches7: number; searches30: number; zero7: number; pression: number; departs: number; agences: number; biensPro: number;
  loyerSigne: number | null; loyerSigneBaux: number; loyerSigneAgences: number; ecartAffiche: number | null;
}
export interface Demand { commune: string | null; type: string; n7: number; n30: number; zero7: number; zero30: number; budget: number | null }
export interface Intelligence {
  at: string; version: string; filtre: { commune?: string | null; quartier?: string | null; type?: string | null; tx?: Tx | null };
  options: { communes: string[]; quartiers: string[]; types: string[] };
  totals: { active: number; rent: number; sale: number; new7: number; new7Prev: number; new30: number; new30Prev: number; drops7: number; moboo: number; externe: number };
  zones: Zone[]; types: { label: string; count: number; rent: number; sale: number; share: number }[];
  segments: { segment: string; label: string; rent: Stat | null; sale: Stat | null; count: number }[];
  quotes: Quote[];
  tendance: { month: string; nouvelles: number; loyerMedian: number | null; venteMedian: number | null }[];
  demande: { recherches7: number; recherches30: number; sansResultat7: number; sansResultat30: number; top: Demand[]; sansOffre: Demand[] };
  departs: { commune: string | null; quartier: string; type: string; n: number }[];
  editeurs: { id: string; nom: string; type: string | null; username: string | null; annonces: number }[];
  foncier: { ville: string; commune: string; zone: string; usage: string; priceSqm: number; priceMin: number; priceMax: number; source: string }[];
  sources: { libelles: Record<string, string>; catalogues: Catalogue[] };
  loyersSignes: { communes: number; baux: number };
  references: Reference[];
  minSample: number;
}
export interface Reference {
  id: number; source: string; url: string | null; publieLe: string | null; ville: string | null; commune: string | null; quartier: string | null; typeBien: string | null;
  transaction: Tx; unite: "mois" | "prix" | "m2"; valeur: number; valeurMin: number | null; valeurMax: number | null; note: string | null; saisiLe: string;
  mobooMedian?: number | null; ecartMoboo?: number | null;
}
export const UNITE: Record<Reference["unite"], string> = { mois: "loyer / mois", prix: "prix de vente", m2: "prix au m²" };
export interface Catalogue { key: string; label: string; total: number; actives: number; maj: string | null; plateformes: string[] }

export const F = (n: number | null | undefined) => (n == null ? "—" : `${Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ")} F`);
export const Fc = (n: number | null | undefined) => {
  if (n == null) return "—";
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: n >= 100_000_000 ? 0 : 1 })} M F`;
  return F(n);
};
export const pct = (p: number | null | undefined) => (p == null ? "" : Math.abs(p) < 0.5 ? "=" : `${p > 0 ? "+" : "−"}${Math.abs(p).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`);
export const variation = (now: number, before: number) => (before ? Math.round(((now - before) / before) * 1000) / 10 : null);
