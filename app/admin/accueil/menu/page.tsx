import { ChromeEditor } from "@/components/builder/chrome-editor";
import { normalizeChrome } from "@/lib/page-blocks";
import { getAdminPage } from "../actions";

export const dynamic = "force-dynamic";

export default async function ChromePage() {
  const page = await getAdminPage("chrome");
  return <ChromeEditor initial={normalizeChrome(page?.published ?? page?.draft ?? null)} />;
}
