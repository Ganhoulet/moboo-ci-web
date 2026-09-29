// N.B. module serveur uniquement (utilise next/headers) — importé par des
// server components et server actions.
import { cookies } from "next/headers";
import "./client-ip"; // adresse du visiteur transmise à l'API (lib/relay)
import type { SiteAccount, SiteTokens } from "./api";

/**
 * Session consommateur côté serveur, stockée dans des cookies httpOnly.
 * - moboo_at : access token (Bearer) pour les appels authentifiés au moteur
 * - moboo_rt : refresh token (rotation)
 * - moboo_profile : instantané du profil (affichage header/compte, sans réseau)
 */
const AT = "moboo_at";
const RT = "moboo_rt";
const PROFILE = "moboo_profile";

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export function setSession(tokens: SiteTokens, account: SiteAccount) {
  const jar = cookies();
  jar.set(AT, tokens.accessToken, { ...baseCookie, maxAge: tokens.expiresIn ?? 7200 });
  jar.set(RT, tokens.refreshToken, { ...baseCookie, maxAge: 60 * 60 * 24 * 30 });
  jar.set(PROFILE, JSON.stringify(account), { ...baseCookie, maxAge: 60 * 60 * 24 * 30 });
}

/** Met à jour uniquement les jetons (après un refresh), sans toucher au profil. */
export function setTokens(accessToken: string, refreshToken: string, expiresIn?: number) {
  const jar = cookies();
  jar.set(AT, accessToken, { ...baseCookie, maxAge: expiresIn ?? 7200 });
  jar.set(RT, refreshToken, { ...baseCookie, maxAge: 60 * 60 * 24 * 30 });
}

/** Met à jour l'instantané du profil (après complétion / modification). */
export function setProfile(account: SiteAccount) {
  cookies().set(PROFILE, JSON.stringify(account), { ...baseCookie, maxAge: 60 * 60 * 24 * 30 });
}

export function clearSession() {
  const jar = cookies();
  jar.delete(AT);
  jar.delete(RT);
  jar.delete(PROFILE);
}

/** Profil courant (depuis le cookie snapshot). null si non connecté. */
export function getSession(): SiteAccount | null {
  const raw = cookies().get(PROFILE)?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SiteAccount;
  } catch {
    return null;
  }
}

export function getAccessToken(): string | null {
  return cookies().get(AT)?.value ?? null;
}

export function getRefreshToken(): string | null {
  return cookies().get(RT)?.value ?? null;
}

/** Nom d'affichage court + initiales pour l'avatar. */
export function displayName(a: SiteAccount): string {
  const full = [a.firstName, a.lastName].filter(Boolean).join(" ").trim();
  return full || a.phone;
}

export function initials(a: SiteAccount): string {
  const f = (a.firstName || "").trim();
  const l = (a.lastName || "").trim();
  if (f || l) return `${f[0] ?? ""}${l[0] ?? ""}`.toUpperCase() || "•";
  // Sinon, 2 derniers chiffres du numéro.
  const d = a.phone.replace(/[^0-9]/g, "");
  return d.slice(-2) || "•";
}
