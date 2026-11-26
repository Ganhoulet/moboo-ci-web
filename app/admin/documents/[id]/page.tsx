import { notFound, redirect } from "next/navigation";
import { FICHE_TEMPLATE } from "@/lib/fiches/fiche";
import { DocumentEditor } from "@/components/backoffice/documents/document-editor";
import { hasZoneBlocks } from "@/lib/documents/zone";
import { getDocument, listDocZones } from "../actions";

export const dynamic = "force-dynamic";

export default async function DocumentEditPage({ params }: { params: { id: string } }) {
  const doc = await getDocument(params.id);
  if (!doc) notFound();
  if (doc.template === FICHE_TEMPLATE) redirect(`/admin/fiches/${doc.id}`);
  const zones = hasZoneBlocks(doc.data) ? await listDocZones() : [];
  return <DocumentEditor key={doc.id} doc={doc} zones={zones} />;
}
