import { ChromeEditor } from "@/components/builder/chrome-editor";
import { normalizeChrome } from "@/lib/page-blocks";
import { getTaxonomies } from "@/lib/taxonomies";
import { getHomeData } from "@/lib/pages";
import { getAdminPage } from "../actions";

export const dynamic = "force-dynamic";

export default async function ChromePage() {
  const [page, tax, data] = await Promise.all([getAdminPage("chrome"), getTaxonomies(), getHomeData()]);
  const places = [...data.cities.map((c) => c.label), ...data.areas.map((a) => a.label)];
  return (
    <ChromeEditor
      initial={normalizeChrome(page?.published ?? page?.draft ?? null)}
      types={tax.type.map((t) => ({ value: t.slug, label: t.label }))}
      cities={Array.from(new Set(places)).map((p) => ({ value: p, label: p }))}
    />
  );
}
