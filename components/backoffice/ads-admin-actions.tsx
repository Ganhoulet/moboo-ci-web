"use client";

import { useState, useTransition } from "react";
import { grantCreditsAction, reviewBannerAction } from "@/app/admin/publicite/actions";

/** Valider / refuser une bannière d'annonceur (refus : crédits rendus). */
export function BannerReview({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const act = (approve: boolean) => {
    const note = approve ? undefined : window.prompt("Motif du refus (visible par l’annonceur) :", "Visuel non conforme") ?? undefined;
    if (!approve && note === undefined) return;
    start(async () => { const r = await reviewBannerAction(id, approve, note); setErr(r.ok ? null : r.error ?? "Erreur"); });
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} onClick={() => act(true)} className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50">Valider</button>
      <button type="button" disabled={pending} onClick={() => act(false)} className="rounded-md bg-white px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50">Refuser</button>
      {err ? <span className="text-xs text-red-700">{err}</span> : null}
    </div>
  );
}

/** Geste commercial : offrir (ou retirer, montant négatif) des crédits à un compte. */
export function GrantCredits() {
  const [pending, start] = useTransition();
  const [f, setF] = useState({ phone: "", amount: "10000", note: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  return (
    <form className="flex flex-wrap items-end gap-2" onSubmit={(e) => {
      e.preventDefault();
      start(async () => { const r = await grantCreditsAction(f.phone, Number(f.amount), f.note); setMsg(r.ok ? { ok: true, text: r.message! } : { ok: false, text: r.error ?? "Erreur" }); });
    }}>
      <label className="text-xs font-semibold">Numéro du compte<input className="input mt-1 w-40 py-1.5 text-sm" required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="07 00 00 00 01" /></label>
      <label className="text-xs font-semibold">Crédits<input className="input mt-1 w-28 py-1.5 text-sm" type="number" required value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></label>
      <label className="text-xs font-semibold">Motif<input className="input mt-1 w-56 py-1.5 text-sm" value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Offre de lancement" /></label>
      <button disabled={pending} className="rounded-md bg-brand-700 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">Offrir</button>
      {msg ? <span className={"text-sm " + (msg.ok ? "text-emerald-700" : "text-red-700")}>{msg.text}</span> : null}
    </form>
  );
}
