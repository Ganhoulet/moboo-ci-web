// Marqueurs de carte (module neutre : utilisé par le serveur et le navigateur).
import type { Property } from "./property";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  /** Texte de l'étiquette (prix) ; marqueur « épingle » si absent ou réglage « Icône d'adresse ». */
  label?: string;
  title?: string;
  href?: string;
  image?: string | null;
}

/** Prix court pour les étiquettes : 250 000 → « 250 k ». */
export function shortPrice(n: number | null | undefined) {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)} k`;
  return String(n);
}

export const toMarker = (p: Property): MapMarker | null =>
  p.lat != null && p.lng != null ? { id: p.id, lat: p.lat, lng: p.lng, label: shortPrice(p.price), title: p.title, href: p.href, image: p.image } : null;
