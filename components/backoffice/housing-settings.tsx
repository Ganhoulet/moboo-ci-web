"use client";

import { useState, useTransition } from "react";
import { saveHousingSettings } from "@/app/admin/services/actions";
import type { HousingConfig, HousingPack } from "@/lib/site-services";

const inp = "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-brand-600";
const lab = "mb-1 block text-xs font-semibold text-slate-600";
const lines = (s: string) => s.split("\n").map((x) => x.trim()).filter(Boolean);

/** Back-office → Pages des services → Recherche de logement : communes ouvertes, forfaits et paiement. */
export function HousingSettings({ initial }: { initial: HousingConfig }) {
  const [h, setH] = useState<HousingConfig>(initial);
  const [communes, setCommunes] = useState(initial.communes.join("\n"));
  const [channels, setChannels] = useState(initial.channels.join("\n"));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const setPack = (i: number, v: Partial<HousingPack>) => setH((x) => ({ ...x, packs: x.packs.map((p, k) => (k === i ? { ...p, ...v } : p)) }));
  return (
    <section className="space-y-4 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div>
        <h2 className="font-display text-lg font-bold text-ink">Forfaits et communes</h2>
        <p className="text-sm text-muted">Les demandes arrivent dans Services Moboo › Missions, avec leur facture. Quand le client a payé, la facture passe « Payée » : envoyez-lui photos et vidéos par le canal choisi.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block"><span className={lab}>Communes ouvertes (une par ligne)</span><textarea rows={4} value={communes} onChange={(e) => setCommunes(e.target.value)} className={inp} /></label>
        <label className="block"><span className={lab}>Canaux d’envoi proposés (un par ligne)</span><textarea rows={4} value={channels} onChange={(e) => setChannels(e.target.value)} className={inp} /></label>
        <label className="flex items-start gap-2 pt-6 text-sm"><input type="checkbox" checked={h.payOnline} onChange={(e) => setH({ ...h, payOnline: e.target.checked })} className="mt-0.5 h-4 w-4" /><span><b>Paiement en ligne à la demande</b><br /><span className="text-muted">Décoché : la demande est enregistrée, vous envoyez le lien de paiement depuis Missions (« Facturer »).</span></span></label>
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {h.packs.map((p, i) => (
          <div key={i} className="space-y-2 rounded-lg bg-slate-50 p-3 ring-1 ring-slate-200">
            <div className="grid grid-cols-2 gap-2">
              <label className="col-span-2 block"><span className={lab}>Nom</span><input value={p.label} onChange={(e) => setPack(i, { label: e.target.value })} className={inp} /></label>
              <label className="block"><span className={lab}>Prix (FCFA)</span><input value={p.price} inputMode="numeric" onChange={(e) => setPack(i, { price: Number(e.target.value.replace(/\D/g, "")) || 0 })} className={inp} /></label>
              <label className="block"><span className={lab}>Visites offertes</span><input value={p.visits} inputMode="numeric" onChange={(e) => setPack(i, { visits: Number(e.target.value.replace(/\D/g, "")) || 0 })} className={inp} /></label>
            </div>
            <label className="block"><span className={lab}>Inclus (un par ligne)</span><textarea rows={3} value={p.items.join("\n")} onChange={(e) => setPack(i, { items: e.target.value.split("\n") })} className={inp} /></label>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2"><input type="checkbox" checked={p.featured} onChange={(e) => setPack(i, { featured: e.target.checked })} />Mis en avant</label>
              <button type="button" onClick={() => setH((x) => ({ ...x, packs: x.packs.filter((_, k) => k !== i) }))} className="text-xs font-semibold text-red-700">Supprimer</button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {h.packs.length < 6 ? <button type="button" onClick={() => setH((x) => ({ ...x, packs: [...x.packs, { id: "", label: "Nouveau forfait", price: 20000, visits: 0, items: [], featured: false }] }))} className="rounded-md px-3 py-2 text-sm font-semibold text-brand-700 ring-1 ring-brand-200">+ Ajouter un forfait</button> : null}
        <button type="button" disabled={pending} onClick={() => start(async () => {
          setMsg(null);
          const r = await saveHousingSettings({ ...h, communes: lines(communes), channels: lines(channels), packs: h.packs.map((p) => ({ ...p, items: p.items.map((x) => x.trim()).filter(Boolean) })) });
          if (r.ok && r.housing) { setH(r.housing as HousingConfig); setCommunes((r.housing as HousingConfig).communes.join("\n")); setChannels((r.housing as HousingConfig).channels.join("\n")); setMsg({ ok: true, text: "Enregistré. En ligne d’ici 2 minutes." }); }
          else setMsg({ ok: false, text: r.error ?? "Enregistrement impossible." });
        })} className="rounded-md bg-ink px-5 py-2 text-sm font-bold text-white disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer forfaits et communes"}</button>
        {msg ? <p className={"text-sm " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
      </div>
    </section>
  );
}
