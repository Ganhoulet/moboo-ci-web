import { notFound } from "next/navigation";
import { SeoPageEditor } from "@/components/seo/seo-page-editor";
import { getSeoPageAdmin } from "../actions";
import { editorData } from "../editor-data";

export const dynamic = "force-dynamic";

export default async function EditSeoPage({ params }: { params: { id: string } }) {
  const [page, data] = await Promise.all([getSeoPageAdmin(params.id), editorData()]);
  if (!page) notFound();
  return <SeoPageEditor key={page.updatedAt} initial={page} {...data} />;
}
