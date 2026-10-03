import Link from "next/link";
import { getDeletions } from "../../backoffice-actions";
import { Pill, fmtDate, fmtDateTime } from "@/components/backoffice/ui";
import { DeletionDone } from "@/components/backoffice/deletion-actions";

const SCOPE: Record<string, string> = { site: "Moboo.ci (site)", app: "Ancien compte de l’application", pro: "Moboo Pro / Resi" };
const TABS: [string, string][] = [["", "À suivre"], ["manual", "À traiter"], ["scheduled", "Programmées"], ["completed", "Terminées"], ["cancelled", "Annulées"]];

/** Back-office → Utilisateurs → Demandes de suppression (Google Play / App Store). */
export default async function DeletionsPage({ searchParams }: { searchParams: { status?: string } }) {
  const status = searchParams.status ?? "";
  const data = await getDeletions(status || undefined);
  return (
    <div className="max-w-5xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Demandes de suppression</h1>
        <p className="text-sm text-muted">
          Faites depuis <Link href="/suppression-compte" target="_blank" className="font-semibold text-brand-800 hover:underline">moboo.ci/suppression-compte</Link> ou « Mon espace ».
          Les comptes du site sont supprimés automatiquement à la date prévue ; les demandes concernant l’ancienne application ou Moboo Pro sont à traiter à la main (30 jours au plus).
        </p>
      </div>
      <div className="flex flex-wrap gap-x-1 gap-y-2 text-sm">
        {TABS.map(([k, l], i) => (
          <span key={k} className="inline-flex items-center">
            {i ? <span className="mx-1 text-slate-300">|</span> : null}
            <Link href={k ? `/admin/utilisateurs/suppressions?status=${k}` : "/admin/utilisateurs/suppressions"} className={status === k ? "font-bold text-ink" : "text-brand-800 hover:underline"}>{l}</Link>
            {k ? <span className="ml-1 text-slate-500">({data?.counts[k] ?? 0})</span> : null}
          </span>
        ))}
      </div>
      {!data ? <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Impossible de charger les demandes.</p>
        : !data.items.length ? <p className="rounded-lg bg-white p-8 text-center text-sm text-muted ring-1 ring-slate-200">Aucune demande ici.</p>
        : (
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr><th className="px-4 py-2.5">Demande</th><th className="px-4 py-2.5">Compte</th><th className="px-4 py-2.5">Motif</th><th className="px-4 py-2.5">Statut</th><th className="px-4 py-2.5" /></tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.items.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td className="px-4 py-3"><span className="font-semibold text-ink">{SCOPE[r.scope] ?? r.scope}</span><span className="block text-xs text-muted">{fmtDateTime(r.createdAt)}</span></td>
                    <td className="px-4 py-3">
                      {r.accountId ? <Link href={`/admin/utilisateurs/${r.accountId}`} className="font-semibold text-brand-800 hover:underline">{r.phone.startsWith("supprime-") ? "Compte supprimé" : r.phone}</Link> : <span>{r.phone}</span>}
                      {r.email ? <span className="block text-xs text-muted">{r.email}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{r.reasonLabel ?? "—"}{r.details ? <span className="block text-xs italic">« {r.details} »</span> : null}</td>
                    <td className="px-4 py-3">
                      <Pill s={r.status} />
                      {r.status === "scheduled" && r.scheduledAt ? <span className="block text-xs text-muted">le {fmtDate(r.scheduledAt)}</span> : null}
                      {r.handledAt ? <span className="block text-xs text-muted">{r.handledBy ?? ""} · {fmtDate(r.handledAt)}</span> : null}
                    </td>
                    <td className="px-4 py-3 text-right">{r.status === "manual" ? <DeletionDone id={r.id} /> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
