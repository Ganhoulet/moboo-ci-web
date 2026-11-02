"use client";

import { useState, useTransition } from "react";
import { sendProgramLeadAction } from "@/app/programmes-neufs/[slug]/actions";

const field = "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-700";

/** Formulaire « Recevoir la brochure / être rappelé » d'un programme neuf (Côte d'Ivoire ou diaspora). */
export function ProgramLeadForm({ slug, units }: { slug: string; units: string[] }) {
  const [f, setF] = useState({ name: "", phone: "", email: "", residence: "ci", country: "", unit: "", budget: "", visit: false, message: "" });
  const [state, setState] = useState<{ ok?: boolean; error?: string }>({});
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  if (state.ok) return <div className="rounded-2xl bg-emerald-50 p-5 text-center ring-1 ring-emerald-200"><p className="font-bold text-emerald-900">Demande envoyée ✓</p><p className="mt-1 text-sm text-emerald-800">Le promoteur vous contacte rapidement avec la brochure, les prix et les disponibilités.</p></div>;
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => setState(await sendProgramLeadAction(slug, { ...f, budget: Number(f.budget.replace(/\D/g, "")) || undefined }))); }}>
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
        {[["ci", "En Côte d’Ivoire"], ["diaspora", "Diaspora"]].map(([k, l]) => <button key={k} type="button" onClick={() => set("residence", k)} className={"rounded-lg py-2 " + (f.residence === k ? "bg-white text-ink shadow" : "text-muted")}>{l}</button>)}
      </div>
      <input required value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Votre nom" autoComplete="name" className={field} />
      <input required value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder={f.residence === "diaspora" ? "Téléphone avec indicatif (ex. +33 6…)" : "Téléphone (WhatsApp)"} inputMode="tel" autoComplete="tel" className={field} />
      {f.residence === "diaspora" ? <input value={f.country} onChange={(e) => set("country", e.target.value)} placeholder="Pays de résidence" className={field} /> : null}
      <input value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="E-mail (pour la brochure)" inputMode="email" autoComplete="email" className={field} />
      {units.length ? <select value={f.unit} onChange={(e) => set("unit", e.target.value)} className={field} aria-label="Lot"><option value="">Type de lot qui m’intéresse</option>{units.map((u) => <option key={u} value={u}>{u}</option>)}</select> : null}
      <input value={f.budget} onChange={(e) => set("budget", e.target.value)} inputMode="numeric" placeholder="Budget (FCFA)" className={field} />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.visit} onChange={(e) => set("visit", e.target.checked)} /> {f.residence === "diaspora" ? "Je souhaite une visite vidéo" : "Je souhaite visiter"}</label>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <button disabled={pending} className="w-full rounded-xl bg-accent-600 py-3 font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "Envoi…" : "Recevoir la brochure et les prix"}</button>
    </form>
  );
}
