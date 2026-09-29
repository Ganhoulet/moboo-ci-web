import { SeoList } from "@/components/seo/seo-list";
import bundled from "@/lib/wp-seo-pages.json";
import { listSeoPages } from "./actions";

export const dynamic = "force-dynamic";

export default async function SeoPages() {
  return <SeoList items={await listSeoPages()} bundledCount={(bundled as unknown[]).length} />;
}
