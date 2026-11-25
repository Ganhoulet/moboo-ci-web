"use client";

import { useEffect, useState } from "react";

// Éléments interactifs « Immobilier & PropTech » : calculateurs, compte à rebours.

const fcfa = (n: number) => `${Math.round(n || 0).toLocaleString("fr-FR")} FCFA`;
const num = (v: string) => Number(v.replace(/[^\d]/g, "")) || 0;

function Money({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return (
    <label className="block text-left text-sm font-semibold">
      {label}
      <input inputMode="numeric" className="input mt-1 w-full text-base text-ink" value={value ? value.toLocaleString("fr-FR") : ""} onChange={(e) => onChange(num(e.target.value))} />
    </label>
  );
}

export function RentBudget({ ratio }: { ratio: number }) {
  const r = Math.min(60, Math.max(10, ratio || 33));
  const [income, setIncome] = useState(600_000);
  const max = Math.round((income * r) / 100 / 5000) * 5000;
  return (
    <div className="rounded-2xl bg-white p-6 text-ink shadow-card">
      <Money label="Vos revenus mensuels (FCFA)" value={income} onChange={setIncome} />
      <div className="mt-5 rounded-xl bg-brand-50 p-4 text-center">
        <p className="text-sm text-slate-600">Loyer conseillé ({r} % des revenus)</p>
        <p className="font-display text-3xl font-black text-brand-800">{fcfa(max)}</p>
      </div>
      {max > 0 ? <a href={`/annonces?transaction=rent&priceMax=${max}`} className="mt-4 block rounded-full bg-accent-600 py-3 text-center text-sm font-bold text-white hover:bg-accent-700">Voir les logements à ce prix</a> : null}
    </div>
  );
}

export function RentalYield({ price: p0, rent: r0, charges: c0 }: { price: number; rent: number; charges: number }) {
  const [price, setPrice] = useState(p0 || 40_000_000);
  const [rent, setRent] = useState(r0 || 350_000);
  const [charges, setCharges] = useState(Number.isFinite(c0) ? c0 : 15);
  const yearly = rent * 12;
  const gross = price ? (yearly / price) * 100 : 0;
  const netYearly = yearly * (1 - charges / 100);
  const net = price ? (netYearly / price) * 100 : 0;
  const years = netYearly ? price / netYearly : 0;
  return (
    <div className="grid gap-6 rounded-2xl bg-white p-6 text-ink shadow-card md:grid-cols-2">
      <div className="space-y-3">
        <Money label="Prix d’achat (FCFA)" value={price} onChange={setPrice} />
        <Money label="Loyer mensuel (FCFA)" value={rent} onChange={setRent} />
        <label className="block text-sm font-semibold">Charges, entretien, vacance ({charges} % des loyers)
          <input type="range" min={0} max={50} value={charges} onChange={(e) => setCharges(Number(e.target.value))} className="mt-2 w-full accent-brand-700" />
        </label>
      </div>
      <div className="grid grid-cols-2 gap-3 self-center text-center">
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Rendement brut</p><p className="font-display text-2xl font-black">{gross.toFixed(1)} %</p></div>
        <div className="rounded-xl bg-emerald-50 p-4"><p className="text-xs text-slate-500">Rendement net</p><p className="font-display text-2xl font-black text-emerald-700">{net.toFixed(1)} %</p></div>
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Loyers nets par an</p><p className="font-display text-lg font-black">{fcfa(netYearly)}</p></div>
        <div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Bien remboursé en</p><p className="font-display text-lg font-black">{years ? `${years.toFixed(1)} ans` : "—"}</p></div>
      </div>
    </div>
  );
}

/** Date « AAAA-MM-JJ HH:MM » (heure d'Abidjan = UTC). */
const parseDate = (v: string) => {
  const m = String(v || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?$/);
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3], +(m[4] ?? 0), +(m[5] ?? 0)) : NaN;
};

export function Countdown({ date, ended }: { date: string; ended: string }) {
  const target = parseDate(date);
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { setNow(Date.now()); const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  if (!Number.isFinite(target)) return <p className="text-sm opacity-70">Date à régler (AAAA-MM-JJ HH:MM)</p>;
  if (now === null) return <div className="h-20" />;
  const left = Math.max(0, target - now);
  if (!left) return <p className="font-display text-2xl font-black">{ended}</p>;
  const parts: [number, string][] = [[Math.floor(left / 86_400_000), "jours"], [Math.floor(left / 3_600_000) % 24, "heures"], [Math.floor(left / 60_000) % 60, "minutes"], [Math.floor(left / 1000) % 60, "secondes"]];
  return (
    <div className="inline-flex gap-3">
      {parts.map(([v, l]) => (
        <div key={l} className="min-w-[72px] rounded-xl bg-white/10 px-3 py-3 ring-1 ring-current/20">
          <p className="font-display text-3xl font-black tabular-nums">{String(v).padStart(2, "0")}</p><p className="text-xs opacity-75">{l}</p>
        </div>
      ))}
    </div>
  );
}
