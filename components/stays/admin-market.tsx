"use client";

import { useState, useTransition } from "react";
import { deleteMarketAction, saveMarketAction, type MarketRow } from "@/app/admin/sejours/actions";

const TYPES: [string, string][] = [["ALL", "Tous logements"], ["STUDIO", "Studio"], ["TWO_ROOMS", "2 pièces"], ["THREE_ROOMS", "3 pièces"], ["VILLA", "Villa"]];
const EMPTY = { commune: "", type: "ALL", median: "", low: "", high: "", sampleSize: "", occupancy: "", source: "", sourceUrl: "", observedAt: new Date().toISOString().slice(0, 10), note: "", status: "published" };
const f = (n: number | null) => (n == null ? "—" : `${n.toLocaleString("fr-FR")} F`);

/** Saisie des relevés de prix du marché. La source reste dans le back-office. */
export function MarketBoard({ rows }: { rows: MarketRow[] }) {
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [id, setId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();
  const set = (k: string) => (e: { target: { value: string } }) => setForm({ ...form, [k]: e.target.value });
  const edit = (r: MarketRow) => {
    setId(r.id);
    setForm(Object.fromEntries(Object.entries({ ...EMPTY, ...r, observedAt: r.observedAt.slice(0, 10) }).map(([k, v]) => [k, v == null ? "" : String(v)])));
    setMsg("");
  };
  const save = () => start(async () => {
    const r = await saveMarketAction(id, form);
    setMsg(r.ok ? "Relevé enregistré." : r.error);
    if (r.ok) { setId(null); setForm(EMPTY); }
  });
  const del = (r: MarketRow) => { if (confirm(`Supprimer le relevé ${r.commune} du ${r.observedAt.slice(0, 10)} ?`)) start(async () => { const x = await deleteMarketAction(r.id); setMsg(x.ok ? "Relevé supprimé." : x.error); }); };
  const input = "mt-1 w-full rounded-lg border border-slate-300 p-2";
  return (
    <div className="space-y-5">
      <div className="grid gap-3 rounded-lg bg-white p-5 text-sm shadow-sm ring-1 ring-slate-200 sm:grid-cols-2 lg:grid-cols-4">
        <label><span className="font-semibold text-ink">Commune ou ville</span><input value={form.commune} onChange={set("commune")} placeholder="Cocody" className={input} /></label>
        <label><span className="font-semibold text-ink">Type</span><select value={form.type} onChange={set("type")} className={input}>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label><span className="font-semibold text-ink">Nuit médiane (F)</span><input inputMode="numeric" value={form.median} onChange={set("median")} placeholder="30000" className={input} /></label>
        <label><span className="font-semibold text-ink">Nombre d’annonces</span><input inputMode="numeric" value={form.sampleSize} onChange={set("sampleSize")} placeholder="120" className={input} /></label>
        <label><span className="font-semibold text-ink">Prix bas (F)</span><input inputMode="numeric" value={form.low} onChange={set("low")} className={input} /></label>
        <label><span className="font-semibold text-ink">Prix haut (F)</span><input inputMode="numeric" value={form.high} onChange={set("high")} className={input} /></label>
        <label><span className="font-semibold text-ink">Taux d’occupation (%)</span><input inputMode="numeric" value={form.occupancy} onChange={set("occupancy")} className={input} /></label>
        <label><span className="font-semibold text-ink">Date du relevé</span><input type="date" value={form.observedAt} onChange={set("observedAt")} className={input} /></label>
        <label className="sm:col-span-2"><span className="font-semibold text-ink">Source (privée)</span><input value={form.source} onChange={set("source")} placeholder="Nom de l’étude ou du site" className={input} /></label>
        <label className="sm:col-span-2"><span className="font-semibold text-ink">Lien de la source (privé)</span><input value={form.sourceUrl} onChange={set("sourceUrl")} placeholder="https://…" className={input} /></label>
        <label className="sm:col-span-3"><span className="font-semibold text-ink">Note interne</span><input value={form.note} onChange={set("note")} placeholder="Ex. relevé de 40 annonces de studios, Riviera 2 et 3" className={input} /></label>
        <label><span className="font-semibold text-ink">Statut</span><select value={form.status} onChange={set("status")} className={input}><option value="published">Pris en compte</option><option value="hidden">Ignoré</option></select></label>
        <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-4">
          <button type="button" onClick={save} disabled={pending} className="rounded-full bg-ink px-5 py-2 font-semibold text-white hover:bg-black disabled:opacity-50">{id ? "Enregistrer les changements" : "Ajouter le relevé"}</button>
          {id ? <button type="button" onClick={() => { setId(null); setForm(EMPTY); }} className="rounded-full px-4 py-2 font-semibold text-ink ring-1 ring-slate-300">Annuler</button> : null}
          {msg ? <span className="text-muted" role="status">{msg}</span> : null}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Date</th><th className="px-3 py-2">Commune</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Médiane</th><th className="px-3 py-2">Fourchette</th><th className="px-3 py-2">Annonces</th><th className="px-3 py-2">Source (privée)</th><th className="px-3 py-2" /></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`border-t border-slate-100 ${r.status === "hidden" ? "opacity-50" : ""}`}>
                <td className="px-3 py-2 tabular-nums">{r.observedAt.slice(0, 10)}</td><td className="px-3 py-2 font-semibold text-ink">{r.commune}</td>
                <td className="px-3 py-2">{TYPES.find(([v]) => v === r.type)?.[1] ?? r.type}</td><td className="px-3 py-2 tabular-nums">{f(r.median)}</td>
                <td className="px-3 py-2 tabular-nums text-muted">{f(r.low)} – {f(r.high)}</td><td className="px-3 py-2 tabular-nums">{r.sampleSize}{r.occupancy != null ? ` · ${r.occupancy} %` : ""}</td>
                <td className="px-3 py-2">{r.sourceUrl ? <a href={r.sourceUrl} target="_blank" rel="noreferrer" className="underline">{r.source}</a> : r.source}</td>
                <td className="px-3 py-2 text-right"><button type="button" onClick={() => edit(r)} className="font-semibold text-ink underline">Modifier</button> <button type="button" onClick={() => del(r)} className="ml-2 text-muted underline">Supprimer</button></td>
              </tr>
            ))}
            {!rows.length ? <tr><td colSpan={8} className="px-3 py-6 text-center text-muted">Aucun relevé pour le moment.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
