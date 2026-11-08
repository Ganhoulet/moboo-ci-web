import Link from "next/link";
import { DocumentListActions } from "@/components/backoffice/documents/document-list-actions";
import { KIND_LABEL } from "@/lib/documents/types";
import { listDocuments } from "./actions";

export const dynamic = "force-dynamic";
const when = (s: string) => new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Abidjan" });

/** Documents imprimables : livres blancs, ebooks, magazines de quartier. */
export default async function DocumentsPage() {
  const items = await listDocuments();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Documents imprimables</h1>
          <p className="text-sm text-muted">Livres blancs, ebooks et magazines de quartier, prêts à exporter en PDF.</p>
        </div>
        <Link href="/admin/documents/nouveau" className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Nouveau document</Link>
      </div>
      {items === null ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">Liste indisponible pour le moment.</p> : null}
      {items && !items.length ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <p className="font-semibold text-ink">Aucun document pour l’instant</p>
          <p className="mt-1 text-sm text-muted">Commencez par une page blanche ou par un modèle.</p>
        </div>
      ) : null}
      {items?.length ? (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-2.5">Document</th><th className="px-3 py-2.5">Format</th><th className="px-3 py-2.5">Édition</th><th className="px-3 py-2.5">Statut</th><th className="px-3 py-2.5">Modifié</th><th className="px-4 py-2.5 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((d) => (
                <tr key={d.id} className="align-top">
                  <td className="px-4 py-3"><Link href={`/admin/documents/${d.id}`} className="font-semibold text-ink hover:text-brand-700 hover:underline">{d.title}</Link><p className="text-xs text-muted">{KIND_LABEL[d.kind] ?? d.kind} · {d.pages} page{d.pages > 1 ? "s" : ""}</p></td>
                  <td className="px-3 py-3">{d.format}</td>
                  <td className="whitespace-nowrap px-3 py-3">N° {d.edition}{d.editionDate ? <span className="block text-xs text-muted">{d.editionDate}</span> : null}</td>
                  <td className="px-3 py-3"><span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (d.status === "published" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600")}>{d.status === "published" ? "Publié" : "Brouillon"}</span></td>
                  <td className="whitespace-nowrap px-3 py-3 text-muted">{when(d.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-end gap-1">
                      <Link href={`/admin/documents/${d.id}/imprimer`} className="text-sm font-semibold text-brand-700 hover:underline">Aperçu et PDF</Link>
                      <DocumentListActions id={d.id} title={d.title} edition={d.edition} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
