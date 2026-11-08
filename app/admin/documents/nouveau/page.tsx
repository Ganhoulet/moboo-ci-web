import Link from "next/link";
import { NewDocument } from "@/components/backoffice/documents/new-document";
import { TEMPLATES } from "@/lib/documents/templates";
import { listDocZones } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewDocumentPage() {
  const templates = TEMPLATES.map(({ key, name, description, format, kind, needsZone }) => ({ key, name, description, format, kind, needsZone: !!needsZone }));
  const zones = await listDocZones();
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div>
        <Link href="/admin/documents" className="text-sm text-brand-700 hover:underline">← Documents</Link>
        <h1 className="font-display text-2xl font-extrabold text-ink">Nouveau document</h1>
      </div>
      <NewDocument templates={templates} zones={zones} />
    </div>
  );
}
