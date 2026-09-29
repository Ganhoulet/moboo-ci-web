import type {
  Espace,
  EspaceDetail,
  ListingItem,
  Paginated,
  Residence,
  ResidenceDetail,
} from "./types";

/**
 * Client du moteur NestJS (module `marketplace`, endpoints publics).
 * Base configurable via NEXT_PUBLIC_API_URL (inclut /api/v1).
 */
import { relayHeaders } from "./relay";

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "https://resi.moboo.ci/api/v1";

async function apiGet<T>(path: string, revalidate = 60): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    next: { revalidate },
    headers: { Accept: "application/json", ...relayHeaders(false) },
  });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return (await res.json()) as T;
}

/** Résidences meublées publiées sur la marketplace. Ne casse jamais le rendu. */
export async function listResidences(params?: {
  city?: string;
  q?: string;
  page?: number;
  perPage?: number;
}): Promise<Paginated<Residence>> {
  const q = new URLSearchParams();
  if (params?.city) q.set("city", params.city);
  if (params?.q) q.set("q", params.q);
  if (params?.page) q.set("page", String(params.page));
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
  q?: string;
  page?: number;
  perPage?: number;
}): Promise<Paginated<Espace>> {
  const q = new URLSearchParams();
  if (params?.commune) q.set("commune", params.commune);
  if (params?.type) q.set("type", params.type);
  if (params?.q) q.set("q", params.q);
  if (params?.page) q.set("page", String(params.page));
  q.set("perPage", String(params?.perPage ?? 24));
  try {
    return await apiGet<Paginated<Espace>>(`/marketplace/espaces?${q}`);
  } catch {
    return { total: 0, page: 1, perPage: 0, items: [] };
  }
}

/** Annonces classiques à louer / à vendre (filtres + pagination serveur). */
export async function listListings(params?: {
  transaction?: "rent" | "sale";
  city?: string;
  q?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  listingKind?: string;
  page?: number;
  perPage?: number;
  sort?: string;
  bbox?: string;
  map?: boolean;
}): Promise<Paginated<ListingItem>> {
  const q = new URLSearchParams();
  if (params?.sort) q.set("sort", params.sort);
  if (params?.bbox) q.set("bbox", params.bbox);
  if (params?.map) q.set("map", "1");
  if (params?.transaction) q.set("transaction", params.transaction);
  if (params?.city) q.set("city", params.city);
  if (params?.q) q.set("q", params.q);
  if (params?.priceMin) q.set("priceMin", String(params.priceMin));
  if (params?.priceMax) q.set("priceMax", String(params.priceMax));
  if (params?.propertyType) q.set("propertyType", params.propertyType);
  if (params?.listingKind) q.set("listingKind", params.listingKind);
  if (params?.page) q.set("page", String(params.page));
  q.set("perPage", String(params?.perPage ?? 24));
  try {
    return await apiGet<Paginated<ListingItem>>(`/marketplace/properties?${q}`, 30);
  } catch {
    return { total: 0, page: 1, perPage: 0, items: [] };
  }
}

/** Détail d'une annonce. null si introuvable. */
export async function getListing(id: string): Promise<ListingItem | null> {
  try {
    return await apiGet<ListingItem>(`/marketplace/properties/${encodeURIComponent(id)}`);
  } catch {
    return null;
  }
}

export interface ProProfile {
  username: string;
  name: string;
  firstName: string | null;
  accountType: string;
  accountSubtype: string | null;
  commune: string | null;
  city: string | null;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  instagram: string | null;
  tiktok: string | null;
  linkedin: string | null;
  memberSince: string;
  verified?: boolean;
  listings: ListingItem[];
}

