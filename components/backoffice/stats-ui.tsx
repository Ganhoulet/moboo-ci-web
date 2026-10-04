import Link from "next/link";
import { DailyBars } from "@/components/app-charts";

export const RANGES: [string, string][] = [["7", "7 jours"], ["30", "30 jours"], ["90", "90 jours"], ["365", "12 mois"]];
export const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;

/** Sélecteur de période (une ligne au-dessus des graphiques). */
export function RangeTabs({ base, range, extra = "" }: { base: string; range: string; extra?: string }) {
  return (
    <div className="flex rounded-full bg-white p-1 shadow-sm ring-1 ring-slate-200">
      {RANGES.map(([k, l]) => (
        <Link key={k} href={`${base}?range=${k}${extra}`} className={"rounded-full px-3.5 py-1.5 text-sm font-semibold " + (k === range ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-50")}>{l}</Link>
      ))}
    </div>
  );
}

/** Évolution par rapport à la période précédente (icône + texte : jamais la couleur seule). */
export function Delta({ change, invert }: { change: number | null; invert?: boolean }) {
  if (change === null) return <span className="text-xs font-semibold text-slate-500">nouveau</span>;
  if (change === 0) return <span className="text-xs font-semibold text-slate-500">= stable</span>;
  const good = invert ? change < 0 : change > 0;
  return <span className={"text-xs font-semibold " + (good ? "text-emerald-700" : "text-red-700")}>{change > 0 ? "▲" : "▼"} {Math.abs(change).toLocaleString("fr-FR")} %</span>;
}

export function KpiTile({ label, value, change, hint, invert, href }: { label: string; value: string; change?: number | null; hint?: string; invert?: boolean; href?: string }) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold text-ink">{value}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">{change !== undefined ? <Delta change={change} invert={invert} /> : null}{hint ? <span>{hint}</span> : null}</p>
    </>
  );
  return href
    ? <Link href={href} className="block rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-400">{body}</Link>
    : <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">{body}</div>;
}

/** Au-delà de 3 mois : regroupement par semaine (une barre par jour serait illisible). */
function weekly(data: { day: string; value: number }[]) {
  if (data.length <= 92) return data;
  const out: { day: string; value: number }[] = [];
  for (let i = 0; i < data.length; i += 7) out.push({ day: data[i].day, value: data.slice(i, i + 7).reduce((s, d) => s + d.value, 0) });
  return out;
}

export function SeriesCard({ title, data, unit, total }: { title: string; data: { day: string; value: number }[]; unit: string; total?: string }) {
  const d = weekly(data);
  return (
    <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <h2 className="font-semibold text-ink">{title}{d.length !== data.length ? <span className="ml-1 text-xs font-normal text-muted">(par semaine)</span> : null}</h2>
        {total ? <span className="text-sm font-semibold text-slate-600">{total}</span> : null}
      </div>
      <DailyBars data={d} label={title} unit={unit} />
    </section>
  );
}
