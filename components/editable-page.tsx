import Link from "next/link";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";
import { getHomeData, PAGES_TAG } from "@/lib/pages";
import { stripHidden, type PageContent } from "@/lib/page-blocks";
import { editablePage, normalizeSitePage, PAGE_CONTENT_TYPE, type EditableSlug } from "@/lib/site-editable";
import { HomeSection } from "@/components/home/sections";
import { LivePage } from "@/components/builder/live-page";
import { EditButtons } from "@/components/builder/edit-buttons";

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
export async function EditablePage({ slug, apercu, modifier, children }: { slug: EditableSlug; apercu?: string | string[]; modifier?: string | string[]; children: React.ReactNode }) {
  const isAdmin = !!getSession()?.isAdmin;
  const live = isAdmin && modifier === "1";
  const draft = isAdmin && (apercu === "1" || live);
  const page = await loadSitePage(slug, draft);
  const sections = page.sections.filter((s) => s.enabled);
  const builder = `/admin/pages-site/${slug}`;
  const path = editablePage(slug)?.path ?? "/";
  const needsData = (live ? page.sections : sections).some((s) => s.type !== PAGE_CONTENT_TYPE);
  const data = needsData ? await getHomeData() : null;
  if (live) {
    return <LivePage slug={slug} catalogKey="page" sections={page.sections} exitHref={path} builderHref={builder}
      render={(s) => (s.type === PAGE_CONTENT_TYPE ? children : <HomeSection s={stripHidden(s)} data={data!} />)} />;
  }
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
      {isAdmin && !draft ? <EditButtons live={`${path}?modifier=1`} builder={builder} /> : null}
    </>
  );
}
