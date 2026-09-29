import { PageBuilder } from "@/components/builder/page-builder";
import { normalizeHome } from "@/lib/page-blocks";
import { getTaxonomies } from "@/lib/taxonomies";
import { getAdminPage } from "./actions";

export const dynamic = "force-dynamic";

export default async function HomeBuilder({ searchParams }: { searchParams: { section?: string } }) {
  const [page, tax] = await Promise.all([getAdminPage("home"), getTaxonomies()]);
  const content = normalizeHome(page?.draft ?? page?.published ?? null);
  return <PageBuilder initial={content.sections} meta={page} types={tax.type.map((t) => ({ value: t.slug, label: t.label }))} focus={searchParams.section} />;
}
