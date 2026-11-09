import { PageBuilder } from "@/components/builder/page-builder";
import { normalizeHome } from "@/lib/page-blocks";
import { getTaxonomies } from "@/lib/taxonomies";
import { getHomeData } from "@/lib/pages";
import { getAdminPage } from "./actions";

export const dynamic = "force-dynamic";

export default async function HomeBuilder({ searchParams }: { searchParams: { section?: string } }) {
  const [page, tax, data] = await Promise.all([getAdminPage("home"), getTaxonomies(), getHomeData()]);
  // Types réellement utilisés par les annonces (dont ceux repris de moboo.ci) en plus de la liste du back-office.
  const known = new Set(tax.type.map((t) => t.slug));
  const types = [...tax.type.map((t) => ({ value: t.slug, label: t.label })), ...data.types.filter((t) => !known.has(t.slug)).map((t) => ({ value: t.slug, label: t.label }))];
  const content = normalizeHome(page?.draft ?? page?.published ?? null);
  return <PageBuilder initial={content.sections} meta={page} types={types} focus={searchParams.section} />;
}
