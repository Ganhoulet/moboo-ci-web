import { NextResponse, type NextRequest } from "next/server";
import { findRedirect } from "./lib/redirects-edge";

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
// Identifiant anonyme du navigateur (anti-fraude : comptes multiples sur un même appareil).
const DID = "moboo_did";
// Portail des account managers (moboo.ci/am) : se souvient que l'on y travaille.
const PORTAL = "moboo_portal";
const AM_BASE = "/admin/comptes";

/**
 * Portail des account managers : /am/… affiche les écrans du suivi des comptes
 * (/admin/comptes/…) dans un cadre à part. Tant qu'on y travaille, les liens de
 * ces écrans vers /admin/comptes/… restent dans le portail ; ouvrir une autre
 * rubrique du back-office en sort. Les droits restent ceux de l'API.
 */
type Portal = { rewrite?: URL; redirect?: URL; cookie?: "set" | "clear" };
function portalOf(req: NextRequest): Portal {
  const p = req.nextUrl.pathname;
  const inPortal = req.cookies.get(PORTAL)?.value === "am";
  if (p === "/am" || p.startsWith("/am/")) {
    const url = req.nextUrl.clone();
    url.pathname = AM_BASE + p.slice(3);
    return { rewrite: url, cookie: inPortal ? undefined : "set" };
  }
  if (inPortal && (req.method === "GET" || req.method === "HEAD") && (p === AM_BASE || p.startsWith(AM_BASE + "/"))) {
    const url = req.nextUrl.clone();
    url.pathname = "/am" + p.slice(AM_BASE.length);
    return { redirect: url };
  }
  if (inPortal && p.startsWith("/admin") && (req.method === "GET" || req.method === "HEAD")) return { cookie: "clear" };
  return {};
}

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export async function middleware(req: NextRequest) {
  const known = req.cookies.get(DID)?.value;
  const did = known && /^[\w-]{16,64}$/.test(known) ? known : crypto.randomUUID();
  req.headers.set("x-moboo-did", did);
  // Adresse dédiée des account managers (am.moboo.ci) : l'accueil ouvre leur portail,
  // la connexion porte leur nom ; rien n'y est indexé par les moteurs de recherche.
  const amHost = /^am\./i.test((req.headers.get("host") || "").split(":")[0]);
  if (amHost) {
    req.headers.set("x-moboo-am-host", "1");
    if (req.nextUrl.pathname === "/") {
      const url = req.nextUrl.clone();
      url.pathname = "/am";
      return NextResponse.redirect(url, 307);
    }
  } else req.headers.delete("x-moboo-am-host");
  const portal = portalOf(req);
  if (portal.redirect) return NextResponse.redirect(portal.redirect, 307);
  const res = await handle(req, portal.rewrite);
  if (did !== known) res.cookies.set(DID, did, { ...cookieOpts, maxAge: 60 * 60 * 24 * 365 });
  if (portal.cookie === "set") res.cookies.set(PORTAL, "am", { ...cookieOpts, maxAge: 60 * 60 * 24 * 30 });
  if (portal.cookie === "clear") res.cookies.delete(PORTAL);
  if (amHost) res.headers.set("X-Robots-Tag", "noindex, nofollow");
  return res;
}

async function handle(req: NextRequest, rewrite?: URL): Promise<NextResponse> {
  // Anciennes adresses (WordPress) : redirection 301 avant tout le reste.
  if (req.method === "GET" || req.method === "HEAD") {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
    const r = await findRedirect(API_URL, req.nextUrl.pathname, req.nextUrl.searchParams, ip, req.headers.get("user-agent") || "");
    if (r) {
      const [target, code] = r;
      const url = /^https?:\/\//i.test(target) ? new URL(target) : new URL(target, req.nextUrl.origin);
      return NextResponse.redirect(url, code === 302 ? 302 : 301);
    }
    // Adresse avec « / » final (ex. anciens liens WordPress) : forme sans « / ».
    const p = req.nextUrl.pathname;
    if (p.length > 1 && p.endsWith("/")) {
      const url = new URL(req.url);
      url.pathname = p.replace(/\/+$/, "") || "/";
      return NextResponse.redirect(url.toString(), 308);
    }
  }
  // Chemin de la page pour les server components (SEO des pages existantes : lib/seo).
  req.headers.set("x-moboo-path", rewrite ? rewrite.pathname : req.nextUrl.pathname);
  if (rewrite) req.headers.set("x-moboo-portal", "am");
  else req.headers.delete("x-moboo-portal");
  const forward = () => (rewrite ? NextResponse.rewrite(rewrite, { request: { headers: req.headers } }) : NextResponse.next({ request: { headers: req.headers } }));
  const next = forward;
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
    const res = forward();
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
      : forward();
    res.cookies.delete(RT);
    res.cookies.delete(PROFILE);
    return res;
  }
  return next();
}

export const config = {
  // Pages uniquement (pas les fichiers statiques ni les images).
  // wp-json et wp-content : transmis tels quels (application Moboo.ci, anciens liens de photos), cf. next.config.
  matcher: ["/((?!_next/static|img$|\\.well-known|_next/image|favicon|icon|apple-icon|robots|sitemap|wp-json|api/v1/wp-json|wp-content/uploads|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml)$).*)"],
};
