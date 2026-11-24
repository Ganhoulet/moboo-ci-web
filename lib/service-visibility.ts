// Services masqués au back-office (Services Moboo › Réglages › Site) : leurs liens
// disparaissent de tout le site (menus, pied de page, boutons, cartes des pages
// du constructeur), pas seulement de la rangée « Services ». Un service masqué
// reste enregistré : il revient dès qu'on le réaffiche.

import { getSiteServices, SERVICE_SLUG, type ServiceKey } from "./site-services";

const OWN_HOSTS = /^(www\.)?(moboo\.ci|moboo-ci\.vercel\.app)$/i;

/** Chemin interne d'un lien (« /services/etat-des-lieux »), null pour un lien externe. */
function internalPath(href: string): string | null {
  const h = href.trim();
  if (!h) return null;
  let path = h;
  if (/^https?:\/\//i.test(h)) {
    try {
      const u = new URL(h);
      if (!OWN_HOSTS.test(u.hostname)) return null;
      path = u.pathname;
    } catch {
      return null;
    }
  } else if (!h.startsWith("/")) return null;
  path = path.split(/[?#]/)[0].replace(/\/+$/, "") || "/";
  return path.toLowerCase();
}

/** Adresses des services masqués (vide si l'API ne répond pas : on ne cache rien par erreur). */
export async function getHiddenServicePaths(): Promise<Set<string>> {
  const data = await getSiteServices();
  if (!data.ok) return new Set();
  const open = new Set(data.items.map((x) => x.key));
  const hidden = new Set<string>();
  for (const k of Object.keys(SERVICE_SLUG) as ServiceKey[]) if (!open.has(k)) hidden.add(`/services/${SERVICE_SLUG[k]}`);
  if (!open.size) hidden.add("/services");
  return hidden;
}

export function isHiddenServiceHref(href: unknown, hidden: Set<string>): boolean {
  if (!hidden.size || typeof href !== "string") return false;
  const p = internalPath(href);
  return !!p && hidden.has(p);
}

const LINK_KEY = /^(href|url|link)$/i;

/**
 * Retire d'un contenu (page, menus) tout ce qui mène à un service masqué :
 * élément de liste dont le lien vise ce service, ou bouton (« xxxHref » + « xxxLabel ») vidé.
 */
export function dropHiddenServiceLinks<T>(v: T, hidden: Set<string>): T {
  if (!hidden.size) return v;
  if (Array.isArray(v)) {
    return v
      .filter((x) => !(x && typeof x === "object" && !Array.isArray(x) && Object.entries(x).some(([k, h]) => LINK_KEY.test(k) && isHiddenServiceHref(h, hidden))))
      .map((x) => dropHiddenServiceLinks(x, hidden)) as T;
  }
  if (v && typeof v === "object") {
    const o: Record<string, any> = {};
    for (const [k, x] of Object.entries(v)) o[k] = dropHiddenServiceLinks(x, hidden);
    for (const k of Object.keys(o)) {
      if (k.endsWith("Href") && isHiddenServiceHref(o[k], hidden)) {
        o[k] = "";
        const label = k.slice(0, -4) + "Label";
        if (label in o) o[label] = "";
      }
    }
    return o as T;
  }
  return v;
}
