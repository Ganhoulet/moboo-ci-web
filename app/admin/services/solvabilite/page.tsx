import Link from "next/link";
import { getServices } from "../actions";
import { fcfa } from "@/lib/moboo-services";
import { SolvencyCodeButton } from "@/components/backoffice/solvency-code-button";

export const dynamic = "force-dynamic";

const GRADE: Record<string, string> = { A: "bg-emerald-600", B: "bg-lime-600", C: "bg-amber-500", D: "bg-red-600" };

/** Services Moboo → Vérifications de solvabilité (avec consentement du candidat). */
export default async function SolvencyAdmin({ searchParams }: { searchParams: { page?: string } }) {
  const page = Number(searchParams.page) || 1;
  const d = await getServices<any>(`/solvabilite?page=${page}`);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Vérifications indisponibles.</p>;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Solvabilité des locataires</h1>
        <p className="max-w-3xl text-sm text-muted">Chaque vérification demande l’accord du candidat (code SMS). « Code non envoyé » : aucun canal SMS n’est configuré, appelez le candidat, recueillez son accord puis « Générer un code » et dictez-le-lui (Marketing › Canaux d’envoi pour activer le SMS). <Link href="/admin/services/reglages?tab=solvency" className="font-semibold underline">Réglages</Link></p>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase text-muted"><tr><th className="p-3">Réf. / date</th><th className="p-3">Demandeur</th><th className="p-3">Candidat</th><th className="p-3">Loyer / revenus</th><th className="p-3">Statut</th><th className="p-3">Résultat</th></tr></thead>
          <tbody>
            {d.items.map((r: any) => (
              <tr key={r.id} className="border-t border-slate-100 align-top">
                <td className="p-3 text-xs"><b className="font-mono">{r.ref}</b><br /><span className="text-muted">{String(r.createdAt).slice(0, 16).replace("T", " ")}</span></td>
                <td className="p-3"><strong>{r.requesterName}</strong><br /><span className="text-xs">{r.requesterPhone}</span></td>
                <td className="p-3"><strong>{r.tenantName}</strong><br /><span className="text-xs">{r.tenantPhone}</span>{r.tenantIdNumber ? <><br /><span className="text-xs text-muted">Pièce : {r.tenantIdNumber}</span></> : null}{r.employer ? <><br /><span className="text-xs text-muted">{r.employer}</span></> : null}</td>
                <td className="p-3 text-xs">{r.rent ? fcfa(r.rent) : "—"}<br />{r.income ? fcfa(r.income) : "revenus non déclarés"}</td>
                <td className="p-3 text-xs">
                  {r.status === "consented" ? <span className="rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800">Accord donné</span> : <span className="rounded-full bg-slate-100 px-2 py-0.5 font-semibold">En attente du code</span>}
                  {r.status !== "consented" && r.codeChannel === "none" ? <><br /><span className="mt-1 inline-block rounded bg-amber-100 px-1.5 font-semibold text-amber-800">Code non envoyé</span></> : null}
                  {r.status !== "consented" ? <><br /><SolvencyCodeButton ref_={r.ref} /></> : null}
                </td>
                <td className="p-3">{r.grade ? <span className="inline-flex items-center gap-2"><span className={"grid h-8 w-8 place-items-center rounded-lg font-bold text-white " + (GRADE[r.grade] ?? "bg-slate-400")}>{r.grade}</span><span className="text-xs">{r.score}/100</span></span> : "—"}</td>
              </tr>
            ))}
            {!d.items.length ? <tr><td colSpan={6} className="p-6 text-center text-muted">Aucune vérification.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {d.pages > 1 ? <div className="flex gap-2 text-sm">{page > 1 ? <Link href={`?page=${page - 1}`} className="rounded px-3 py-1 ring-1 ring-slate-300">← Précédent</Link> : null}{page < d.pages ? <Link href={`?page=${page + 1}`} className="rounded px-3 py-1 ring-1 ring-slate-300">Suivant →</Link> : null}</div> : null}
    </div>
  );
}
