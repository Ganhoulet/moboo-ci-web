import { notFound } from "next/navigation";
import { SeoPageEditor } from "@/components/seo/seo-page-editor";
import { BottomTextEditor } from "@/components/seo/bottom-text-editor";
import { getBottomTextAction, getSeoPageAdmin } from "../actions";
import { editorData } from "../editor-data";

export const dynamic = "force-dynamic";

export default async function EditSeoPage({ params }: { params: { id: string } }) {
  const [page, data, bottom] = await Promise.all([getSeoPageAdmin(params.id), editorData(), getBottomTextAction(params.id)]);
  if (!page) notFound();
  return (
    <div className="space-y-5">
      <SeoPageEditor key={page.updatedAt} initial={page} {...data} />
      {page.kind === "landing" ? (
        <div id="texte-du-bas" className="xl:max-w-[calc(100%-440px)]">
          <BottomTextEditor key={bottom?.text?.updatedAt ?? "vide"} id={page.id} title={page.title.replace(/ : prix, annonces et vie de quartier$/, "")} initial={bottom?.text ?? null} facts={bottom?.facts ?? null} />
        </div>
      ) : null}
    </div>
  );
}
