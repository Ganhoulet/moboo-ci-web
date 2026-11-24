import Link from "next/link";
import { notFound } from "next/navigation";
import { PageBuilder } from "@/components/builder/page-builder";
import { getTaxonomies } from "@/lib/taxonomies";
import { editablePage, normalizeSitePage } from "@/lib/site-editable";
import { getAdminPage } from "../../accueil/actions";

export const dynamic = "force-dynamic";

export default async function SitePageBuilder({ params, searchParams }: { params: { slug: string }; searchParams: { section?: string } }) {
  const def = editablePage(params.slug);
  if (!def) notFound();
  const [page, tax] = await Promise.all([getAdminPage(def.slug), getTaxonomies()]);
  const content = normalizeSitePage(page?.draft ?? page?.published ?? null);
  return (
    <div className="space-y-2">
      <Link href="/admin/pages-site" className="text-sm font-semibold text-brand-700 hover:underline">← Autres pages du site</Link>
      <PageBuilder initial={content.sections} meta={page} types={tax.type.map((t) => ({ value: t.slug, label: t.label }))} focus={searchParams.section}
        slug={def.slug} title={def.label} previewPath={def.path} catalogKey="page" />
    </div>
  );
}
