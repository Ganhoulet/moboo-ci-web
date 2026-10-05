import Link from "next/link";
import { fcfa, type MarketEstimate } from "@/lib/prices";

/**
 * Repère « Prix du marché » d'une fiche (façon Zestimate) : médiane des biens
 * comparables de la commune, fourchette habituelle et écart du prix affiché.
 */
export function MarketPrice({ e }: { e: MarketEstimate }) {
  const unit = e.transaction === "rent" ? " / mois" : "";
  const d = e.diffPct;
  const verdict = Math.abs(d) <= 10
    ? { text: "Dans les prix du marché", tone: "bg-sky-50 text-sky-800 ring-sky-200" }
    : d < 0
      ? { text: `${Math.abs(d)} % sous le prix du marché`, tone: "bg-emerald-50 text-emerald-800 ring-emerald-200" }
      : { text: `${d} % au-dessus du prix du marché`, tone: "bg-amber-50 text-amber-900 ring-amber-200" };
  // Position du prix de ce bien dans la fourchette habituelle (de p25 à p75, élargie de moitié de chaque côté).
  const price = e.median * (1 + d / 100);
  const lo = e.p25 - (e.p75 - e.p25) / 2, hi = e.p75 + (e.p75 - e.p25) / 2;
  const pos = Math.min(100, Math.max(0, ((price - lo) / Math.max(1, hi - lo)) * 100));
  return (
    <div className="mt-4 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prix du marché · {e.label} à {e.zone}</p>
      <p className="mt-1 text-lg font-extrabold text-ink">{fcfa(e.median)}<span className="text-sm font-medium text-muted">{unit}</span></p>
      <div className="relative mt-3 h-1.5 rounded-full bg-gradient-to-r from-emerald-300 via-sky-300 to-amber-300" title="Position du prix de ce bien">
        <span className="absolute -top-1 h-3.5 w-1 -translate-x-1/2 rounded bg-ink" style={{ left: `${pos}%` }} />
      </div>
      <p className="mt-1 flex justify-between text-[11px] text-muted"><span>moins cher</span><span>plus cher</span></p>
      <p className="text-[11px] text-muted">Prix habituels : {fcfa(e.p25)} – {fcfa(e.p75)}</p>
      <p className={"mt-2 inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 " + verdict.tone}>{verdict.text}</p>
      <p className="mt-2 text-[11px] leading-snug text-muted">
        Médiane de {e.count} annonces comparables sur Moboo.ci. <Link href={`/prix-immobilier/${e.slug}`} className="font-semibold text-brand-700 hover:underline">Prix de l’immobilier à {e.zone}</Link>
      </p>
    </div>
  );
}
