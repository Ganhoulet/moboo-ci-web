import Link from "next/link";
import { getSearches, type SearchRow } from "../actions";
import { KpiTile, RangeTabs } from "@/components/backoffice/stats-ui";
import { ShareBars } from "@/components/app-charts";
import { ago } from "@/components/backoffice/ui";

const KIND: Record<string, string> = { rent: "Location", sale: "Vente", furnished: "Meublé", event: "Espace", all: "Tout" };
const num = (n: number) => n.toLocaleString("fr-FR");

function Rows({ rows, zero }: { rows: SearchRow[]; zero?: boolean }) {
  if (!rows.length) return <p className="p-4 text-sm text-muted">{zero ? "Aucune recherche sans résultat. 🎉" : "Pas encore de recherches sur la période."}</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[30rem] text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
          <tr><th className="px-4 py-2">Recherche</th><th className="px-2 py-2">Type</th><th className="px-2 py-2 text-right">Fois</th><th className="px-4 py-2 text-right">{zero ? "Sans résultat" : "Résultats (moy.)"}</th></tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((r, i) => (
            <tr key={`${r.kind}-${r.label}-${r.propertyType}-${i}`}>
              <td className="px-4 py-2">
                <span className="font-medium text-ink">{r.label || "(filtres seulement)"}</span>{r.propertyType ? <span className="ml-1 text-xs text-muted">· {r.propertyType}</span> : null}
                <span className="block text-xs text-muted">dernière {ago(r.last)}</span>
              </td>
              <td className="px-2 py-2 text-slate-600">{KIND[r.kind] ?? r.kind}</td>
              <td className="px-2 py-2 text-right tabular-nums">{num(r.total)}</td>
              <td className="px-4 py-2 text-right tabular-nums">{zero ? <span className="font-semibold text-red-700">{num(r.zero)}</span> : num(r.avgResults)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Back-office → Statistiques → Recherches : ce que les visiteurs cherchent… et ne trouvent pas. */
export default async function SearchStats({ searchParams }: { searchParams: { range?: string; source?: string } }) {
  const range = ["7", "30", "90", "365"].includes(searchParams.range ?? "") ? searchParams.range! : "30";
  const source = searchParams.source === "site" || searchParams.source === "app" ? searchParams.source : undefined;
  const d = await getSearches(range, source);
  const extra = source ? `&source=${source}` : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Recherches</h1>
          <p className="max-w-2xl text-sm text-muted">Ce que les visiteurs du site et de l’application cherchent. Les recherches sans résultat montrent où recruter des propriétaires et des agences.</p>
        </div>
        <RangeTabs base="/admin/statistiques/recherches" range={range} extra={extra} />
      </div>
      <div className="flex gap-3 text-sm">
        {[["", "Site et application"], ["site", "Site"], ["app", "Application"]].map(([k, l]) => (
          <Link key={k} href={`/admin/statistiques/recherches?range=${range}${k ? `&source=${k}` : ""}`} className={(source ?? "") === k ? "font-bold text-ink" : "text-brand-800 hover:underline"}>{l}</Link>
        ))}
      </div>

      {!d ? <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Impossible de charger les recherches.</p> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiTile label="Recherches" value={num(d.totals.searches)} hint={`${num(d.totals.site)} site · ${num(d.totals.app)} application`} />
            <KpiTile label="Sans résultat" value={num(d.totals.zero)} hint={d.totals.searches ? `${Math.round((d.totals.zero / d.totals.searches) * 100)} % des recherches` : undefined} />
            <KpiTile label="Communes demandées" value={num(d.demand.length)} hint="reconnues dans les recherches" />
            <KpiTile label="Communes sans offre" value={num(d.demand.filter((x) => !x.listings).length)} hint="recherchées, aucune annonce en ligne" />
          </div>

          <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            <div className="border-b border-slate-100 px-4 py-3">
              <h2 className="font-semibold text-ink">Offre et demande par commune</h2>
              <p className="text-xs text-muted">Recherches comparées aux annonces en ligne. Plus le nombre de recherches par annonce est élevé, plus il manque d’offre.</p>
            </div>
            {d.demand.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <tr><th className="px-4 py-2">Commune</th><th className="px-2 py-2 text-right">Recherches</th><th className="px-2 py-2 text-right">Sans résultat</th><th className="px-2 py-2 text-right">Annonces en ligne</th><th className="px-4 py-2 text-right">Recherches / annonce</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {d.demand.map((r) => (
                      <tr key={r.place}>
                        <td className="px-4 py-2 font-medium text-ink">{r.place}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{num(r.searches)}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{num(r.zero)}</td>
                        <td className="px-2 py-2 text-right tabular-nums">{num(r.listings)}</td>
                        <td className="px-4 py-2 text-right">
                          {r.ratio === null
                            ? <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-red-200">⚠ aucune offre</span>
                            : <span className={"tabular-nums " + (r.ratio >= 3 ? "font-semibold text-amber-800" : "")}>{r.ratio.toLocaleString("fr-FR")}{r.ratio >= 3 ? " ▲" : ""}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="p-4 text-sm text-muted">Pas encore de commune reconnue dans les recherches.</p>}
          </section>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
              <h2 className="border-b border-slate-100 px-4 py-3 font-semibold text-ink">Recherches sans résultat</h2>
              <Rows rows={d.zero} zero />
            </section>
            <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
              <h2 className="border-b border-slate-100 px-4 py-3 font-semibold text-ink">Recherches les plus fréquentes</h2>
              <Rows rows={d.top} />
            </section>
          </div>

          <section className="max-w-xl rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-semibold text-ink">Budget maximum des recherches de location</h2>
            <p className="mb-3 text-xs text-muted">Loyer mensuel en FCFA, quand le visiteur a indiqué un budget.</p>
            <ShareBars items={d.budgets.filter((b) => b.value)} />
          </section>
        </>
      )}
    </div>
  );
}
