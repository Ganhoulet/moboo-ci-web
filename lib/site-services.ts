// Services Moboo proposés sur le site (état des lieux, estimations, solvabilité) :
// rangée de l'accueil et pages dédiées /services/<adresse>. Ordre, textes et
// activation réglés au back-office (Services Moboo › Réglages › Site).

import { API_URL } from "./api";
import { relayHeaders } from "./relay";

export const SITE_SERVICES_TAG = "site-services";

export type ServiceKey = "edl" | "loyer" | "foncier" | "solvabilite";
export interface SiteTile { enabled: boolean; icon: string; title: string; tagline: string; landingTitle: string; landingIntro: string }
export interface ServiceTile extends SiteTile { key: ServiceKey }
export interface SiteServicesData { items: ServiceTile[]; solvency: { incomeMultiple: number; codeTtlMin: number } }

export const SERVICE_SLUG: Record<ServiceKey, string> = {
  edl: "etat-des-lieux", loyer: "estimation-loyer", foncier: "estimation-terrain", solvabilite: "solvabilite-locataire",
};
export const SERVICE_LABEL: Record<ServiceKey, string> = {
  edl: "État des lieux", loyer: "Estimation de loyer", foncier: "Estimation de terrain", solvabilite: "Solvabilité locataire",
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
