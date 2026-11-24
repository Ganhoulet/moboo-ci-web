// Pages libres créées au back-office (façon WordPress) : moboo.ci/pages/<adresse>,
// composées avec les blocs de l'accueil et modifiables directement sur le site.
import { API_URL } from "./api";
import { relayHeaders } from "./relay";
import { PAGES_TAG } from "./pages";
import { blockDef, type Section } from "./page-blocks";

export const FREE_PREFIX = "libre-";
export const freeSlug = (path: string) => FREE_PREFIX + path;
export const freePath = (slug: string) => `/pages/${slug.slice(FREE_PREFIX.length)}`;
export const isFreeSlug = (slug: string) => /^libre-[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(slug);

export interface FreeMeta { title: string; description: string; noindex?: boolean }
export interface FreePage { sections: Section[]; meta: FreeMeta }

export function normalizeFree(c: any, path: string): FreePage {
  const sections: Section[] = Array.isArray(c?.sections)
    ? c.sections.filter((s: any) => s && blockDef(s.type)).map((s: Section) => ({ ...s, props: { ...structuredClone(blockDef(s.type)!.defaults), ...(s.props ?? {}) } }))
    : [];
  const m = c?.meta ?? {};
  return { sections, meta: { title: String(m.title || path), description: String(m.description || ""), noindex: !!m.noindex } };
}

/** Page libre publiée (null : inexistante ou jamais publiée). */
export async function getFreePage(path: string): Promise<FreePage | null> {
  if (!isFreeSlug(freeSlug(path))) return null;
  try {
    const r = await fetch(`${API_URL}/site/pages/${freeSlug(path)}`, { next: { revalidate: 60, tags: [PAGES_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    const content = r.ok ? (await r.json())?.content : null;
    return content ? normalizeFree(content, path) : null;
  } catch {
    return null;
  }
}

/** Pages libres en ligne (plan du site). */
export async function getFreeSitemap(): Promise<{ path: string; title: string; publishedAt: string | null }[]> {
  try {
    const r = await fetch(`${API_URL}/site/pages-libres`, { next: { revalidate: 300, tags: [PAGES_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}
