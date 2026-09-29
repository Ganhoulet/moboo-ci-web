"use client";

import Link from "next/link";
import { useState } from "react";

/** Simulateur de mensualité (prêt à taux fixe). */
export function LoanCalculator({ amount, rate, years, ctaLabel, ctaHref }: { amount: number; rate: number; years: number; ctaLabel?: string; ctaHref?: string }) {
  const [a, setA] = useState(amount);
  const [r, setR] = useState(rate);
  const [y, setY] = useState(years);
  const n = y * 12, i = r / 100 / 12;
  const monthly = i ? (a * i) / (1 - Math.pow(1 + i, -n)) : a / n;
  const total = monthly * n;
  const f = (x: number) => `${Math.round(x).toLocaleString("fr-FR")} FCFA`;
  const range = (label: string, v: number, set: (n: number) => void, min: number, max: number, step: number, fmt: (n: number) => string) => (
    <label className="block">
      <span className="flex justify-between text-sm"><span className="font-semibold text-ink">{label}</span><span className="text-slate-600">{fmt(v)}</span></span>
      <input type="range" min={min} max={max} step={step} value={v} onChange={(e) => set(Number(e.target.value))} className="mt-2 w-full accent-accent-600" />
    </label>
  );
  return (
    <div className="grid gap-6 rounded-3xl bg-white p-6 shadow-card ring-1 ring-slate-100 sm:p-8 lg:grid-cols-[1.3fr_1fr]">
      <div className="space-y-5">
        {range("Montant emprunté", a, setA, 1_000_000, 500_000_000, 1_000_000, f)}
        {range("Taux annuel", r, setR, 1, 20, 0.25, (n) => `${n.toLocaleString("fr-FR")} %`)}
        {range("Durée", y, setY, 1, 30, 1, (n) => `${n} ans`)}
      </div>
      <div className="flex flex-col justify-center rounded-2xl bg-slate-50 p-6 text-center">
        <p className="text-sm text-muted">Mensualité estimée</p>
        <p className="mt-1 font-display text-3xl font-black text-ink">{f(monthly)}</p>
        <p className="mt-2 text-xs text-muted">Coût total : {f(total)} · intérêts : {f(total - a)}</p>
        <p className="mt-1 text-[11px] text-slate-400">Estimation indicative, hors assurance et frais.</p>
        {ctaLabel && ctaHref ? <Link href={ctaHref} className="mt-4 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">{ctaLabel}</Link> : null}
      </div>
    </div>
  );
}
