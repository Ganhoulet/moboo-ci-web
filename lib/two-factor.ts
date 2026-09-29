// N.B. module serveur uniquement (next/headers) : étape « double authentification »
// entre le mot de passe / code téléphone / Google et l'ouverture de la session.
import { cookies } from "next/headers";

export type TwoFactorMethod = "totp" | "email" | "backup";

export interface PendingTwoFactor {
  challenge: string;
  methods: TwoFactorMethod[];
  preferred: TwoFactorMethod;
  email: string | null;
  emailSent: boolean;
  /** Page à ouvrir une fois connecté (ex. /admin). */
  next: string;
}

const COOKIE = "moboo_2fa";
export const TWO_FACTOR_PAGE = "/connexion/verification";

/** Chemin interne uniquement (évite les redirections ouvertes). */
export const safeNext = (n: unknown, fallback = "/mon-espace") => {
  const s = String(n || "");
  return s.startsWith("/") && !s.startsWith("//") && !s.startsWith("/\\") ? s : fallback;
};

/** Réponse de connexion « défi 2FA » → mémorise l'étape et renvoie la page de vérification. */
export function startTwoFactor(data: any, next: string): string {
  const p: PendingTwoFactor = {
    challenge: String(data.challenge),
    methods: Array.isArray(data.methods) ? data.methods : ["totp"],
    preferred: data.preferred ?? "totp",
    email: data.email ?? null,
    emailSent: !!data.emailSent,
    next: safeNext(next),
  };
  cookies().set(COOKIE, JSON.stringify(p), {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600,
  });
  return TWO_FACTOR_PAGE;
}

export function getPendingTwoFactor(): PendingTwoFactor | null {
  const raw = cookies().get(COOKIE)?.value;
  if (!raw) return null;
  try { return JSON.parse(raw) as PendingTwoFactor; } catch { return null; }
}

export function clearPendingTwoFactor() {
  cookies().delete(COOKIE);
}
