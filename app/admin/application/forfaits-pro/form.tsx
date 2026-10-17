"use client";

import { useState, useTransition } from "react";
import { saveProPlanConfigAction, type ProPlanConfig } from "../pro-actions";

const PLANS = [["pro", "Pro"], ["business", "Business"], ["enterprise", "Enterprise"]] as const;
const LIMITS = [["starter", "Gratuit"], ["pro", "Pro"], ["business", "Business"], ["enterprise", "Enterprise"]] as const;
const ROLES = [["agency", "Agences"], ["agent", "Agents immobiliers"], ["owner", "Propriétaires"], ["tenant", "Locataires"]] as const;
const card = "rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200";
const input = "w-28 rounded-md border border-slate-300 px-2 py-1 text-sm";

export function ProPlansForm({ cfg }: { cfg: ProPlanConfig }) {
  const [c, setC] = useState(cfg);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const num = (v: string) => (v.trim() === "" ? -1 : Math.trunc(Number(v)));
  const save = () => start(async () => {
    const r = await saveProPlanConfigAction(c);
    setMsg(r.ok ? "Enregistré : la page des abonnements et l’application sont à jour." : r.error ?? "Erreur.");
  });
  return (
    <div className="space-y-4">
      <section className={card}>
        <h2 className="font-semibold text-ink">Paiements</h2>
        <p className="text-xs text-muted">Désactivés : toutes les fonctions de l’application sont gratuites pour tous (mode test).</p>
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={c.payments.enabled} onChange={(e) => setC({ ...c, payments: { ...c.payments, enabled: e.target.checked } })} /> Activer les paiements
        </label>
        <div className={"mt-2 grid gap-1 sm:grid-cols-2 " + (c.payments.enabled ? "" : "opacity-50")}>
          {ROLES.map(([k, l]) => (
            <label key={k} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={c.payments[k] !== false} disabled={!c.payments.enabled} onChange={(e) => setC({ ...c, payments: { ...c.payments, [k]: e.target.checked } })} />
              {l} — {c.payments[k] !== false ? "paiement requis" : "gratuit"}
            </label>
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className="font-semibold text-ink">Prix des forfaits (FCFA / mois)</h2>
        <div className="mt-2 space-y-2">
          {PLANS.map(([k, l]) => (
            <div key={k} className="flex flex-wrap items-center gap-3 text-sm">
              <span className="w-24 font-semibold">{l}</span>
              <label>Prix <input type="number" min={0} className={input} value={c.plans[k].price} onChange={(e) => setC({ ...c, plans: { ...c.plans, [k]: { ...c.plans[k], price: Number(e.target.value) } } })} /></label>
              <label>Promo <input type="number" min={0} className={input} value={c.plans[k].promo} onChange={(e) => setC({ ...c, plans: { ...c.plans, [k]: { ...c.plans[k], promo: Number(e.target.value) } } })} /></label>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-muted">Le prix promo s’applique s’il est inférieur au prix normal (0 = pas de promo).</p>
      </section>

      <section className={card}>
        <h2 className="font-semibold text-ink">États des lieux (FCFA)</h2>
        <div className="mt-2 flex flex-wrap gap-4 text-sm">
          {[["single", "À l’unité"], ["pack2", "Pack 2 (entrée + sortie)"], ["owner", "Propriétaire"]].map(([k, l]) => (
            <label key={k}>{l} <input type="number" min={0} className={input} value={c.edl[k] ?? 0} onChange={(e) => setC({ ...c, edl: { ...c.edl, [k]: Number(e.target.value) } })} /></label>
          ))}
        </div>
      </section>

      <section className={card}>
        <h2 className="font-semibold text-ink">Limites par forfait</h2>
        <p className="text-xs text-muted">Vide = illimité.</p>
        <table className="mt-2 text-sm">
          <thead><tr className="text-left text-xs text-muted"><th className="pr-4">Forfait</th><th className="pr-4">Biens</th><th className="pr-4">Locataires</th><th>Agents</th></tr></thead>
          <tbody>
            {LIMITS.map(([k, l]) => (
              <tr key={k}>
                <td className="pr-4 font-semibold">{l}</td>
                {(["max_biens", "max_locataires", "max_agents"] as const).map((f) => (
                  <td key={f} className="py-1 pr-4"><input type="number" min={0} placeholder="illimité" className={input} value={c.limits[k][f] < 0 ? "" : c.limits[k][f]}
                    onChange={(e) => setC({ ...c, limits: { ...c.limits, [k]: { ...c.limits[k], [f]: num(e.target.value) } } })} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className={card}>
        <h2 className="font-semibold text-ink">Modules inclus</h2>
        <p className="text-xs text-muted">Forfait minimum de chaque module (un forfait supérieur inclut les inférieurs).</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {Object.entries(c.modules).map(([k, m]) => (
            <label key={k} className="flex items-center justify-between gap-2 text-sm">
              <span>{m.label}</span>
              <select className="rounded-md border border-slate-300 px-2 py-1" value={m.plan} onChange={(e) => setC({ ...c, modules: { ...c.modules, [k]: { ...m, plan: e.target.value } } })}>
                {PLANS.map(([p, l]) => <option key={p} value={p}>{l}</option>)}
              </select>
            </label>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-3">
        <button type="button" onClick={save} disabled={busy} className="rounded-full bg-brand-800 px-5 py-2 text-sm font-bold text-white hover:bg-brand-900 disabled:opacity-60">{busy ? "Enregistrement…" : "Enregistrer"}</button>
        {msg ? <p role="status" className="text-sm text-ink">{msg}</p> : null}
      </div>
    </div>
  );
}
