// Services Moboo proposés sur le site (état des lieux, estimations, solvabilité) :
// rangée de l'accueil et pages dédiées /services/<adresse>. Ordre, textes et
// activation réglés au back-office (Services Moboo › Réglages › Site).

import { API_URL } from "./api";
import { relayHeaders } from "./relay";

export const SITE_SERVICES_TAG = "site-services";

export type ToolKey = "edl" | "loyer" | "foncier" | "solvabilite";
export type MissionKey = "mise_en_location" | "gestion_locative" | "visite" | "bail" | "photos_annonce" | "avis_valeur" | "devis_travaux" | "verif_fonciere" | "panneau_qr";
export type ServiceKey = ToolKey | MissionKey;
export const MISSION_KEYS: MissionKey[] = ["mise_en_location", "gestion_locative", "visite", "bail", "photos_annonce", "avis_valeur", "devis_travaux", "verif_fonciere", "panneau_qr"];
export const isMissionKey = (k: string): k is MissionKey => (MISSION_KEYS as string[]).includes(k);
export interface SiteTile {
  enabled: boolean; icon: string; title: string; tagline: string; landingTitle: string; landingIntro: string;
  price: string; audience: string[]; dispatch: "moboo" | "agents"; proModules: string;
}
export interface ServiceTile extends SiteTile { key: ServiceKey }
export interface SiteServicesData { items: ServiceTile[]; solvency: { incomeMultiple: number; codeTtlMin: number } }

export const SERVICE_SLUG: Record<ServiceKey, string> = {
  edl: "etat-des-lieux", loyer: "estimation-loyer", foncier: "estimation-terrain", solvabilite: "solvabilite-locataire",
  mise_en_location: "mettre-en-location", gestion_locative: "gestion-locative", visite: "visite-a-distance", bail: "redaction-bail",
  photos_annonce: "photos-annonce", avis_valeur: "avis-de-valeur", devis_travaux: "devis-travaux", verif_fonciere: "verification-fonciere", panneau_qr: "panneau-a-louer",
};
export const SERVICE_LABEL: Record<ServiceKey, string> = {
  edl: "État des lieux", loyer: "Estimation de loyer", foncier: "Estimation de terrain", solvabilite: "Solvabilité locataire",
  mise_en_location: "Mise en location", gestion_locative: "Gestion locative", visite: "Visite pour vous", bail: "Bail & contrat",
  photos_annonce: "Photos & annonce", avis_valeur: "Avis de valeur", devis_travaux: "Devis travaux", verif_fonciere: "Vérification foncière", panneau_qr: "Panneau À louer + QR",
};
export const serviceHref = (k: ServiceKey) => `/services/${SERVICE_SLUG[k]}`;
export const serviceBySlug = (slug: string) => (Object.keys(SERVICE_SLUG) as ServiceKey[]).find((k) => SERVICE_SLUG[k] === slug) ?? null;

/** Services ouverts, dans l'ordre réglé (vide si l'API est injoignable). */
export async function getSiteServices(): Promise<SiteServicesData> {
  try {
    const r = await fetch(`${API_URL}/site/services`, { next: { revalidate: 120, tags: [SITE_SERVICES_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    if (r.ok) return (await r.json()) as SiteServicesData;
  } catch {
    /* repli ci-dessous */
  }
  return { items: [], solvency: { incomeMultiple: 3, codeTtlMin: 30 } };
}

export interface ZoneOption { ville: string; commune: string; zone: string }
export async function getServiceZones(kind: "loyer" | "foncier"): Promise<ZoneOption[]> {
  try {
    const r = await fetch(`${API_URL}/site/services/zones/${kind}`, { next: { revalidate: 3600, tags: [SITE_SERVICES_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    if (r.ok) return ((await r.json()) as { items: ZoneOption[] }).items ?? [];
  } catch {
    /* rien */
  }
  return [];
}
