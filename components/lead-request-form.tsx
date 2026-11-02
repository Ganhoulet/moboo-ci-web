"use client";

import { useState, useTransition } from "react";
import { COMMUNES, PROPERTY_TYPES } from "@/lib/accounts";
import { closeLeadRequestAction, createLeadRequestAction, type MyLeadRequest } from "@/app/je-cherche/actions";

const PURPOSES: [string, string][] = [["rent", "Louer"], ["buy", "Acheter"], ["furnished", "Meublé / séjour"]];
const field = "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-brand-700";

/** « Je cherche » : le demandeur décrit son besoin ; les agents de la zone le rappellent. */
export function LeadRequestForm({ defaults, mine }: { defaults: { name: string; phone: string }; mine: MyLeadRequest[] }) {
  const [f, setF] = useState({ purpose: "rent", propType: "appartement", commune: "", quartier: "", budgetMax: "", bedrooms: "", moveDate: "", message: "", urgent: false, name: defaults.name, phone: defaults.phone });
  const [state, setState] = useState<{ ok?: boolean; error?: string }>({});
  const [pending, start] = useTransition();
  const set = (k: keyof typeof f, v: string | boolean) => setF((x) => ({ ...x, [k]: v }));
  return (
    <div className="space-y-6">
      {state.ok ? (
        <div className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200">
          <p className="font-bold text-emerald-900">C’est envoyé ! Les agents de {f.commune} reçoivent votre demande.</p>
          <p className="mt-1 text-sm text-emerald-800">Au maximum 3 agents vous rappelleront : vous n’êtes pas harcelé. Vous êtes prévenu à chaque prise en charge.</p>
          <button type="button" onClick={() => setState({})} className="mt-3 text-sm font-semibold text-emerald-900 underline">Faire une autre demande</button>
        </div>
      ) : (
        <form className="space-y-4 rounded-2xl bg-white p-5 shadow-card" onSubmit={(e) => {
          e.preventDefault();
          start(async () => setState(await createLeadRequestAction({ ...f, budgetMax: Number(f.budgetMax.replace(/\D/g, "")) || undefined, bedrooms: Number(f.bedrooms) || undefined })));
        }}>
          <div className="grid grid-cols-3 gap-2">
            {PURPOSES.map(([k, l]) => (
              <button key={k} type="button" onClick={() => set("purpose", k)} className={"rounded-xl py-2.5 text-sm font-bold " + (f.purpose === k ? "bg-brand-800 text-white" : "bg-white ring-1 ring-slate-300")}>{l}</button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={f.propType} onChange={(e) => set("propType", e.target.value)} className={field} aria-label="Type de bien">
              {PROPERTY_TYPES.map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
            </select>
            <input required value={f.commune} onChange={(e) => set("commune", e.target.value)} list="jc-communes" placeholder="Commune (ex. Cocody)" className={field} />
            <input value={f.quartier} onChange={(e) => set("quartier", e.target.value)} placeholder="Quartier (facultatif)" className={field} />
            <input value={f.budgetMax} onChange={(e) => set("budgetMax", e.target.value)} inputMode="numeric" placeholder={f.purpose === "buy" ? "Budget maximum (FCFA)" : "Loyer maximum (FCFA)"} className={field} />
            <select value={f.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className={field} aria-label="Chambres">
              <option value="">Chambres : peu importe</option>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}{n === 4 ? "+" : ""} chambre{n > 1 ? "s" : ""}</option>)}
            </select>
            <input type="date" value={f.moveDate} onChange={(e) => set("moveDate", e.target.value)} aria-label="Date souhaitée" className={field} />
          </div>
          <datalist id="jc-communes">{COMMUNES.map((c) => <option key={c} value={c} />)}</datalist>
          <textarea value={f.message} onChange={(e) => set("message", e.target.value)} rows={3} placeholder="Précisions : étage, parking, proche d’une école, animaux…" className={field} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input required value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="Votre nom" autoComplete="name" className={field} />
            <input required value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Votre téléphone (WhatsApp)" inputMode="tel" autoComplete="tel" className={field} />
          </div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.urgent} onChange={(e) => set("urgent", e.target.checked)} /> C’est urgent (dans les 15 jours)</label>
          {state.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
          <button disabled={pending} className="w-full rounded-xl bg-accent-600 py-3 font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "Envoi…" : "Envoyer ma demande aux agents"}</button>
          <p className="text-center text-xs text-muted">Gratuit. Votre numéro n’est transmis qu’aux 3 agents maximum qui prennent votre demande.</p>
        </form>
      )}

      {mine.length ? (
        <section className="rounded-2xl bg-white p-5 shadow-card">
          <h2 className="font-bold text-ink">Mes demandes</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm">
            {mine.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="min-w-0 flex-1"><b className="text-ink">{PURPOSES.find(([k]) => k === r.purpose)?.[1]} · {r.propType} à {r.commune}</b>{r.budgetMax ? ` · ≤ ${r.budgetMax.toLocaleString("fr-FR")} F` : ""}<br />
                  <span className="text-xs text-muted">{r.agents} agent(s) sur {r.maxBuyers} ont pris votre demande · {r.status === "open" ? `active jusqu’au ${new Date(r.expiresAt).toLocaleDateString("fr-FR")}` : r.status === "closed" ? "fermée" : "expirée"}</span></span>
                {r.status === "open" ? <button type="button" onClick={() => start(async () => { await closeLeadRequestAction(r.id); })} className="text-xs font-semibold text-red-700">J’ai trouvé · fermer</button> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
