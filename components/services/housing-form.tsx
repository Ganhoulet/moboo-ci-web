"use client";

import { useState, useTransition } from "react";
import { housingRequestAction } from "@/app/services-actions";
import type { HousingConfig } from "@/lib/site-services";

const input = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
const label = "mb-1 block text-xs font-semibold text-slate-600";
const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR").replace(/[  ]/g, " ")} FCFA`;
const TYPES = ["Chambre simple", "Studio", "Chambre salon (2 pièces)", "3 pièces", "4 pièces et plus", "Villa / duplex", "Magasin / bureau"];

/** Formulaire « On vous trouve un logement » : besoin, forfait, canal d'envoi → paiement en ligne. */
export function HousingForm({ cfg, submitText, successText }: { cfg: HousingConfig; submitText?: string; successText?: string }) {
  const best = cfg.packs.find((p) => p.featured) ?? cfg.packs[0];
  const [f, setF] = useState<Record<string, string>>({
    full_name: "", phone: "", email: "", commune: cfg.communes[0] ?? "", zone: "", prop_type: TYPES[1], pieces: "", budget: "", preferred_date: "",
    channel: cfg.channels[0] ?? "WhatsApp", pack: best?.id ?? "", message: "", website: "",
  });
  const [done, setDone] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  const pack = cfg.packs.find((p) => p.id === f.pack);
  if (done != null) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-8 text-center">
        <p className="font-display text-xl font-bold text-ink">Demande n° {done} enregistrée</p>
        <p className="mt-2 text-slate-600">{successText || `Un conseiller Moboo vous écrit au ${f.phone} sous 24 h.`}</p>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => {
      e.preventDefault(); if (f.website) return; setErr(null);
      start(async () => {
        const r = await housingRequestAction(f);
        if (!r.ok) { setErr(r.error); return; }
        if (r.data.payUrl) window.location.href = r.data.payUrl; else setDone(Number(r.data.id) || 0);
      });
    }} className="grid gap-4 sm:grid-cols-2">
      <fieldset className="sm:col-span-2">
        <legend className={label}>Votre forfait *</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {cfg.packs.map((p) => (
            <label key={p.id} className={"cursor-pointer rounded-2xl border-2 p-3 transition " + (f.pack === p.id ? "border-accent-600 bg-accent-50" : "border-slate-200 hover:border-slate-300")}>
              <input type="radio" name="pack" value={p.id} checked={f.pack === p.id} onChange={set("pack")} className="sr-only" />
              <span className="block font-display text-lg font-black text-ink">{fcfa(p.price)}</span>
              <span className="block text-sm font-semibold text-ink">{p.label}</span>
              <span className="block text-xs text-muted">{p.visits ? `${p.visits} visite${p.visits > 1 ? "s" : ""} offerte${p.visits > 1 ? "s" : ""}` : "Photos et vidéos seulement"}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div><label className={label} htmlFor="hs-name">Nom et prénom *</label><input id="hs-name" required value={f.full_name} onChange={set("full_name")} className={input} autoComplete="name" /></div>
      <div><label className={label} htmlFor="hs-phone">Numéro WhatsApp *</label><input id="hs-phone" required value={f.phone} onChange={set("phone")} inputMode="tel" className={input} autoComplete="tel" /></div>
      <div>
        <label className={label} htmlFor="hs-commune">Commune *</label>
        <select id="hs-commune" value={f.commune} onChange={set("commune")} className={input}>{cfg.communes.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <div><label className={label} htmlFor="hs-zone">Quartier souhaité</label><input id="hs-zone" value={f.zone} onChange={set("zone")} placeholder="Ex. Niangon, Selmer, Maroc" className={input} /></div>
      <div>
        <label className={label} htmlFor="hs-type">Type de logement *</label>
        <select id="hs-type" value={f.prop_type} onChange={set("prop_type")} className={input}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <div><label className={label} htmlFor="hs-budget">Loyer maximum (FCFA / mois) *</label><input id="hs-budget" required value={f.budget} onChange={set("budget")} inputMode="numeric" placeholder="Ex. 60 000" className={input} /></div>
      <div><label className={label} htmlFor="hs-date">Date d’entrée souhaitée</label><input id="hs-date" type="date" value={f.preferred_date} onChange={set("preferred_date")} className={input} /></div>
      <div>
        <label className={label} htmlFor="hs-channel">Recevoir les photos par</label>
        <select id="hs-channel" value={f.channel} onChange={set("channel")} className={input}>{cfg.channels.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      <div><label className={label} htmlFor="hs-email">E-mail (facultatif)</label><input id="hs-email" type="email" value={f.email} onChange={set("email")} className={input} autoComplete="email" /></div>
      <div className="sm:col-span-2"><label className={label} htmlFor="hs-msg">Précisions (facultatif)</label><textarea id="hs-msg" rows={2} value={f.message} onChange={set("message")} className={input} placeholder="Ex. rez-de-chaussée, compteur individuel, proche d’une école" /></div>
      <input value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {err ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{err}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
        <p className="text-xs text-muted">{cfg.payOnline && pack ? `Paiement de ${fcfa(pack.price)} par Wave, Orange Money, MTN ou Moov à l’étape suivante.` : "Un conseiller vous rappelle pour confirmer."}</p>
        <button type="submit" disabled={pending} className="rounded-full bg-accent-600 px-6 py-3 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "Envoi…" : cfg.payOnline ? submitText || "Continuer vers le paiement" : "Envoyer ma demande"}</button>
      </div>
    </form>
  );
}
