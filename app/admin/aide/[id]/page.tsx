import { notFound } from "next/navigation";
import { HelpEditor } from "@/components/backoffice/help-editor";
import { getHelp } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditHelp({ params }: { params: { id: string } }) {
  const a = await getHelp(params.id);
  if (!a) notFound();
  return <HelpEditor audiences={a.audiences} hasOriginal={a.hasOriginal} builtin={a.builtin} stats={{ views: a.views, yes: a.helpfulYes, no: a.helpfulNo }}
    initial={{ id: a.id, slug: a.slug, audience: a.audience, category: a.category, kind: a.kind, title: a.title, summary: a.summary, body: a.body, sort: a.sort, status: a.status }} />;
}
