export interface SearchParams {
  transaction?: string;
  q?: string;
  city?: string;
  propertyType?: string;
  priceMin?: number;
  priceMax?: number;
}

export interface SavedSearch {
  id: string;
  label: string;
  params: SearchParams;
  alertsEnabled: boolean;
  lastNotifiedAt: string | null;
  createdAt: string;
}

/** Reconstruit l'URL /annonces à partir des critères d'une recherche. */
export function searchToHref(params: SearchParams): string {
  const p = new URLSearchParams();
  if (params.transaction) p.set("transaction", params.transaction);
  if (params.q) p.set("q", params.q);
  if (params.propertyType) p.set("propertyType", params.propertyType);
  if (params.priceMin) p.set("priceMin", String(params.priceMin));
  if (params.priceMax) p.set("priceMax", String(params.priceMax));
  return `/annonces${p.toString() ? `?${p}` : ""}`;
}
