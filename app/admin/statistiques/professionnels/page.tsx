import Link from "next/link";
import { getPros } from "../actions";
import { KpiTile, RangeTabs } from "@/components/backoffice/stats-ui";
import { TYPE_LABEL } from "@/components/backoffice/ui";

const num = (n: number) => n.toLocaleString("fr-FR");
const SORTS: [string, string][] = [["contacts", "Contacts"], ["views", "Vues"], ["conversion", "Taux de contact"], ["listings", "Annonces"]];

/** Back-office → Statistiques → Professionnels : qui reçoit des contacts (argument pour les forfaits). */
export default async function ProStats({ searchParams }: { searchParams: { range?: string; sort?: string } }) {
  const range = ["7", "30", "90", "365"].includes(searchParams.range ?? "") ? searchParams.range! : "30";
  const sort = SORTS.some(([k]) => k === searchParams.sort) ? searchParams.sort! : "contacts";
  const d = await getPros(range, sort);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Professionnels</h1>
          <p className="max-w-2xl text-sm text-muted">Annonces, vues et contacts reçus par chaque agence, agent ou propriétaire. Les comptes très contactés sans forfait sont les premiers à démarcher.</p>
        </div>
        <RangeTabs base="/admin/statistiques/professionnels" range={range} extra={`&sort=${sort}`} />
      </div>

      {!d ? <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Impossible de charger les professionnels.</p> : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiTile label="Annonceurs" value={num(d.totals.pros)} hint="comptes du site et agents repris" />
            <KpiTile label="Ont reçu des contacts" value={num(d.totals.withContacts)} />
            <KpiTile label="Annonces jamais vues" value={num(d.totals.withoutViews)} hint="annonceurs dont aucune annonce n’a été vue : à aider" />
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted">Trier par :</span>
            {SORTS.map(([k, l]) => (
              <Link key={k} href={`/admin/statistiques/professionnels?range=${range}&sort=${k}`} className={sort === k ? "font-bold text-ink" : "text-brand-800 hover:underline"}>{l}</Link>
            ))}
          </div>
          {d.items.length ? (
            <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
              <table className="w-full min-w-[60rem] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-2.5">Annonceur</th><th className="px-2 py-2.5">Forfait</th><th className="px-2 py-2.5 text-right">Annonces</th>
                    <th className="px-2 py-2.5 text-right">Vues</th><th className="px-2 py-2.5 text-right">Appels</th><th className="px-2 py-2.5 text-right">WhatsApp</th>
                    <th className="px-2 py-2.5 text-right">Formulaires</th><th className="px-2 py-2.5 text-right">Contacts</th><th className="px-4 py-2.5 text-right">Taux de contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {d.items.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-2">
                        {p.href ? <Link href={p.href} className="font-medium text-ink hover:underline">{p.name}</Link> : <span className="font-medium text-ink">{p.name}</span>}
                        {p.verified ? <span className="ml-1 text-sky-600" title="Vérifié">✔</span> : null}
                        <span className="block text-xs text-muted">{TYPE_LABEL[p.type] ?? p.type}{p.kind === "agent" ? " · repris de moboo.ci" : ""}</span>
                      </td>
                      <td className="px-2 py-2 text-xs">{p.plan ? <span className="rounded-full bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700 ring-1 ring-emerald-200">{p.plan}</span> : p.kind === "site" && p.contacts > 0 ? <span className="font-semibold text-amber-800">sans forfait</span> : <span className="text-muted">—</span>}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{num(p.active)}<span className="text-muted">/{num(p.listings)}</span></td>
                      <td className="px-2 py-2 text-right tabular-nums">{num(p.views)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{num(p.calls)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{num(p.whatsapp)}</td>
                      <td className="px-2 py-2 text-right tabular-nums">{num(p.forms)}</td>
                      <td className="px-2 py-2 text-right font-semibold tabular-nums">{num(p.contacts)}</td>
                      <td className="px-4 py-2 text-right tabular-nums">{p.views ? `${p.conversion.toLocaleString("fr-FR")} %` : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="rounded-lg bg-white p-8 text-center text-sm text-muted ring-1 ring-slate-200">Aucun annonceur sur la période.</p>}
        </>
      )}
    </div>
  );
}
