"use client";

import { useState, useTransition } from "react";
import { coListingAction, proposeCoListingAction, type CoItem } from "../actions";

const STATUS: Record<CoItem["status"], [string, string]> = {
  pending: ["En attente", "bg-amber-100 text-amber-900"], accepted: ["En cours", "bg-emerald-100 text-emerald-800"],
  rejected: ["Refusée", "bg-slate-100 text-slate-600"], stopped: ["Arrêtée", "bg-slate-100 text-slate-600"], expired: ["Expirée", "bg-slate-100 text-slate-600"],
};
const inp = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand-600";
const formatXOF = (n: number) => `${Math.round(Number(n) || 0).toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, " ")} FCFA`;
const date = (s: string) => new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

function Copy({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" onClick={() => { navigator.clipboard?.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); }} className="rounded-full bg-ink px-4 py-2 text-xs font-bold text-white">{done ? "Lien copié" : label}</button>;
}

/** Proposer une annonce à un confrère : part de commission, durée, message → lien à partager. */
export function CoProposeForm({ listings, initial }: { listings: { id: string; title: string }[]; initial?: string }) {
  const [listingId, setListingId] = useState(listings.some((l) => l.id === initial) ? initial! : listings[0].id);
  const [pct, setPct] = useState(50);
  const [days, setDays] = useState(30);
  const [message, setMessage] = useState("");
  const [res, setRes] = useState<{ url?: string; error?: string } | null>(null);
  const [pending, start] = useTransition();
  if (res?.url) {
    const wa = `https://wa.me/?text=${encodeURIComponent(`Bonjour, je vous propose de collaborer sur une annonce Moboo (${100 - pct} % de la commission pour vous). Voir et accepter : ${res.url}`)}`;
    return (
      <div className="mt-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
        <p className="font-semibold">Proposition créée. Envoyez ce lien à votre confrère (valable 7 jours) :</p>
        <p className="mt-2 break-all rounded-lg bg-white px-3 py-2 font-mono text-xs text-ink ring-1 ring-emerald-200">{res.url}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Copy text={res.url} label="Copier le lien" />
          <a href={wa} target="_blank" rel="noreferrer" className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-bold text-white">Envoyer sur WhatsApp</a>
          <button type="button" onClick={() => setRes(null)} className="rounded-full px-4 py-2 text-xs font-bold text-emerald-900 ring-1 ring-emerald-300">Nouvelle proposition</button>
        </div>
      </div>
    );
  }
  return (
    <form className="mt-3 grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); setRes(null); start(async () => { const r = await proposeCoListingAction({ listingId, pct, days, message }); setRes(r.ok ? { url: r.shareUrl } : { error: r.error }); }); }}>
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-slate-600">Annonce</span>
        <select value={listingId} onChange={(e) => setListingId(e.target.value)} className={inp}>{listings.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}</select>
      </label>
      <label><span className="mb-1 block text-xs font-semibold text-slate-600">Votre part de la commission : <b>{pct} %</b> · confrère : <b>{100 - pct} %</b></span>
        <input type="range" min={10} max={90} step={5} value={pct} onChange={(e) => setPct(Number(e.target.value))} className="w-full accent-brand-700" />
      </label>
      <label><span className="mb-1 block text-xs font-semibold text-slate-600">Durée de l’accord</span>
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={inp}><option value={7}>7 jours</option><option value={30}>30 jours</option><option value={90}>90 jours</option></select>
      </label>
      <label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold text-slate-600">Message au confrère (facultatif)</span>
        <textarea rows={2} maxLength={500} value={message} onChange={(e) => setMessage(e.target.value)} className={inp} placeholder="Ex. clés disponibles chez le gardien, visites le samedi" />
      </label>
      {res?.error ? <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 sm:col-span-2">{res.error}</p> : null}
      <div className="sm:col-span-2"><button type="submit" disabled={pending} className="rounded-full bg-accent-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "Création…" : "Créer le lien de collaboration"}</button></div>
    </form>
  );
}

/** Une collaboration (envoyée ou reçue) : statut, partenaire, commission, statistiques, lien et arrêt. */
export function CoCard({ c }: { c: CoItem }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const [label, cls] = STATUS[c.status] ?? STATUS.expired;
  const p = c.property;
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <div className="flex gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {p?.image ? <img src={p.image} alt="" className="h-16 w-24 shrink-0 rounded-xl object-cover" /> : <span className="h-16 w-24 shrink-0 rounded-xl bg-slate-100" />}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2"><span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span><span className="text-xs text-muted">{c.status === "pending" ? `lien valable jusqu’au ${date(c.ends_at)}` : c.status === "accepted" ? `jusqu’au ${date(c.ends_at)}` : `créée le ${date(c.created_at)}`}</span></p>
          {p ? <a href={p.link} target="_blank" rel="noreferrer" className="mt-1 block truncate font-semibold text-ink hover:text-brand-800">{p.title}</a> : <p className="mt-1 text-sm text-muted">Annonce retirée</p>}
          <p className="text-xs text-muted">{p ? formatXOF(p.price) : ""} · Commission : vous {c.role === "owner" ? c.commission_owner_pct : c.commission_co_pct} % · {c.role === "owner" ? "confrère" : "proposant"} {c.role === "owner" ? c.commission_co_pct : c.commission_owner_pct} %</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        {c.partner ? <span className="text-slate-700">{c.role === "owner" ? "Confrère" : "Proposé par"} : <b>{c.partner.name}</b>{c.partner.phone ? <> · <a href={`tel:${c.partner.phone}`} className="text-brand-700">{c.partner.phone}</a></> : null}</span> : c.role === "owner" && c.status === "pending" ? <span className="text-slate-600">En attente qu’un confrère accepte</span> : null}
        <span className="text-xs text-muted">Via le lien du confrère : {c.stats.views} vue(s) · {c.stats.contacts} contact(s)</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {c.share_url ? <Copy text={c.share_url} label="Copier le lien à envoyer" /> : null}
        {c.my_link ? <Copy text={c.my_link} label="Copier mon lien de diffusion" /> : null}
        {c.status === "pending" || c.status === "accepted" ? (
          <button type="button" disabled={pending} onClick={() => { if (!window.confirm("Arrêter cette collaboration ?")) return; setErr(null); start(async () => { const r = await coListingAction(c.token, "stop"); if (!r.ok) setErr(r.error); }); }}
            className="rounded-full px-4 py-2 text-xs font-bold text-red-700 ring-1 ring-red-200 disabled:opacity-60">Arrêter</button>
        ) : null}
      </div>
      {err ? <p role="alert" className="mt-2 text-sm text-red-700">{err}</p> : null}
    </div>
  );
}
