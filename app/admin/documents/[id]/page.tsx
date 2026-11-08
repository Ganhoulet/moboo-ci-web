import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/backoffice/documents/document-editor";
import { getDocument } from "../actions";

export const dynamic = "force-dynamic";

export default async function DocumentEditPage({ params }: { params: { id: string } }) {
  const doc = await getDocument(params.id);
  if (!doc) notFound();
  return <DocumentEditor key={doc.id} doc={doc} />;
}
