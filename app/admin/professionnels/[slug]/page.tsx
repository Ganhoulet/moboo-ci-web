import { notFound } from "next/navigation";
import { PageBuilder } from "@/components/builder/page-builder";
import { getAdminPage } from "@/app/admin/accueil/actions";
import { normalizePro, proPage, type ProSlug } from "@/lib/pro-blocks";
import { getTaxonomies } from "@/lib/taxonomies";

export const dynamic = "force-dynamic";

/** Constructeur d'une page de l'espace professionnels. */
export default async function ProBuilder({ params, searchParams }: { params: { slug: string }; searchParams: { section?: string } }) {
  const p = proPage(params.slug);
  if (!p) notFound();
  const [page, tax] = await Promise.all([getAdminPage(p.slug), getTaxonomies()]);
  const content = normalizePro(p.slug as ProSlug, page?.draft ?? page?.published ?? null);
  return (
    <PageBuilder initial={content.sections} meta={page} types={tax.type.map((t) => ({ value: t.slug, label: t.label }))} focus={searchParams.section}
      slug={p.slug} title={`Pros — ${p.label}`} previewPath={p.path} catalogKey="pros" seo={content.meta} />
  );
}
