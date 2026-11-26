import Link from "next/link";
import { DocumentListActions } from "@/components/backoffice/documents/document-list-actions";
import { NewFicheButton } from "@/components/backoffice/fiches/new-fiche-button";
import { listFiches } from "./actions";

export const dynamic = "force-dynamic";
const when = (s: string) => new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Abidjan" });

/** Fiches d'annonces à imprimer et distribuer (A4 recto-verso, A3, A5…), une ligne par édition. */
export default async function FichesPage() {
  const items = await listFiches();
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Fiches d’annonces à imprimer</h1>
          <p className="text-sm text-muted">Une sélection d’annonces avec photo, prix, zone et QR code, prête à imprimer en PDF (A4 recto-verso, A3, A5, A6…).</p>
        </div>
        <NewFicheButton />
      </div>
      {items === null ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">Liste indisponible pour le moment.</p> : null}
      {items && !items.length ? (
        <div className="rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
          <p className="font-semibold text-ink">Aucune fiche pour l’instant</p>
          <p className="mt-1 text-sm text-muted">Créez une fiche, choisissez les annonces, puis exportez le PDF.</p>
        </div>
      ) : null}
      {items?.length ? (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-4 py-2.5">Fiche</th><th className="px-3 py-2.5">Édition</th><th className="px-3 py-2.5">Modifiée</th><th className="px-4 py-2.5 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((d) => (
                <tr key={d.id} className="align-top">
                  <td className="px-4 py-3"><Link href={`/admin/fiches/${d.id}`} className="font-semibold text-ink hover:text-brand-700 hover:underline">{d.title}</Link></td>
                  <td className="whitespace-nowrap px-3 py-3">N° {d.edition}{d.editionDate ? <span className="block text-xs text-muted">{d.editionDate}</span> : null}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-muted">{when(d.updatedAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-end gap-1">
                      <Link href={`/admin/fiches/${d.id}`} className="text-sm font-semibold text-brand-700 hover:underline">Ouvrir et PDF</Link>
                      <DocumentListActions id={d.id} title={d.title} edition={d.edition} base="/admin/fiches" />
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
