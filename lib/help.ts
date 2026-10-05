// Centre d'aide (moboo.ci/aide) : lecture depuis l'API, cache 60 s.
import { API_URL } from "./api";
import { relayHeaders } from "./relay";

export interface HelpAudience { key: string; title: string; short: string; description: string; icon: string; categories: string[]; guides?: number; faqs?: number }
export interface HelpCard { slug: string; audience: string; category: string; kind: "guide" | "faq"; title: string; summary: string; body?: string; audienceTitle?: string; excerpt?: string }
export interface HelpArticle extends HelpCard { body: string; updatedAt: string; audienceTitle: string; related: HelpCard[] }

async function get<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API_URL}/site/help${path}`, { next: { revalidate: 60, tags: ["site-help"] }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

export const getHelpHome = () => get<{ audiences: HelpAudience[]; popular: HelpCard[]; faqs: HelpCard[] }>("");
export const getHelpAudience = (key: string) => get<{ audience: HelpAudience; sections: { title: string; guides: HelpCard[] }[]; faqs: HelpCard[]; others: { key: string; title: string; icon: string }[] }>(`/audience/${encodeURIComponent(key)}`);
export const getHelpArticle = (slug: string) => get<HelpArticle>(`/article/${encodeURIComponent(slug)}`);
export const getHelpSitemap = () => get<{ slug: string; kind: string; updatedAt: string }[]>("/sitemap");

export async function searchHelp(q: string, log = true): Promise<{ q: string; results: HelpCard[] }> {
  try {
    const r = await fetch(`${API_URL}/site/help/search?q=${encodeURIComponent(q)}${log ? "" : "&log=0"}`, { cache: "no-store", headers: { Accept: "application/json", ...relayHeaders(true) } });
    return r.ok ? await r.json() : { q, results: [] };
  } catch {
    return { q, results: [] };
  }
}

/** Texte brut (descriptions, données structurées). */
export const helpPlain = (s: string) => s.replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[#>*_`]/g, "").replace(/\s+/g, " ").trim();
