import Link from "next/link";
import { GoalsEditor, MetricCell, type Metric } from "@/components/backoffice/am-perf";
import { getAm } from "../actions";

export const dynamic = "force-dynamic";

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const label = (p: string) => { const [y, m] = p.split("-").map(Number); return `${MONTHS[m - 1]} ${y}`; };
const shift = (p: string, n: number) => { const [y, m] = p.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`; };

/** Objectifs et performance des account managers (mois par mois). */
export default async function AmPerformance({ searchParams }: { searchParams: { period?: string; team?: string } }) {
  const qs = new URLSearchParams({ ...(searchParams.period ? { period: searchParams.period } : {}), ...(searchParams.team ? { team: searchParams.team } : {}) });
  const d = await getAm<any>(`/performance?${qs}`);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Performance indisponible.</p>;
  const metrics: Metric[] = d.metrics;
  const shown = metrics.filter((m) => m.key !== "portfolio");
  const link = (p: Record<string, string>) => `?${new URLSearchParams({ period: d.period, ...(searchParams.team ? { team: searchParams.team } : {}), ...p })}`;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Objectifs et performance</h1>
        <p className="max-w-3xl text-sm text-muted">
          Chaque mois : réservations confirmées pour les hôtes, délai médian d’intervention après l’alerte, contacts, recommandations corrigées, chiffre d’affaires Moboo.ci
          du portefeuille, tâches et accès assistés. {d.canEdit ? "Fixez des objectifs pour toute l’équipe ou par personne : la barre passe au vert quand l’objectif est atteint." : `Vos résultats du mois et votre rang dans l’équipe (${d.teamSize} account managers).`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link href={link({ period: shift(d.period, -1) })} className="rounded-md bg-white px-3 py-1 ring-1 ring-slate-300">←</Link>
        <span className="font-display text-lg font-bold capitalize text-ink">{label(d.period)}</span>
        <Link href={link({ period: shift(d.period, 1) })} className="rounded-md bg-white px-3 py-1 ring-1 ring-slate-300">→</Link>
        {d.canEdit && d.teams.length ? (
          <span className="ml-3 flex flex-wrap gap-1.5">
            <Link href={`?period=${d.period}`} className={"rounded-full px-3 py-1 font-semibold " + (!searchParams.team ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>Toutes les équipes</Link>
            {d.teams.map((t: any) => <Link key={t.id} href={`?period=${d.period}&team=${t.id}`} className={"rounded-full px-3 py-1 font-semibold " + (searchParams.team === t.id ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{t.name}</Link>)}
          </span>
        ) : null}
        {d.canEdit ? <span className="ml-auto"><GoalsEditor managerId="*" label="Objectifs de l’équipe pour ce mois" period={d.period} metrics={metrics} initial={d.defaults} /></span> : null}
      </div>

      {d.totals ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {["bookingsSaved", "responseMin", "contacts", "recoFixed", "revenue"].map((k) => {
            const m = metrics.find((x) => x.key === k)!;
            const v = d.totals[k];
            return <div key={k} className="rounded-lg bg-white p-4 ring-1 ring-slate-200"><p className="text-xs text-muted">{m.label}</p><p className="font-display text-xl font-extrabold text-ink">{v == null ? "—" : m.unit === "F" ? `${new Intl.NumberFormat("fr-FR").format(v)} F` : `${v}${m.unit === "min" ? " min" : ""}`}</p></div>;
          })}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg bg-white ring-1 ring-slate-200">
        <table className="w-full min-w-[1200px] text-sm">
          <thead className="bg-slate-50 text-left text-[11px] uppercase text-muted">
            <tr><th className="p-3">#</th><th className="p-3">Account manager</th><th className="p-3">Score objectifs</th>{shown.map((m) => <th key={m.key} className="p-3">{m.label}</th>)}</tr>
          </thead>
          <tbody>
            {d.rows.map((r: any) => (
              <tr key={r.id} className="border-t border-slate-100 align-top" data-perf={r.id}>
                <td className="p-3 font-display text-lg font-extrabold text-slate-400">{r.rank}</td>
                <td className="p-3"><b>{r.name}</b><br /><span className="text-xs text-muted">{r.values.portfolio} compte(s) suivis</span>{d.canEdit ? <GoalsEditor managerId={r.id} label="Ses objectifs" period={d.period} metrics={metrics} initial={r.goals} /> : null}</td>
                <td className="p-3">{r.score == null ? <span className="text-xs text-muted">pas d’objectif</span> : <span className={"rounded-full px-2.5 py-1 font-bold " + (r.score >= 100 ? "bg-emerald-100 text-emerald-800" : r.score >= 60 ? "bg-amber-100 text-amber-900" : "bg-red-100 text-red-800")}>{r.score} %</span>}</td>
                {shown.map((m) => <td key={m.key} className="p-3"><MetricCell m={m} value={r.values[m.key]} goal={m.goal ? r.goals[m.key] : null} /></td>)}
              </tr>
            ))}
            {!d.rows.length ? <tr><td colSpan={shown.length + 3} className="p-6 text-center text-muted">Aucun account manager.</td></tr> : null}
          </tbody>
        </table>
      </div>
      {!d.canEdit && d.rows[0] ? <p className="text-sm text-muted">Votre rang ce mois-ci : <b className="text-ink">{d.rows[0].rank}</b> sur {d.teamSize}.</p> : null}
    </div>
  );
}
