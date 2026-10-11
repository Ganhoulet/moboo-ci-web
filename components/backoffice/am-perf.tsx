"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveGoalsAction } from "@/app/admin/comptes/actions";

export interface Metric { key: string; label: string; unit?: string; lower?: boolean; goal: boolean }
const fmt = (v: number | null | undefined, unit?: string) => v == null ? "—" : unit === "F" ? `${new Intl.NumberFormat("fr-FR").format(v)} F` : `${new Intl.NumberFormat("fr-FR").format(v)}${unit === "min" ? " min" : ""}`;

/** Valeur + objectif + barre de progression (vert atteint, orange en cours, rouge loin). */
export function MetricCell({ m, value, goal }: { m: Metric; value: number | null; goal: number | null }) {
  const ratio = goal == null || value == null ? null : m.lower ? (value <= goal ? 1 : goal / Math.max(1, value)) : Math.min(1, value / Math.max(1, goal));
  const tone = ratio == null ? "bg-slate-300" : ratio >= 1 ? "bg-emerald-500" : ratio >= 0.6 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="min-w-[6.5rem]">
      <p className="font-semibold text-ink">{fmt(value, m.unit)}{goal != null ? <span className="font-normal text-muted"> / {fmt(goal, m.unit)}</span> : null}</p>
      {ratio != null ? <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100"><div className={"h-1.5 rounded-full " + tone} style={{ width: `${Math.round(ratio * 100)}%` }} /></div> : null}
    </div>
  );
}

/** Objectifs du mois : pour une personne, ou « pour toute l'équipe » (managerId « * »). */
export function GoalsEditor({ managerId, label, period, metrics, initial }: { managerId: string; label: string; period: string; metrics: Metric[]; initial: Record<string, number | null> }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [v, setV] = useState<Record<string, string>>(Object.fromEntries(metrics.filter((m) => m.goal).map((m) => [m.key, initial[m.key] != null ? String(initial[m.key]) : ""])));
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="rounded-md px-2.5 py-1 text-xs font-semibold text-brand-800 ring-1 ring-slate-300">🎯 {label}</button>;
  return (
    <div className="mt-2 rounded-lg bg-slate-50 p-3 text-left" data-goals={managerId}>
      <div className="grid gap-2 sm:grid-cols-3">
        {metrics.filter((m) => m.goal).map((m) => (
          <label key={m.key} className="block text-xs font-semibold text-ink">{m.label}{m.lower ? " (maximum)" : ""}
            <input inputMode="numeric" className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm" placeholder={managerId === "*" ? "—" : "objectif de l’équipe"} value={v[m.key] ?? ""} onChange={(e) => setV({ ...v, [m.key]: e.target.value.replace(/\D/g, "") })} />
          </label>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button type="button" disabled={pending} onClick={() => start(async () => {
          const r = await saveGoalsAction(managerId, period, Object.fromEntries(Object.entries(v).map(([k, x]) => [k, x === "" ? null : Number(x)])));
          setMsg(r.ok ? "Objectifs enregistrés." : r.error ?? "Erreur."); if (r.ok) { setOpen(false); router.refresh(); }
        })} className="rounded-md bg-brand-800 px-3 py-1.5 text-xs font-semibold text-white">Enregistrer</button>
        <button type="button" onClick={() => setOpen(false)} className="text-xs font-semibold text-slate-500">Fermer</button>
        {msg ? <span className="text-xs text-muted">{msg}</span> : null}
      </div>
    </div>
  );
}
