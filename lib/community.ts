// Partenaires, avis et forfaits du site (back-office → Immobilier). Lecture
// côté serveur ; partenaires et forfaits en cache 60 s, vidé à chaque
// modification dans le back-office.
import { API_URL } from "./api";
import { relayHeaders } from "./relay";

export const PARTNERS_TAG = "site-partners";
export const PACKAGES_TAG = "site-packages";

export interface Partner { id: string; name: string; logoUrl: string; url: string | null }

export interface Review { id: string; authorName: string; rating: number; title: string | null; comment: string; createdAt: string }
export interface ReviewSummary { enabled: boolean; count: number; average: number; distribution: number[]; items: Review[] }

export interface Package {
  id: string; name: string; description: string | null; price: number; durationDays: number;
  /** -1 = illimité */
  listings: number; featured: number; popular: boolean;
}
export interface PackageList {
  enabled: boolean; submissionMode?: "free" | "membership" | "per_listing"; requirePackage: boolean; freeListings: number;
  listingPrice?: number; featuredPrice?: number; termsUrl?: string; items: Package[];
}

async function get<T>(path: string, init: RequestInit & { next?: { revalidate?: number; tags?: string[] } }): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, { ...init, headers: { Accept: "application/json", ...relayHeaders(true) } });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function getPartners(): Promise<Partner[]> {
  return (await get<{ items: Partner[] }>("/site/partners", { next: { revalidate: 60, tags: [PARTNERS_TAG] } }))?.items ?? [];
}

export async function getPackages(): Promise<PackageList> {
  return (await get<PackageList>("/site/packages", { next: { revalidate: 60, tags: [PACKAGES_TAG] } }))
    ?? { enabled: false, requirePackage: false, freeListings: 0, items: [] };
}

export async function getReviews(type: "listing" | "pro", id: string): Promise<ReviewSummary> {
  return (await get<ReviewSummary>(`/site/reviews?type=${type}&id=${encodeURIComponent(id)}`, { cache: "no-store" }))
    ?? { enabled: false, count: 0, average: 0, distribution: [0, 0, 0, 0, 0], items: [] };
}

/** Durée d'un forfait comme sur moboo.ci : « 18 jours », « 1 mois », « 3 mois », « 1 an ». */
export function periodLabel(days: number) {
  if (days >= 365 && days % 365 === 0) return `${days / 365} an${days >= 730 ? "s" : ""}`;
  if (days >= 30 && days % 30 === 0) return `${days / 30} mois`;
  return `${days} jour${days > 1 ? "s" : ""}`;
}
export const sponsoredLabel = (n: number) => `${n} annonce${n > 1 ? "s" : ""} sponsorisée${n > 1 ? "s" : ""}`;

export const fcfa = (n: number) => `${Number(n || 0).toLocaleString("fr-FR").replace(/ | /g, " ")} FCFA`;

export const INVOICE_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "En attente", cls: "bg-amber-100 text-amber-800" },
  paid: { label: "Payée", cls: "bg-emerald-100 text-emerald-800" },
  cancelled: { label: "Annulée", cls: "bg-slate-200 text-slate-700" },
  failed: { label: "Échouée", cls: "bg-red-100 text-red-700" },
};
