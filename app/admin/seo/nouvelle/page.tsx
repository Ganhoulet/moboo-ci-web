import { SeoPageEditor } from "@/components/seo/seo-page-editor";
import { editorData } from "../editor-data";

export const dynamic = "force-dynamic";

export default async function NewSeoPage() {
  return <SeoPageEditor {...await editorData()} />;
}
