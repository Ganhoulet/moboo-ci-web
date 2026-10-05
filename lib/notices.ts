// Serveur uniquement. Informations ciblées (back-office → Centre marketing →
// Informations) : la liste en ligne vient de l'API (cache 30 s) et le site
// choisit celles du visiteur. N.B. même règle que l'API
// (moboo-resi-api/src/modules/site-notices/notice.util.ts).
import { API_URL } from "./api";
import { relayHeaders } from "./relay";
import { getSession } from "./session";

export const NOTICES_TAG = "site-notices";

export interface SiteNotice {
  id: string; title: string; body: string; kind: string; audiences: string[]; places: string[]; placements: string[];
  ctaLabel: string; ctaUrl: string; dismissible: boolean; pinned: boolean; version: string; date: string;
  personal?: boolean; read?: boolean;
}
interface Viewer { accountType?: string | null; accountSubtype?: string | null; city?: string | null; commune?: string | null }

function inAudience(key: string, v: Viewer | null) {
  if (!v) return key === "visiteurs";
  const t = v.accountType ?? "particulier";
  switch (key) {
    case "agents": return t === "agent";
    case "agences": return t === "entreprise";
    case "proprietaires": return t === "proprietaire";
    case "etablissements": return t === "etablissement";
    case "locataires": return t === "particulier" && v.accountSubtype !== "acheter";
    case "acheteurs": return t === "particulier" && v.accountSubtype === "acheter";
    default: return false;
  }
}
const norm = (s?: string | null) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

export function noticeMatches(n: Pick<SiteNotice, "audiences" | "places">, v: Viewer | null) {
  if (n.audiences.length && !n.audiences.some((a) => inAudience(a, v))) return false;
  if (n.places.length && v) {
    const mine = [norm(v.city), norm(v.commune)].filter(Boolean);
    if (!n.places.some((p) => mine.includes(norm(p)))) return false;
  }
  if (n.places.length && !v && !n.audiences.includes("visiteurs")) return false;
  return true;
}

async function live(): Promise<SiteNotice[]> {
  try {
    const r = await fetch(`${API_URL}/site/notices`, { next: { revalidate: 30, tags: [NOTICES_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    return r.ok ? ((await r.json()).items as SiteNotice[]) : [];
  } catch {
    return [];
  }
}

/** Bandeaux et pop-ups destinés au visiteur de la requête. */
export async function noticesForVisitor(): Promise<{ bandeau: SiteNotice[]; popup: SiteNotice[] }> {
  const items = await live();
  if (!items.length) return { bandeau: [], popup: [] };
  const s = getSession();
  const v = s ? { accountType: s.accountType, accountSubtype: s.accountSubtype, city: s.city, commune: s.commune } : null;
  const mine = items.filter((n) => noticeMatches(n, v));
  return { bandeau: mine.filter((n) => n.placements.includes("bandeau")), popup: mine.filter((n) => n.placements.includes("popup")) };
}
