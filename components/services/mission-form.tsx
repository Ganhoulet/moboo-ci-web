"use client";

import { useState, useTransition } from "react";
import { missionRequestAction } from "@/app/services-actions";
import { MISSION_FIELDS } from "@/lib/missions";
import type { MissionKey } from "@/lib/site-services";
import { SiteIcon } from "@/components/site-icon";

const input = "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-ink outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100";
const label = "mb-1 block text-xs font-semibold text-slate-600";
const PROP_TYPES = ["Appartement", "Studio", "Maison", "Villa", "Duplex", "Terrain", "Bureau", "Magasin", "Immeuble", "Autre"];

/** Commande d'une mission Moboo : coordonnées, lieu, bien et champs propres au service. */
export function MissionForm({ service, price }: { service: MissionKey; price: string }) {
  const fields = MISSION_FIELDS[service] ?? [];
  const [f, setF] = useState<Record<string, string>>({ full_name: "", phone: "", email: "", commune: "", zone: "", prop_type: service === "verif_fonciere" ? "Terrain" : "Appartement", preferred_date: "", message: "", website: "" });
  const [d, setD] = useState<Record<string, string>>({});
  const [done, setDone] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((x) => ({ ...x, [k]: e.target.value }));
  if (done != null) {
    return (
      <div className="rounded-2xl bg-emerald-50 p-8 text-center">
        <p className="text-4xl"><SiteIcon value="✅" size={16} className="mr-1 inline-block align-[-3px]" /></p>
        <p className="mt-3 font-display text-xl font-bold text-ink">Demande n° {done} enregistrée</p>
        <p className="mt-1 text-slate-600">Un agent Moboo vous appelle au {f.phone} pour organiser la mission.</p>
      </div>
    );
  }
  return (
    <form onSubmit={(e) => { e.preventDefault(); if (f.website) return; setErr(null); start(async () => { const r = await missionRequestAction(service, { ...f, details: d }); if (r.ok) setDone(Number(r.data?.id) || 0); else setErr(r.error); }); }}
      className="grid gap-4 sm:grid-cols-2">
      {price ? <p className="rounded-xl bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-900 sm:col-span-2"><SiteIcon value="💳" size={16} className="mr-1 inline-block align-[-3px]" />{price}</p> : null}
      <div><label className={label} htmlFor="ms-name">Nom et prénom *</label><input id="ms-name" required value={f.full_name} onChange={set("full_name")} className={input} autoComplete="name" /></div>
      <div><label className={label} htmlFor="ms-phone">Téléphone (WhatsApp) *</label><input id="ms-phone" required value={f.phone} onChange={set("phone")} inputMode="tel" className={input} autoComplete="tel" /></div>
      <div><label className={label} htmlFor="ms-commune">Commune / ville du bien *</label><input id="ms-commune" required value={f.commune} onChange={set("commune")} placeholder="Ex. Cocody" className={input} /></div>
      <div><label className={label} htmlFor="ms-zone">Quartier</label><input id="ms-zone" value={f.zone} onChange={set("zone")} placeholder="Ex. Angré" className={input} /></div>
      <div>
        <label className={label} htmlFor="ms-type">Type de bien</label>
        <select id="ms-type" value={f.prop_type} onChange={set("prop_type")} className={input}>{PROP_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
      </div>
      <div><label className={label} htmlFor="ms-date">Date souhaitée</label><input id="ms-date" type="date" value={f.preferred_date} onChange={set("preferred_date")} className={input} /></div>
      {fields.map((x) => {
        const id = `ms-${x.key}`;
        const v = d[x.key] ?? "";
        const on = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setD((o) => ({ ...o, [x.key]: e.target.value }));
        return (
          <div key={x.key} className={x.type === "textarea" ? "sm:col-span-2" : ""}>
            <label className={label} htmlFor={id}>{x.label}</label>
            {x.type === "select" ? (
              <select id={id} value={v} onChange={on} className={input}><option value="">—</option>{x.options?.map((o) => <option key={o}>{o}</option>)}</select>
            ) : x.type === "textarea" ? (
              <textarea id={id} rows={2} value={v} onChange={on} placeholder={x.placeholder} className={input} />
            ) : (
              <input id={id} value={v} onChange={on} placeholder={x.placeholder} inputMode={x.type === "number" ? "numeric" : undefined} type={x.type === "url" ? "url" : "text"} className={input} />
            )}
          </div>
        );
      })}
      <div><label className={label} htmlFor="ms-email">E-mail (facultatif)</label><input id="ms-email" type="email" value={f.email} onChange={set("email")} className={input} autoComplete="email" /></div>
      <div className="sm:col-span-2"><label className={label} htmlFor="ms-msg">Précisions (facultatif)</label><textarea id="ms-msg" rows={2} value={f.message} onChange={set("message")} className={input} /></div>
      <input value={f.website} onChange={set("website")} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {err ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{err}</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
        <p className="text-xs text-muted">Sans engagement : un agent Moboo vous rappelle pour confirmer.</p>
        <button type="submit" disabled={pending} className="rounded-full bg-accent-600 px-6 py-3 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "Envoi…" : "Envoyer ma demande"}</button>
      </div>
    </form>
  );
}
