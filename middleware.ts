import { NextResponse, type NextRequest } from "next/server";

/**
 * Renouvelle la session du compte AVANT l'affichage des pages (le seul endroit,
 * avec les actions, où les cookies peuvent être réécrits). Le jeton d'accès
 * (cookie moboo_at) expire au bout de 2 h ; le jeton de rafraîchissement
 * (moboo_rt, 30 j) sert alors à en obtenir un nouveau, sans reconnexion.
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://resi.moboo.ci/api/v1";
const AT = "moboo_at";
const RT = "moboo_rt";
const PROFILE = "moboo_profile";

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function middleware(req: NextRequest) {
  // Chemin de la page pour les server components (SEO des pages existantes : lib/seo).
  req.headers.set("x-moboo-path", req.nextUrl.pathname);
  const next = () => NextResponse.next({ request: { headers: req.headers } });
  const rt = req.cookies.get(RT)?.value;
  const hasAt = !!req.cookies.get(AT)?.value;
  if (hasAt || !rt) return next();

  let tokens: { accessToken?: string; refreshToken?: string; expiresIn?: number } | null = null;
  try {
    const key = process.env.SITE_RELAY_KEY;
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
    const r = await fetch(`${API_URL}/site/auth/refresh`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        // Limite de l'API comptée par visiteur (cf. lib/relay).
        ...(key ? { "X-Moboo-Relay-Key": key, ...(ip ? { "X-Moboo-Client-IP": ip } : {}) } : {}),
      },
      body: JSON.stringify({ refreshToken: rt }),
      cache: "no-store",
    });
    if (r.ok) tokens = await r.json();
    else if (r.status < 500) tokens = { };   // refus explicite : session terminée
  } catch {
    return next(); // API injoignable : on réessaiera à la page suivante
  }

  if (tokens?.accessToken && tokens.refreshToken) {
    // Les server components de CETTE requête voient déjà le nouveau jeton…
    req.cookies.set(AT, tokens.accessToken);
    req.cookies.set(RT, tokens.refreshToken);
    const res = NextResponse.next({ request: { headers: req.headers } });
    // … et le navigateur le garde pour les suivantes.
    res.cookies.set(AT, tokens.accessToken, { ...cookieOpts, maxAge: tokens.expiresIn ?? 7200 });
    res.cookies.set(RT, tokens.refreshToken, { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 });
    return res;
  }

  if (tokens) {
    // Session terminée : on nettoie ; l'espace compte renvoie vers la connexion.
    req.cookies.delete(RT);
    req.cookies.delete(PROFILE);
    const res = req.nextUrl.pathname.startsWith("/mon-espace")
      ? NextResponse.redirect(new URL("/compte", req.url))
      : NextResponse.next({ request: { headers: req.headers } });
    res.cookies.delete(RT);
    res.cookies.delete(PROFILE);
    return res;
  }
  return next();
}

export const config = {
  // Pages uniquement (pas les fichiers statiques ni les images).
  matcher: ["/((?!_next/static|\\.well-known|_next/image|favicon|icon|apple-icon|robots|sitemap|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"],
};
