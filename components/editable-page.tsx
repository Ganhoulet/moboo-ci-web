import Link from "next/link";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";
import { getHomeData, PAGES_TAG } from "@/lib/pages";
import { stripHidden, type PageContent } from "@/lib/page-blocks";
import { editablePage, normalizeSitePage, PAGE_CONTENT_TYPE, type EditableSlug } from "@/lib/site-editable";
import { HomeSection } from "@/components/home/sections";

async function loadSitePage(slug: string, draft: boolean): Promise<PageContent> {
  if (draft) {
    const r = await authedFetch(`/site/admin/pages/${slug}`, { method: "GET" }).catch(() => null);
    if (r?.ok && r.data) return normalizeSitePage(r.data.draft ?? r.data.published);
  }
  try {
    const r = await fetch(`${API_URL}/site/pages/${slug}`, { next: { revalidate: 60, tags: [PAGES_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) } });
    return normalizeSitePage(r.ok ? (await r.json())?.content : null);
  } catch {
    return normalizeSitePage(null);
  }
}

/**
 * Page du site composée dans le constructeur (Apparence › Autres pages du site) :
 * le contenu d'origine (children) entouré des blocs ajoutés, ou masqué.
 * Administrateur : bouton « Personnaliser » et aperçu du brouillon (?apercu=1).
 */
export async function EditablePage({ slug, apercu, children }: { slug: EditableSlug; apercu?: string | string[]; children: React.ReactNode }) {
  const isAdmin = !!getSession()?.isAdmin;
  const draft = isAdmin && apercu === "1";
  const page = await loadSitePage(slug, draft);
  const sections = page.sections.filter((s) => s.enabled);
  const builder = `/admin/pages-site/${slug}`;
  const needsData = sections.some((s) => s.type !== PAGE_CONTENT_TYPE);
  const data = needsData ? await getHomeData() : null;
  return (
    <>
      {draft ? (
        <div className="sticky top-16 z-30 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">
          Aperçu du brouillon — non visible des visiteurs. <Link href={builder} className="underline">Retour au constructeur</Link>
        </div>
      ) : null}
      {sections.map((s) =>
        s.type === PAGE_CONTENT_TYPE
          ? <div key={s.id} id={`section-${s.id}`}>{children}</div>
          : <HomeSection key={s.id} s={stripHidden(s)} data={data!} edit={isAdmin && !draft ? builder : false} />,
      )}
      {isAdmin && !draft ? (
        <Link href={builder} className="fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-2xl hover:bg-slate-800 print:hidden">
          ✎ Personnaliser « {editablePage(slug)?.label} »
        </Link>
      ) : null}
    </>
  );
}
