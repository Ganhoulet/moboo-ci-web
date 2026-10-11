import Link from "next/link";
import { fcfa } from "@/lib/am";

/* Activité complète des hôtes (Moboo Resi, Moboo Event, Moboo Pro et Moboo.ci) : composants serveur. */

type Src = { source: string; label: string; count: number; sold: number; revenue: number };
type Tally = { count: number; sold: number; revenue: number };
export interface Activity {
  sources: Src[]; moboo: Tally; apps: Tally; total: Tally;
  mobooShare: number | null; cashIn: number; cashOut: number; net: number; arrivals: number; departures: number; cancelled: number;
  units: number; soldDays: number; capacity: number; occupancy: number | null; freeDays: number; freeValue: number; unit: "nuit" | "jour";
  pro: null | {
    properties: number; rented: number; available: number; rentedRate: number | null; activeLeases: number; newLeases: number; endedLeases: number;
    rentCollected: number; rentPayments: number; unpaidCount: number; unpaidAmount: number; leads: number; leadsConverted: number;
    contracts: number; visits: number; qrScans: number; edlIn: number; edlOut: number;
  };
}

const evo = (cur: number, prev: number) => {
  if (!prev) return cur ? <span className="text-xs font-semibold text-emerald-700">nouveau</span> : null;
  const p = Math.round((cur / prev - 1) * 100);
  return <span className={"text-xs font-semibold " + (p >= 0 ? "text-emerald-700" : "text-red-600")}>{p >= 0 ? "+" : ""}{p} %</span>;
};

