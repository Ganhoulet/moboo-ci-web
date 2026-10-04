"use client";

import { useState, useTransition } from "react";
import { testPayAction } from "@/app/mon-espace/actions";

const METHODS = ["Wave", "Orange Money", "MTN MoMo", "Moov Money", "Carte bancaire"];

/** Mode test : choix du moyen de paiement (pour l'aperçu) puis résultat simulé. */
export function TestPayForm({ id, phone, failed }: { id: string; phone: string | null; failed: boolean }) {
  const [method, setMethod] = useState(METHODS[0]);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<"success" | "failed" | null>(null);
  const [, start] = useTransition();

  const run = (result: "success" | "failed") => start(async () => {
    setErr(null); setBusy(result);
    const r = await testPayAction(id, result);
    if (!r.ok) { setErr(r.error ?? "Simulation impossible."); setBusy(null); return; }
    window.location.href = r.next!;
  });

  return (
    <div className="mt-4 space-y-4">
      {failed ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">Le paiement précédent a échoué (simulation) : vous pouvez réessayer.</p> : null}
      <fieldset>
        <legend className="text-sm font-semibold text-ink">Moyen de paiement</legend>
        <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {METHODS.map((m) => (
            <label key={m} className={"cursor-pointer rounded-xl px-3 py-2 text-center text-sm font-semibold ring-1 transition " + (method === m ? "bg-brand-50 text-brand-900 ring-brand-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50")}>
              <input type="radio" name="method" value={m} checked={method === m} onChange={() => setMethod(m)} className="sr-only" />{m}
            </label>
          ))}
        </div>
      </fieldset>
      {phone ? <p className="text-sm text-muted">Numéro : <span className="font-semibold text-ink">{phone}</span> (aucune demande ne lui est envoyée)</p> : null}
      {err ? <p className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{err}</p> : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button type="button" disabled={!!busy} onClick={() => run("success")}
          className="flex-1 rounded-full bg-emerald-600 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:opacity-60">
          {busy === "success" ? "Validation…" : `Simuler un paiement réussi (${method})`}
        </button>
        <button type="button" disabled={!!busy} onClick={() => run("failed")}
          className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-red-700 ring-1 ring-red-200 transition hover:bg-red-50 disabled:opacity-60">
          {busy === "failed" ? "…" : "Simuler un échec"}
        </button>
      </div>
    </div>
  );
}