/** Page publique d'un pro (agent, agence, propriétaire). null si introuvable. */
export async function getPro(username: string): Promise<ProProfile | null> {
  try {
    return await apiGet<ProProfile>(`/marketplace/pros/${encodeURIComponent(username)}`, 60);
  } catch {
    return null;
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

// ─── Auth consommateur (OTP) ──────────────────────────────────────────────
export interface SiteAccount {
  id: string;
  phone: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  locale: string;
  createdAt: string;
  // Type de compte (inscription par étapes) — cf. lib/accounts.ts
  accountType?: string;
  accountSubtype?: string | null;
  accountRole?: string | null;
  username?: string | null;
  companyName?: string | null;
  city?: string | null;
  commune?: string | null;
  onboarded?: boolean;
  avatarUrl?: string | null;
  bio?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  // Connexion au choix
  hasPassword?: boolean;
  googleLinked?: boolean;
  isAdmin?: boolean;       // accès au back-office (/admin)
  verified?: boolean;      // compte vérifié (badge)
}

/** Profil saisi pendant l'inscription (envoyé à la vérification du code). */
export interface SignupProfile {
  accountType?: string;
  accountSubtype?: string;
  accountRole?: string;
  username?: string;
  email?: string;
  companyName?: string;
  city?: string;
  commune?: string;
  firstName?: string;
  lastName?: string;
}

export interface SiteTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  isNew?: boolean;
  account?: SiteAccount;
}

async function apiPost<T>(path: string, body: unknown, token?: string): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...relayHeaders(true),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

export function siteRequestOtp(phone: string, deviceId?: string) {
  return apiPost<{ sent: boolean; channel: string; expiresIn: number; devCode?: string }>(
    "/site/auth/request-otp",
    { phone, deviceId },
  );
}

export function siteVerifyOtp(input: {
  phone: string;
  code: string;
  deviceId?: string;
  googleTicket?: string;
} & SignupProfile) {
  return apiPost<SiteTokens>("/site/auth/verify-otp", input);
}

/**
 * Connexion par identifiant (nom d'utilisateur, e-mail ou numéro) + mot de
 * passe. kind « agent » : identifiants moboo.ci d'un agent de la reprise WP.
 */
export function sitePasswordLogin(identifier: string, password: string) {
  return apiPost<any>("/site/auth/login", { identifier, password });
}

/** « Continuer avec Google » : connexion, ou numéro à confirmer une fois (need_phone). */
export function siteGoogleLogin(credential: string) {
  return apiPost<any>("/site/auth/google", { credential });
}

/** Inscription : nom d'utilisateur / e-mail disponibles ? numéro déjà inscrit ? */
export function siteCheckSignup(input: { username?: string; email?: string; phone?: string }) {
  return apiPost<{ usernameAvailable: boolean; emailAvailable: boolean; phoneRegistered: boolean; phoneOnboarded: boolean }>(
    "/site/auth/check-signup",
    input,
  );
}

export function siteLogout(refreshToken?: string) {
  return apiPost("/site/auth/logout", { refreshToken });
}

/** Demande de contact ou de visite sur une annonce. */
export function submitInquiry(input: {
  listingId?: string;
  name: string;
  phone: string;
  email?: string;
  message?: string;
  kind?: "contact" | "visit" | "reservation";
  preferredDate?: string;
}, token?: string | null) {
  // Connecté : la demande ouvre un fil dans « Messages » rattaché au compte.
  return apiPost<{ id: string; ok: boolean; conversationId?: string | null }>("/marketplace/inquiries", input, token ?? undefined);
}

/** Profil du compte connecté (Authorization: Bearer). */
export async function siteGetMe(token: string): Promise<SiteAccount | null> {
  try {
    const res = await fetch(`${API_URL}/site/auth/me`, {
      headers: { Accept: "application/json", ...relayHeaders(true), Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SiteAccount;
  } catch {
    return null;
  }
}

export interface OccupiedRange { from: string; to: string }

/** Dates déjà réservées d'un logement (pour le calendrier). Ne casse jamais le rendu. */
export async function getApartmentOccupied(apartmentId: string): Promise<OccupiedRange[]> {
  try {
    const r = await apiGet<{ ranges: OccupiedRange[] }>(`/marketplace/apartments/${encodeURIComponent(apartmentId)}/occupied`, 30);
    return r.ranges ?? [];
  } catch {
    return [];
  }
}

/** Dates déjà réservées d'un espace événementiel. */
export async function getEspaceOccupied(espaceId: string): Promise<OccupiedRange[]> {
  try {
    const r = await apiGet<{ ranges: OccupiedRange[] }>(`/marketplace/espaces/${encodeURIComponent(espaceId)}/occupied`, 30);
    return r.ranges ?? [];
  } catch {
    return [];
  }
}

/** Formate un montant en FCFA (XOF), sans décimales. Accepte number | string. */
export function formatXOF(n: number | string | null | undefined): string {
  const v = typeof n === "string" ? Number(n) : n;
  if (v == null || Number.isNaN(v)) return "—";
  return new Intl.NumberFormat("fr-FR").format(Math.round(v)) + " FCFA";
}
