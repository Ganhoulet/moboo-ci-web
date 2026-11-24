import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBuilder } from "@/components/builder/page-builder";
import { getTaxonomies } from "@/lib/taxonomies";
import { editablePage, normalizeSitePage } from "@/lib/site-editable";
import { getAdminPage } from "../../accueil/actions";
import { freePath, isFreeSlug, normalizeFree } from "@/lib/free-pages";

export const dynamic = "force-dynamic";

export default async function SitePageBuilder({ params, searchParams }: { params: { slug: string }; searchParams: { section?: string } }) {
  if (isFreeSlug(params.slug)) {
    const [page, tax] = await Promise.all([getAdminPage(params.slug), getTaxonomies()]);
    if (!page) notFound();
    const c = normalizeFree(page.draft ?? page.published, params.slug.slice(6));
    return (
      <div className="space-y-2">
        <Link href="/admin/pages-site" className="text-sm font-semibold text-brand-700 hover:underline">← Pages du site</Link>
        <PageBuilder initial={c.sections} meta={page} types={tax.type.map((t) => ({ value: t.slug, label: t.label }))} focus={searchParams.section}
          slug={params.slug} title={c.meta.title} previewPath={freePath(params.slug)} catalogKey="home" seo={{ title: c.meta.title, description: c.meta.description }} />
      </div>
    );
  }
  const def = editablePage(params.slug);
  if (!def) notFound();
  const [page, tax] = await Promise.all([getAdminPage(def.slug), getTaxonomies()]);
  const content = normalizeSitePage(page?.draft ?? page?.published ?? null);
  return (
    <div className="space-y-2">
      <Link href="/admin/pages-site" className="text-sm font-semibold text-brand-700 hover:underline">← Pages du site</Link>
      <PageBuilder initial={content.sections} meta={page} types={tax.type.map((t) => ({ value: t.slug, label: t.label }))} focus={searchParams.section}
        slug={def.slug} title={def.label} previewPath={def.path} catalogKey="page" />
    </div>
  );
}
