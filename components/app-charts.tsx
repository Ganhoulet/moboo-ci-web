"use client";

import { useState } from "react";

/**
 * Colonnes d'une série quotidienne (30 jours) avec info-bulle au survol.
 * Une seule série : le titre de la carte la nomme (pas de légende).
 */
export function DailyBars({ data, label, unit }: { data: { day: string; value: number }[]; label: string; unit: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));
  const W = 600, H = 160, gap = 2, bw = W / data.length - gap;
  const fmt = (d: string) => new Date(d + "T00:00:00Z").toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
  const h = hover != null ? data[hover] : null;
  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="block h-auto w-full" role="img" aria-label={label} onMouseLeave={() => setHover(null)}>
        {[0.5, 1].map((t) => <line key={t} x1={0} x2={W} y1={H - H * t} y2={H - H * t} stroke="currentColor" className="text-slate-200" strokeWidth={1} />)}
        <line x1={0} x2={W} y1={H} y2={H} stroke="currentColor" className="text-slate-300" strokeWidth={1} />
        {data.map((d, i) => {
          const bh = d.value ? Math.max(3, (d.value / max) * (H - 8)) : 0;
          const x = i * (bw + gap);
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)}>
              <rect x={x} y={0} width={bw + gap} height={H} fill="transparent" />
              {bh ? <path d={`M${x},${H} V${H - bh + 3} a3,3 0 0 1 3,-3 h${bw - 6} a3,3 0 0 1 3,3 V${H} Z`} className={hover === i ? "fill-brand-900" : "fill-brand-700"} /> : null}
            </g>
          );
        })}
        <text x={0} y={H + 14} className="fill-slate-500 text-[11px]">{fmt(data[0]?.day ?? "")}</text>
        <text x={W} y={H + 14} textAnchor="end" className="fill-slate-500 text-[11px]">{fmt(data[data.length - 1]?.day ?? "")}</text>
        <text x={W} y={10} textAnchor="end" className="fill-slate-400 text-[11px]">max {max}</text>
      </svg>
      {h ? (
        <div className="pointer-events-none absolute top-0 rounded-md bg-ink px-2.5 py-1.5 text-xs text-white shadow-lg"
          style={{ left: `min(max(0px, calc(${((hover! + 0.5) / data.length) * 100}% - 60px)), calc(100% - 130px))` }}>
          <p className="font-semibold">{fmt(h.day)}</p>
          <p>{h.value.toLocaleString("fr-FR")} {unit}</p>
        </div>
      ) : null}
    </figure>
  );
}

/** Répartition (plateformes, versions) : barres horizontales, valeur écrite à côté. */
export function ShareBars({ items }: { items: { label: string; value: number }[] }) {
  const total = items.reduce((s, i) => s + i.value, 0) || 1;
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.label} className="text-sm">
          <div className="flex justify-between gap-2"><span className="truncate text-ink">{i.label}</span><span className="text-slate-600">{i.value} · {Math.round((i.value / total) * 100)} %</span></div>
          <div className="mt-1 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-brand-700" style={{ width: `${(i.value / total) * 100}%` }} /></div>
        </li>
      ))}
      {!items.length ? <li className="text-sm text-muted">Pas encore de données.</li> : null}
    </ul>
  );
}
