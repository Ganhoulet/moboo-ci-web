// Pages « Moboo.ci pour les professionnels » : contenu publié (ou brouillon pour l'aperçu), chiffres réels.
import { API_URL } from "./api";
import { relayHeaders } from "./relay";
import { PAGES_TAG } from "./pages";
import { authedFetch } from "./server-api";
import { normalizePro, type ProContent, type ProSlug } from "./pro-blocks";

export type ProStats = Record<"listings" | "pros" | "searches30" | "inquiries30" | "cities" | "views30", number>;

export async function getProPage(slug: ProSlug, preview = false): Promise<ProContent> {
  if (preview) {
    const r = await authedFetch(`/site/admin/pages/${slug}`, { method: "GET" }).catch(() => null);
    if (r?.ok && r.data?.draft) return normalizePro(slug, r.data.draft);
  }
  try {
    const r = await fetch(`${API_URL}/site/pages/${slug}`, { next: { revalidate: 60, tags: [PAGES_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    return normalizePro(slug, r.ok ? (await r.json())?.content : null);
  } catch {
    return normalizePro(slug, null);
  }
}

export async function getProStats(): Promise<ProStats | null> {
  try {
    const r = await fetch(`${API_URL}/site/pro-stats`, { next: { revalidate: 600 }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}
