"use client";

import { useState, useTransition } from "react";
import { usePathname } from "next/navigation";
import { proLeadAction } from "@/app/professionnels-actions";

const AUD: [string, string][] = [["agents", "Agent immobilier"], ["agences", "Agence / promoteur"], ["proprietaires", "Propriétaire"], ["residences", "Résidences meublées"], ["espaces", "Espace événementiel"], ["autre", "Autre"]];

/** « Être rappelé par un conseiller » : nom, téléphone, profil, ville, message. */
export function ProLeadForm({ audience, button, dark }: { audience: string; button: string; dark: boolean }) {
  const path = usePathname();
  const [f, setF] = useState<Record<string, string>>({ audience, name: "", phone: "", email: "", company: "", city: "", message: "", website: "" });
  const [state, setState] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const input = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
  if (state?.ok) {
    return (
      <div className={"rounded-2xl p-8 text-center " + (dark ? "bg-white/10" : "bg-emerald-50")}>
        <p className="text-4xl">✅</p>
        <p className={"mt-3 font-display text-xl font-bold " + (dark ? "text-white" : "text-ink")}>Merci, c’est noté !</p>
        <p className={dark ? "text-white/80" : "text-slate-600"}>Un conseiller Moboo vous rappelle très vite au {f.phone}.</p>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); start(async () => { const r = await proLeadAction({ ...f, source: path }); setState(r.ok ? { ok: true, text: "" } : { ok: false, text: r.error ?? "Erreur." }); }); }}
      className="grid gap-3 rounded-2xl bg-white p-5 shadow-xl sm:grid-cols-2 sm:p-6">
      <input required value={f.name} onChange={set("name")} placeholder="Nom et prénom *" className={input} autoComplete="name" />
      <input required value={f.phone} onChange={set("phone")} placeholder="Téléphone (WhatsApp) *" inputMode="tel" className={input} autoComplete="tel" />
      <select value={f.audience} onChange={set("audience")} className={input} aria-label="Votre activité">{AUD.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
      <input value={f.company} onChange={set("company")} placeholder="Agence / établissement" className={input} autoComplete="organization" />
      <input value={f.city} onChange={set("city")} placeholder="Ville ou commune" className={input} />
      <input value={f.email} onChange={set("email")} placeholder="E-mail (facultatif)" type="email" className={input} autoComplete="email" />
      <textarea value={f.message} onChange={set("message")} placeholder="Votre besoin (facultatif) : nombre de biens, objectif…" rows={3} className={input + " sm:col-span-2"} />
      <input value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {state && !state.ok ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{state.text}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
        <p className="text-xs text-muted">Vos coordonnées servent uniquement à vous rappeler.</p>
        <button type="submit" disabled={pending} className="rounded-full bg-accent-600 px-6 py-3 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "Envoi…" : button}</button>
      </div>
    </form>
  );
}
