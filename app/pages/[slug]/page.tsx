import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import { getHomeData } from "@/lib/pages";
import { freeSlug, getFreePage, isFreeSlug, normalizeFree, type FreePage } from "@/lib/free-pages";
import { HomeSection } from "@/components/home/sections";
import { LivePage } from "@/components/builder/live-page";
import { EditButtons } from "@/components/builder/edit-buttons";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string }; searchParams: { apercu?: string; modifier?: string } };

/** Brouillon pour l'administrateur (aperçu ou modification), sinon version publiée. */
async function load({ params, searchParams }: Props): Promise<{ page: FreePage | null; admin: boolean; draft: boolean; live: boolean }> {
  const path = params.slug.toLowerCase();
  const admin = !!getSession()?.isAdmin;
  const live = admin && searchParams.modifier === "1";
  const draft = admin && (live || searchParams.apercu === "1");
  if (!isFreeSlug(freeSlug(path))) return { page: null, admin, draft, live };
  if (draft) {
    const r = await authedFetch(`/site/admin/pages/${freeSlug(path)}`, { method: "GET" }).catch(() => null);
    const c = r?.ok ? (r.data?.draft ?? r.data?.published) : null;
    if (c) return { page: normalizeFree(c, path), admin, draft, live };
  }
  return { page: await getFreePage(path), admin, draft: false, live: false };
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { page, draft } = await load(props);
  if (!page) return { title: "Page introuvable", robots: { index: false } };
  return {
    title: page.meta.title, description: page.meta.description || undefined,
    alternates: { canonical: `/pages/${props.params.slug.toLowerCase()}` },
    robots: draft || page.meta.noindex ? { index: false, follow: true } : undefined,
  };
}

/** Page libre (back-office › Apparence › Pages du site › Pages libres). */
export default async function FreePageView(props: Props) {
  const { page, admin, draft, live } = await load(props);
  if (!page) notFound();
  const path = `/pages/${props.params.slug.toLowerCase()}`;
  const slug = freeSlug(props.params.slug.toLowerCase());
  const builder = `/admin/pages-site/${slug}`;
  const data = await getHomeData();
  if (live) {
    return <LivePage slug={slug} catalogKey="home" sections={page.sections} extra={{ meta: page.meta }} exitHref={path} builderHref={builder}
      render={(s) => <HomeSection s={s} data={data} />} />;
  }
  return (
    <div>
      {draft ? (
        <div className="sticky top-16 z-30 bg-amber-400 px-4 py-2 text-center text-sm font-semibold text-amber-950">
          Aperçu du brouillon — non visible des visiteurs. <Link href={builder} className="underline">Retour au constructeur</Link>
        </div>
      ) : null}
      {page.sections.map((s) => <HomeSection key={s.id} s={s} data={data} edit={admin && !draft ? builder : false} />)}
      {!page.sections.some((s) => s.enabled) ? <div className="container-page py-20 text-center text-muted">Cette page est vide pour le moment.</div> : null}
      {admin && !draft ? <EditButtons live={`${path}?modifier=1`} builder={builder} /> : null}
    </div>
  );
}
