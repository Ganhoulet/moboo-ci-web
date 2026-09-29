import { getTaxonomies } from "@/lib/taxonomies";
import { listSeoPages } from "./actions";

/** Données de l'éditeur : types de bien, onglets et colonnes déjà utilisés. */
export async function editorData() {
  const [tax, rows] = await Promise.all([getTaxonomies(), listSeoPages()]);
  const uniq = (v: (string | null)[]) => Array.from(new Set(v.filter(Boolean) as string[])).sort();
  return {
    types: tax.type.map((t) => ({ value: t.slug, label: t.label })),
    tabs: uniq(rows.map((r) => r.hubTab)),
    columns: uniq(rows.map((r) => r.hubColumn)),
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "https://moboo.ci").replace(/\/+$/, ""),
  };
}
