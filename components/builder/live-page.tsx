import type { Section } from "@/lib/page-blocks";
import { getTaxonomies } from "@/lib/taxonomies";
import { getAdminPage } from "@/app/admin/accueil/actions";
import { LiveEditor, LiveSection } from "./live-editor";
import type { CatalogKey } from "./catalogs";

/**
 * Page en mode « Modifier sur la page » (administrateur, ?modifier=1) : le brouillon,
 * chaque bloc encadré et cliquable (y compris les blocs masqués, grisés).
 */
export async function LivePage({ slug, catalogKey, sections, extra, exitHref, builderHref, render }: {
  slug: string; catalogKey: CatalogKey; sections: Section[]; exitHref: string; builderHref: string;
  /** Autres champs du document à conserver à l'enregistrement (titre et description d'une page libre). */
  extra?: Record<string, unknown>;
  render: (s: Section) => React.ReactNode;
}) {
  const [meta, tax] = await Promise.all([getAdminPage(slug), getTaxonomies()]);
  return (
    <LiveEditor slug={slug} catalogKey={catalogKey} initial={sections} extra={extra} meta={meta} types={tax.type.map((t) => ({ value: t.slug, label: t.label }))}
      exitHref={exitHref} builderHref={builderHref}>
      {sections.map((s) => <LiveSection key={s.id} id={s.id}>{s.enabled ? render(s) : null}</LiveSection>)}
    </LiveEditor>
  );
}
