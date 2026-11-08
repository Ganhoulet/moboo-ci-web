import { notFound } from "next/navigation";
import { DocumentPrint } from "@/components/backoffice/documents/document-print";
import { getDocument } from "../../actions";

export const dynamic = "force-dynamic";

export default async function DocumentPrintPage({ params }: { params: { id: string } }) {
  const doc = await getDocument(params.id);
  if (!doc) notFound();
  return <DocumentPrint doc={doc} />;
}
