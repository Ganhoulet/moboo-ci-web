"use client";

import { useState, useTransition } from "react";
import { COMMUNES } from "@/lib/accounts";
import { sendDiasporaAction } from "@/app/diaspora/actions";

const field = "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-700";
const PROJECTS: [string, string][] = [["buy", "Acheter"], ["build", "Construire"], ["rent", "Louer"], ["manage", "Faire gérer mon bien"]];

/** Formulaire de la page Diaspora. */
export function DiasporaForm({ packs }: { packs: string[] }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", country: "", project: "buy", pack: packs[0] ?? "", budget: "", commune: "", wantsVideo: true, message: "" });
  const [state, setState] = useState<{ ok?: boolean; error?: string }>({});
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  if (state.ok) return <div className="rounded-2xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200"><p className="text-lg font-bold text-emerald-900">Merci ! Un conseiller Moboo vous contacte sous 24 h.</p><p className="mt-1 text-sm text-emerald-800">Par WhatsApp, à l’heure qui vous arrange (nous tenons compte du décalage horaire).</p></div>;
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => setState(await sendDiasporaAction({ ...f, budget: Number(f.budget.replace(/\D/g, "")) || undefined }))); }}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{PROJECTS.map(([k, l]) => <button key={k} type="button" onClick={() => set("project", k)} className={"rounded-xl py-2.5 text-sm font-bold " + (f.project === k ? "bg-brand-800 text-white" : "bg-white ring-1 ring-slate-300")}>{l}</button>)}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input required value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Nom et prénom" autoComplete="name" className={field} />
        <input required value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="WhatsApp avec indicatif (+33, +1…)" inputMode="tel" autoComplete="tel" className={field} />
        <input value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="E-mail" inputMode="email" autoComplete="email" className={field} />
        <input value={f.country} onChange={(e) => set("country", e.target.value)} placeholder="Pays de résidence" className={field} />
        <input value={f.commune} onChange={(e) => set("commune", e.target.value)} list="dia-communes" placeholder="Commune / ville en Côte d’Ivoire" className={field} />
        <input value={f.budget} onChange={(e) => set("budget", e.target.value)} inputMode="numeric" placeholder="Budget (FCFA)" className={field} />
        {packs.length ? <select value={f.pack} onChange={(e) => set("pack", e.target.value)} className={field + " sm:col-span-2"} aria-label="Offre">{packs.map((p) => <option key={p} value={p}>{p}</option>)}</select> : null}
      </div>
      <datalist id="dia-communes">{COMMUNES.map((c) => <option key={c} value={c} />)}</datalist>
      <textarea value={f.message} onChange={(e) => set("message", e.target.value)} rows={3} placeholder="Votre projet en quelques mots" className={field} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.wantsVideo} onChange={(e) => set("wantsVideo", e.target.checked)} /> Je veux des visites en vidéo</label>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <button disabled={pending} className="w-full rounded-xl bg-accent-600 py-3 font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "Envoi…" : "Être rappelé par un conseiller"}</button>
    </form>
  );
}
