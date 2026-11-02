"use client";

import { useState, useTransition } from "react";
import { COMMUNES } from "@/lib/accounts";
import { sendServiceLeadAction } from "@/app/prestataires/[slug]/actions";

/** Formulaire « Demander un devis » de la mini-page d'un prestataire. */
export function ServiceLeadForm({ slug, providerName, adId }: { slug: string; providerName: string; adId?: string }) {
  const [f, setF] = useState({ name: "", phone: "", need: "", commune: "", date: "" });
  const [state, setState] = useState<{ ok?: boolean; error?: string }>({});
  const [pending, start] = useTransition();
  const field = "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-700";
  if (state.ok) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-5 text-center ring-1 ring-emerald-200">
        <p className="text-2xl" aria-hidden="true">✓</p>
        <p className="mt-1 font-bold text-emerald-900">Demande envoyée à {providerName}</p>
        <p className="mt-1 text-sm text-emerald-800">Le prestataire vous rappelle rapidement sur votre numéro.</p>
      </div>
    );
  }
  return (
    <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); start(async () => setState(await sendServiceLeadAction(slug, { ...f, adId }))); }}>
      <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Votre nom" autoComplete="name" className={field} />
      <input required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="Votre téléphone (WhatsApp)" inputMode="tel" autoComplete="tel" className={field} />
      <textarea required value={f.need} onChange={(e) => setF({ ...f, need: e.target.value })} rows={3} placeholder="Votre besoin (ex. déménagement d’un 3 pièces de Cocody à Bingerville)" className={field} />
      <div className="grid grid-cols-2 gap-2">
        <input value={f.commune} onChange={(e) => setF({ ...f, commune: e.target.value })} list="lead-communes" placeholder="Commune" className={field} />
        <input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} aria-label="Date souhaitée" className={field} />
      </div>
      <datalist id="lead-communes">{COMMUNES.map((c) => <option key={c} value={c} />)}</datalist>
      {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
      <button disabled={pending} className="w-full rounded-xl bg-accent-600 py-3 font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "Envoi…" : "Demander un devis gratuit"}</button>
      <p className="text-center text-[11px] text-muted">Vos coordonnées sont transmises uniquement à ce prestataire.</p>
    </form>
  );
}
