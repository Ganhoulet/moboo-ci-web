import { notFound, redirect } from "next/navigation";
import { FICHE_TEMPLATE } from "@/lib/fiches/fiche";
import { DocumentPrint } from "@/components/backoffice/documents/document-print";
import { getDocument } from "../../actions";

export const dynamic = "force-dynamic";

export default async function DocumentPrintPage({ params }: { params: { id: string } }) {
  const doc = await getDocument(params.id);
  if (!doc) notFound();
  if (doc.template === FICHE_TEMPLATE) redirect(`/admin/fiches/${doc.id}`);
  return <DocumentPrint doc={doc} />;
}