function Kpi({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return <div className="rounded-lg bg-slate-50 p-3"><p className="text-[11px] text-muted">{label}</p><p className="font-display text-lg font-extrabold text-ink">{value}</p>{sub ? <p className="text-xs text-muted">{sub}</p> : null}</div>;
}

/** Barre Moboo.ci / applications (chiffre d'affaires) + détail par source. */
export function SourceSplit({ cur, prev }: { cur: Activity; prev?: Activity | null }) {
  const max = Math.max(1, ...cur.sources.map((s) => s.revenue || s.count));
  const share = cur.mobooShare ?? 0;
  return (
    <div className="space-y-3">
      <div>
        <div className="flex justify-between text-xs font-semibold"><span className="text-brand-800">Moboo.ci {share} %</span><span className="text-slate-600">Saisies dans les apps {100 - share} %</span></div>
        <div className="mt-1 flex h-3 overflow-hidden rounded-full bg-slate-200"><div className="bg-brand-700" style={{ width: `${share}%` }} /></div>
      </div>
      <table className="w-full text-sm">
        <thead className="text-left text-[11px] uppercase text-muted"><tr><th className="py-1">Source</th><th>Réservations</th><th>Chiffre d’affaires</th>{prev ? <th>vs mois préc.</th> : null}</tr></thead>
        <tbody>
          {cur.sources.map((s) => {
            const p = prev?.sources.find((x) => x.source === s.source);
            return (
              <tr key={s.source} className="border-t border-slate-100" data-source={s.source}>
                <td className="py-1.5 pr-2"><b className={s.source === "MOBOO_CI" ? "text-brand-800" : ""}>{s.label}</b><div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className={"h-1.5 rounded-full " + (s.source === "MOBOO_CI" ? "bg-brand-700" : "bg-slate-400")} style={{ width: `${Math.round(((s.revenue || s.count) / max) * 100)}%` }} /></div></td>
                <td>{s.count}</td><td>{fcfa(s.revenue)}</td>{prev ? <td>{evo(s.revenue, p?.revenue ?? 0)}</td> : null}
              </tr>
            );
          })}
          {!cur.sources.length ? <tr><td colSpan={4} className="py-2 text-muted">Aucune réservation ce mois-ci.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

/** Bloc Moboo Pro (agence) : biens, baux, loyers, impayés, prospects, états des lieux. */
export function ProBlock({ pro }: { pro: NonNullable<Activity["pro"]> }) {
  return (
    <div data-pro-activity>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Agence — Moboo Pro</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Kpi label="Biens gérés" value={pro.properties} sub={`${pro.rented} loués · ${pro.available} disponibles`} />
        <Kpi label="Taux de biens loués" value={pro.rentedRate == null ? "—" : `${pro.rentedRate} %`} />
        <Kpi label="Baux" value={pro.activeLeases} sub={`${pro.newLeases} nouveau(x) · ${pro.endedLeases} terminé(s) ce mois`} />
        <Kpi label="Loyers encaissés" value={fcfa(pro.rentCollected)} sub={`${pro.rentPayments} paiement(s)`} />
        <Kpi label="Impayés" value={<span className={pro.unpaidCount ? "text-red-600" : ""}>{pro.unpaidCount}</span>} sub={fcfa(pro.unpaidAmount)} />
        <Kpi label="Prospects" value={pro.leads} sub={`${pro.leadsConverted} converti(s)`} />
        <Kpi label="États des lieux" value={`${pro.edlIn} entrée(s)`} sub={`${pro.edlOut} sortie(s)`} />
        <Kpi label="Visites / contrats" value={pro.visits} sub={`${pro.contracts} contrat(s) · ${pro.qrScans} scan(s) QR`} />
      </div>
    </div>
  );
}

/** Fiche hôte : toute l'activité du mois et les arguments pour booster. */
export function HostActivityPanel({ a }: { a: { period: string; current: Activity; previous: Activity; boost: { level: string; reasons: string[] } } }) {
  const c = a.current; const p = a.previous;
  const u = c.unit === "nuit" ? "nuits" : "jours";
  return (
    <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200" data-host-activity>
      <h2 className="font-display text-lg font-bold text-ink">📊 Activité du mois — applications et Moboo.ci</h2>
      <p className="mb-3 text-xs text-muted">Tout ce que l’hôte enregistre dans Moboo Resi, Moboo Event ou Moboo Pro (réservations directes, WhatsApp, Airbnb…, encaissements, dépenses, baux, loyers) et ce que Moboo.ci lui apporte.</p>
      {a.boost.reasons.length ? (
        <div className={"mb-4 rounded-lg p-3 text-sm " + (a.boost.level === "fort" ? "bg-orange-50 ring-1 ring-orange-200" : "bg-amber-50 ring-1 ring-amber-200")} data-why-boost={a.boost.level}>
          <p className="font-bold text-ink">🚀 Pourquoi booster {a.boost.level === "fort" ? "maintenant" : ""}</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">{a.boost.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
        </div>
      ) : null}
      {c.units || c.total.count || !c.pro ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Kpi label="Réservations (toutes sources)" value={c.total.count} sub={<>{p.total.count} le mois préc. {evo(c.total.count, p.total.count)}</>} />
            <Kpi label="Chiffre d’affaires total" value={fcfa(c.total.revenue)} sub={evo(c.total.revenue, p.total.revenue)} />
            <Kpi label="Dont Moboo.ci" value={fcfa(c.moboo.revenue)} sub={`${c.moboo.count} résa · ${c.mobooShare ?? 0} %`} />
            <Kpi label="Saisies dans l’app" value={fcfa(c.apps.revenue)} sub={`${c.apps.count} résa`} />
            <Kpi label="Occupation" value={c.occupancy == null ? "—" : `${c.occupancy} %`} sub={`${c.freeDays} ${u} libres`} />
            <Kpi label="Arrivées / départs" value={`${c.arrivals} / ${c.departures}`} sub={`${c.cancelled} annulation(s)`} />
          </div>
          <div className="mt-4"><SourceSplit cur={c} prev={p} /></div>
        </>
      ) : null}
      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <Kpi label="Encaissements (entrées)" value={fcfa(c.cashIn)} sub={evo(c.cashIn, p.cashIn)} />
        <Kpi label="Dépenses (sorties)" value={fcfa(c.cashOut)} sub={evo(c.cashOut, p.cashOut)} />
        <Kpi label="Résultat" value={<span className={c.net < 0 ? "text-red-600" : "text-emerald-700"}>{fcfa(c.net)}</span>} />
      </div>
      {c.pro ? <div className="mt-4"><ProBlock pro={c.pro} /></div> : null}
    </section>
  );
}

/** Performance : comparatif des portefeuilles et hôtes à booster. */
export function PortfolioComparison({ comparison, boost }: { comparison: { current: Activity; previous: Activity }; boost: { kind: string; id: string; name: string; manager: string; occupancy: number | null; mobooShare: number | null; revenue: number; freeValue: number; level: string; reasons: string[] }[] }) {
  const c = comparison.current; const p = comparison.previous;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200" data-comparison>
        <h2 className="font-display text-lg font-bold text-ink">Comparatif Moboo.ci / applications</h2>
        <p className="mb-3 text-xs text-muted">Portefeuilles affichés : réservations saisies par les hôtes dans Moboo Resi et Moboo Event, réservations Moboo.ci, activité des agences Moboo Pro.</p>
        <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Kpi label="CA total" value={fcfa(c.total.revenue)} sub={evo(c.total.revenue, p.total.revenue)} />
          <Kpi label="CA Moboo.ci" value={fcfa(c.moboo.revenue)} sub={evo(c.moboo.revenue, p.moboo.revenue)} />
          <Kpi label="Occupation" value={c.occupancy == null ? "—" : `${c.occupancy} %`} sub={`mois préc. ${p.occupancy ?? "—"} %`} />
          <Kpi label="Résultat (entrées − sorties)" value={fcfa(c.net)} />
        </div>
        <SourceSplit cur={c} prev={p} />
        {c.pro ? <div className="mt-4"><ProBlock pro={c.pro} /></div> : null}
      </section>
      <section className="rounded-lg bg-white p-4 ring-1 ring-slate-200" data-boost-list>
        <h2 className="font-display text-lg font-bold text-ink">🚀 Hôtes à booster</h2>
        <p className="mb-3 text-xs text-muted">Calculé sur toute leur activité (apps + Moboo.ci) : dates libres, faible part de Moboo.ci, baisse du chiffre d’affaires, biens Moboo Pro non loués.</p>
        <ul className="divide-y divide-slate-100 text-sm">
          {boost.map((b) => (
            <li key={b.kind + b.id} className="py-2" data-boost={b.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <Link href={`/admin/comptes/${b.kind}/${b.id}`} className="font-semibold text-brand-800 hover:underline">{b.name}</Link>
                <span className={"rounded-full px-2 py-0.5 text-xs font-bold " + (b.level === "fort" ? "bg-orange-100 text-orange-800" : "bg-amber-100 text-amber-900")}>{b.level === "fort" ? "Prioritaire" : "À suivre"}</span>
              </div>
              <p className="text-xs text-muted">{b.manager} · occupation {b.occupancy ?? "—"} % · Moboo.ci {b.mobooShare ?? 0} % · CA {fcfa(b.revenue)}{b.freeValue ? ` · ${fcfa(b.freeValue)} possibles` : ""}</p>
              <p className="mt-0.5 text-xs text-ink">{b.reasons[0]}</p>
            </li>
          ))}
          {!boost.length ? <li className="py-2 text-muted">Aucun hôte à booster en priorité ce mois-ci.</li> : null}
        </ul>
      </section>
    </div>
  );
}
