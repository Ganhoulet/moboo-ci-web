"use client";

import { useEffect, useState, useTransition } from "react";
import { proPaymentStatusAction, proPlanCheckoutAction } from "./actions";

const fcfa = (n: number) => `${n.toLocaleString("fr-FR")} FCFA`;

/** Bouton d'achat (forfait : durée au choix ; états des lieux : quantité). */
export function ProPlanBuy({ kind, unit, color, label, disabled, withMonths, withQuantity }: {
  kind: string; unit: number; color: string; label: string; disabled?: boolean; withMonths?: boolean; withQuantity?: boolean;
}) {
  const [months, setMonths] = useState(1);
  const [qty, setQty] = useState(1);
  const [err, setErr] = useState<string | null>(null);
  const [busy, start] = useTransition();
  const n = withMonths ? months : withQuantity ? qty : 1;
  const buy = () => start(async () => {
    setErr(null);
    const r = await proPlanCheckoutAction({ kind, ...(withMonths ? { months } : {}), ...(withQuantity ? { quantity: qty } : {}) });
    if (!r.ok || !r.url) { setErr(r.error ?? "Paiement impossible."); return; }
    window.location.href = r.url;
  });
  return (
    <div className="mt-5 space-y-2">
      {withMonths ? (
        <label className="block text-xs text-muted">Durée
          <select value={months} onChange={(e) => setMonths(Number(e.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-ink">
            {[1, 3, 6, 12].map((m) => <option key={m} value={m}>{m} mois — {fcfa(unit * m)}</option>)}
          </select>
        </label>
      ) : null}
      {withQuantity ? (
        <label className="block text-xs text-muted">Quantité
          <input type="number" min={1} max={20} value={qty} onChange={(e) => setQty(Math.min(20, Math.max(1, Number(e.target.value) || 1)))} className="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-ink" />
        </label>
      ) : null}
      <button type="button" data-action="pro-plan.checkout" disabled={busy || disabled} onClick={buy} style={{ background: color }}
        className="w-full rounded-full py-2.5 text-sm font-bold text-white transition hover:opacity-90 disabled:opacity-50">
        {busy ? "Redirection vers le paiement…" : `${label} — ${fcfa(unit * n)}`}
      </button>
      {err ? <p className="text-xs font-medium text-red-700">{err}</p> : null}
    </div>
  );
}

/** Retour du paiement : suit la confirmation (MoneyFusion peut prendre quelques secondes). */
export function ProPaymentWatch({ id }: { id: number }) {
  const [statut, setStatut] = useState("en_attente");
  useEffect(() => {
    let n = 0, stop = false;
    const tick = async () => {
      const r = await proPaymentStatusAction(id);
      if (stop) return;
      const s = r?.statut ?? "inconnu";
      setStatut(s);
      if (s === "en_attente" && ++n < 20) setTimeout(tick, 4000);
      else if (s === "paye") setTimeout(() => window.location.replace("/abonnements-moboo-pro"), 2500);
    };
    void tick();
    return () => { stop = true; };
  }, [id]);
  const tone = statut === "paye" ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : statut === "en_attente" ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-red-50 text-red-800 ring-red-200";
  const text = statut === "paye" ? "Paiement confirmé : votre abonnement est actif dans l’application Moboo Pro."
    : statut === "en_attente" ? "Paiement en cours de confirmation…"
    : "Le paiement n’a pas abouti. Vous pouvez réessayer.";
  return <p role="status" className={"mx-auto mt-6 max-w-2xl rounded-xl p-3 text-center text-sm font-semibold ring-1 " + tone}>{text}</p>;
}
