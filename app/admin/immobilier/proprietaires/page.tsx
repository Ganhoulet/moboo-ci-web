import Link from "next/link";
import { OwnerTransferToggle } from "@/components/backoffice/owner-transfer";
import { listReservables } from "../transfer-actions";

export const dynamic = "force-dynamic";

const TABS = [["residence", "Résidences meublées (Moboo Resi)"], ["espace", "Espaces événementiels (Moboo Event)"]] as const;

/** Back-office → Immobilier → Propriétaires des résidences et espaces. */
export default async function ReservableOwners({ searchParams }: { searchParams: { type?: string; q?: string; page?: string } }) {
  const kind = searchParams.type === "espace" ? "espace" : "residence";
  const data = await listReservables(kind, searchParams.q, searchParams.page);
  const page = data?.page ?? 1;
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;
  const href = (p: Record<string, string | undefined>) => `?${new URLSearchParams(Object.entries({ type: kind, q: searchParams.q, ...p }).filter(([, v]) => v) as [string, string][])}`;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Propriétaires des résidences et espaces</h1>
        <p className="max-w-3xl text-sm text-muted">Rattachez une résidence ou un espace au bon compte. Un bien qui a déjà des réservations, des paiements ou des dépenses reste chez son propriétaire. Pour une annonce, ouvrez-la depuis <Link href="/admin/immobilier" className="font-semibold text-brand-800 hover:underline">Annonces</Link>. Chaque changement est noté dans le journal d’activité.</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map(([k, label]) => (
          <Link key={k} href={`?type=${k}`} className={"rounded-full px-3 py-1.5 text-sm font-semibold " + (k === kind ? "bg-ink text-white" : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50")}>{label}</Link>
        ))}
        <form className="ml-auto flex gap-2">
          <input type="hidden" name="type" value={kind} />
          <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Nom du bien, ville ou propriétaire" className="input w-64 py-1.5 text-sm" />
          <button className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white">Chercher</button>
        </form>
      </div>
      {!data ? <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Liste indisponible.</p> : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="p-3">Bien</th><th className="p-3">Propriétaire actuel</th><th className="p-3">Changer</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((r) => (
                <tr key={r.id} className="align-top">
                  <td className="p-3">
                    <p className="font-semibold text-ink">{r.title}</p>
                    <p className="text-xs text-muted">{[r.place, r.imported ? "repris de moboo.ci" : null, r.online === true ? "en ligne sur Moboo.ci" : r.online === false ? "non publié" : null].filter(Boolean).join(" · ")}</p>
                  </td>
                  <td className="p-3">{r.owner.name}</td>
                  <td className="w-[420px] p-3"><OwnerTransferToggle kind={kind} id={r.id} /></td>
                </tr>
              ))}
              {!data.items.length ? <tr><td colSpan={3} className="p-6 text-center text-muted">Aucun bien trouvé.</td></tr> : null}
            </tbody>
          </table>
        </div>
      )}
      {pages > 1 ? (
        <div className="flex items-center gap-3 text-sm">
          {page > 1 ? <Link href={href({ page: String(page - 1) })} className="font-semibold text-brand-800 hover:underline">← Précédent</Link> : null}
          <span className="text-muted">Page {page} / {pages} · {data?.total} biens</span>
          {page < pages ? <Link href={href({ page: String(page + 1) })} className="font-semibold text-brand-800 hover:underline">Suivant →</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
