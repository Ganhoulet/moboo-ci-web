// Redirections des anciennes adresses (WordPress) — exécuté dans le middleware (edge).
// Liste des redirections actives gardée en mémoire 60 s ; les adresses au format
// WordPress inconnues de la liste sont résolues une fois par l'API (règles automatiques).

type Entry = [target: string, code: number];
let cache: { at: number; map: Map<string, Entry> } | null = null;
let loading: Promise<void> | null = null;

const WP_LIKE = /^\/(property|properties|propriete|listing|agent|agency|agence|property-(type|status|city|area|state|feature|label)|author|my-account|mon-compte|dashboard|tableau-de-bord|user-dashboard|my-profile|my-properties|favorite-properties|saved-searches|add-new-property|create-listing|submit-property|packages|membership|memberships|abonnement|abonnements|tarifs-abonnement|login|register|sign-up|wp-login\.php|wp-admin|privacy-policy|politique-de-confidentialite|search-results|advanced-search|half-map|for-rent|for-sale|a-louer|a-vendre)(\/|$)/;
const SKIP = /^\/(_next|api|admin|administration|mon-espace|annonce\/|connexion|compte)(\/|$)/;

export function normalizePath(raw: string): string {
  let p = raw.split("?")[0];
  try { p = decodeURIComponent(p); } catch { /* tel quel */ }
  p = ("/" + p).replace(/\/{2,}/g, "/").toLowerCase();
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
}

function relayHeaders(ip: string): Record<string, string> {
  const key = process.env.SITE_RELAY_KEY;
  return { Accept: "application/json", ...(key ? { "X-Moboo-Relay-Key": key, ...(ip ? { "X-Moboo-Client-IP": ip } : {}) } : {}) };
}

async function load(api: string) {
  try {
    const r = await fetch(`${api}/site/redirects/map`, { headers: relayHeaders(""), signal: AbortSignal.timeout(2500) });
    if (!r.ok) throw new Error(String(r.status));
    const d = (await r.json()) as { items: [string, string, number][] };
    cache = { at: Date.now(), map: new Map(d.items.map(([s, t, c]) => [s, [t, c]])) };
  } catch {
    // API indisponible : on garde l'ancienne liste et on ne réessaie qu'une minute plus tard
    // (sinon chaque visite attendrait le délai d'expiration).
    cache = { at: Date.now(), map: cache?.map ?? new Map() };
  }
}

/** Destination d'une ancienne adresse, ou null. */
export async function findRedirect(api: string, pathname: string, search: URLSearchParams, ip: string): Promise<Entry | null> {
  if (SKIP.test(pathname)) return null;
  if (!cache || Date.now() - cache.at > 60_000) {
    // Une fois par minute au plus : on attend la liste à jour (2,5 s max ; sinon l'ancienne sert).
    loading ??= load(api).finally(() => { loading = null; });
    await loading;
  }
  const path = normalizePath(pathname);
  const shortLink = path === "/" && /^\d{1,10}$/.test(search.get("p") || "");
  const hit = cache?.map.get(shortLink ? `__p${search.get("p")}` : path);
  if (hit) return hit;
  // Liens courts WordPress (?p=123) ou adresse au format WordPress pas encore connue.
  if (!shortLink && !WP_LIKE.test(path)) return null;
  try {
    const qs = new URLSearchParams({ path: pathname });
    for (const k of ["p", "property_id", "post", "listing_id"]) { const v = search.get(k); if (v) qs.set(k, v); }
    const r = await fetch(`${api}/site/redirects/resolve?${qs}`, { headers: relayHeaders(ip), signal: AbortSignal.timeout(2500) });
    if (!r.ok) return null;
    const d = (await r.json()) as { target: string; code: number };
    if (!d.target || d.code === 404) return null;
    cache?.map.set(path === "/" ? `__p${search.get("p")}` : path, [d.target, d.code]);
    return [d.target, d.code];
  } catch {
    return null;
  }
}
