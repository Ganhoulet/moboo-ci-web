import { notFound } from "next/navigation";
import { FicheEditor } from "@/components/backoffice/fiches/fiche-editor";
import { getFiche } from "../actions";

export const dynamic = "force-dynamic";

export default async function FichePage({ params }: { params: { id: string } }) {
  const doc = await getFiche(params.id);
  if (!doc) notFound();
  return <FicheEditor doc={doc} />;
}
