import Link from "next/link";
import { getServices } from "../actions";
import { AnalyzeButtons, GridImport, GridRowEditor } from "@/components/backoffice/services-admin-widgets";
import { fcfa } from "@/lib/moboo-services";

export const dynamic = "force-dynamic";

const TABS: [string, string][] = [["marche", "Prix du marché"], ["dgi", "Valeurs DGI"], ["loyer", "Grille des loyers"], ["dernieres", "Dernières estimations"]];
const USAGE: Record<string, string> = { residentiel: "Résidentiel", commercial: "Commercial", agricole: "Agricole" };

/** Services Moboo → Estimations foncière et loyer : grilles, imports, analyses. */
export default async function EstimationsAdmin({ searchParams }: { searchParams: { onglet?: string; q?: string; page?: string } }) {
  const tab = searchParams.onglet ?? "marche";
  const q = searchParams.q ?? "";
  const page = Number(searchParams.page) || 1;
  const stats = await getServices<any>("/estimation/stats");
  if (!stats) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Estimations indisponibles.</p>;
  const grid = tab === "dgi" || tab === "marche" ? await getServices<any>(`/estimation/grid/${tab}?q=${encodeURIComponent(q)}&page=${page}`)
    : tab === "loyer" ? await getServices<any>(`/estimation/loyer-grid?q=${encodeURIComponent(q)}&page=${page}`) : null;
  const href = (o: Record<string, string | number>) => "?" + new URLSearchParams(Object.entries({ onglet: tab, ...(q ? { q } : {}), ...o }).map(([k, v]) => [k, String(v)])).toString();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Estimations foncière et loyer</h1>
        <p className="max-w-3xl text-sm text-muted">
          L’estimation d’un terrain part du <strong>prix du marché</strong> de la zone (sinon de la valeur DGI), ajusté par les caractéristiques (relief, réseaux, usage, milieu, situation, viabilisation, angle). Le loyer part de la <strong>grille des loyers</strong> recalculée depuis les annonces en location. Les grilles de départ (DGI et Sikafinance 2025) sont déjà chargées.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-4">
        {[["Estimations foncières", stats.estimations], ["Rapports PDF", stats.pdfs], ["Rapports loyer", stats.reports], ["Points de tendance", stats.grids.trend]].map(([l, v]) => (
          <div key={String(l)} className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200"><p className="text-xs uppercase text-muted">{l}</p><p className="font-display text-xl font-extrabold text-ink">{v}</p></div>
        ))}
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-2 font-display text-base font-bold text-ink">Recalculer depuis les annonces du site</h2>
        <AnalyzeButtons />
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {TABS.map(([k, l]) => <Link key={k} href={`?onglet=${k}`} className={"rounded-full px-3 py-1 font-semibold " + (tab === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>)}
      </div>

      {tab === "dernieres" ? (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[700px] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-muted"><tr><th className="p-3">N°</th><th className="p-3">Zone</th><th className="p-3">Superficie</th><th className="p-3">Fourchette</th><th className="p-3">Risque</th><th className="p-3">PDF</th><th className="p-3">Date</th></tr></thead>
            <tbody>
              {stats.last.map((e: any) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="p-3">#{e.id}</td><td className="p-3">{e.zone}</td><td className="p-3">{e.superficie} m²</td>
                  <td className="p-3">{fcfa(e.valeur_min)} – {fcfa(e.valeur_max)}</td>
                  <td className="p-3"><span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (e.score === "vert" ? "bg-emerald-100 text-emerald-800" : e.score === "orange" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-700")}>{e.score}</span></td>
                  <td className="p-3">{e.pdf ? "Oui" : "—"}</td><td className="p-3 text-xs text-muted">{e.created_at}</td>
                </tr>
              ))}
              {!stats.last.length ? <tr><td colSpan={7} className="p-6 text-center text-muted">Aucune estimation.</td></tr> : null}
            </tbody>
          </table>
        </div>
      ) : grid ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <form className="flex gap-2"><input type="hidden" name="onglet" value={tab} /><input name="q" defaultValue={q} placeholder="Zone ou commune…" className="w-64 rounded-md border border-slate-300 px-3 py-1.5 text-sm" /><button className="rounded-md bg-ink px-3 py-1.5 text-sm font-semibold text-white">Rechercher</button></form>
            <GridImport kind={tab as "dgi" | "marche" | "loyer"} hint={tab === "loyer" ? "ville, commune, zone, type_bien, pieces, meuble, loyer_flat[, loyer_sqm]" : "ville, commune, zone, usage, prix_m2[, prix_min, prix_max], source"} />
          </div>
          {tab !== "loyer" ? <GridRowEditor kind={tab as "dgi" | "marche"} /> : null}
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            {tab === "loyer" ? (
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-muted"><tr><th className="p-3">Zone</th><th className="p-3">Type</th><th className="p-3">Pièces</th><th className="p-3">Meublé</th><th className="p-3">Loyer médian</th><th className="p-3">Fourchette</th><th className="p-3">Au m²</th><th className="p-3">Annonces</th></tr></thead>
                <tbody>
                  {grid.items.map((g: any) => (
                    <tr key={g.id} className="border-t border-slate-100">
                      <td className="p-3">{g.zone}<span className="block text-xs text-muted">{g.scope === "commune" ? "commune" : g.commune}</span></td><td className="p-3">{g.typeBien}</td><td className="p-3">{g.pieces || "toutes"}</td><td className="p-3">{g.meuble ? "Oui" : "Non"}</td>
                      <td className="p-3 font-semibold">{fcfa(g.loyerFlat)}</td><td className="p-3 text-xs">{fcfa(g.flatMin)} – {fcfa(g.flatMax)}</td><td className="p-3 text-xs">{g.loyerSqm ? `${fcfa(g.loyerSqm)}/m²` : "—"}</td><td className="p-3">{g.nFlat}</td>
                    </tr>
                  ))}
                  {!grid.items.length ? <tr><td colSpan={8} className="p-6 text-center text-muted">Grille vide : lancez « Analyser les locations » ou importez un CSV.</td></tr> : null}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[820px] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-muted"><tr><th className="p-3">Zone</th><th className="p-3">Commune</th><th className="p-3">Usage</th><th className="p-3">Prix/m²</th>{tab === "marche" ? <><th className="p-3">Fourchette</th><th className="p-3">Annonces</th></> : null}<th className="p-3">Source</th><th className="p-3" /></tr></thead>
                <tbody>
                  {grid.items.map((g: any) => (
                    <tr key={g.id} className="border-t border-slate-100 align-top">
                      <td className="p-3 font-semibold">{g.zone}</td><td className="p-3">{g.commune}</td><td className="p-3">{USAGE[g.usage] ?? g.usage}</td><td className="p-3">{fcfa(g.priceSqm)}</td>
                      {tab === "marche" ? <><td className="p-3 text-xs">{fcfa(g.priceMin)} – {fcfa(g.priceMax)}</td><td className="p-3">{g.nObs || "réf."}</td></> : null}
                      <td className="p-3 text-xs text-muted">{g.source}</td>
                      <td className="p-3"><GridRowEditor kind={tab as "dgi" | "marche"} row={g} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {grid.pages > 1 ? (
            <div className="flex gap-2 text-sm">
              {page > 1 ? <Link className="rounded bg-white px-3 py-1 ring-1 ring-slate-300" href={href({ page: page - 1 })}>← Précédent</Link> : null}
              <span className="px-2 py-1 text-muted">Page {page} / {grid.pages} · {grid.total} ligne(s)</span>
              {page < grid.pages ? <Link className="rounded bg-white px-3 py-1 ring-1 ring-slate-300" href={href({ page: page + 1 })}>Suivant →</Link> : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
