"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  grantPackageAction, invoiceStatusAction, removeReviewAction, reviewStatusAction,
} from "@/app/admin/immobilier/actions";

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => start(async () => {
    setErr(null);
    const r = await fn();
    if (r.ok) router.refresh(); else setErr(r.error ?? "Action impossible.");
  });
  return { pending, err, run };
}

/** Actions d'un avis : approuver, refuser, supprimer. */
export function ReviewActions({ id, status }: { id: string; status: string }) {
  const { pending, err, run } = useRun();
  const b = "text-xs font-semibold hover:underline disabled:opacity-40";
  return (
    <div className="flex flex-wrap justify-end gap-3">
      {status !== "approved" ? <button type="button" disabled={pending} onClick={() => run(() => reviewStatusAction(id, "approved"))} className={b + " text-emerald-700"}>Approuver</button> : null}
      {status !== "rejected" ? <button type="button" disabled={pending} onClick={() => run(() => reviewStatusAction(id, "rejected"))} className={b + " text-amber-700"}>Refuser</button> : null}
      <button type="button" disabled={pending} onClick={() => window.confirm("Supprimer cet avis ?") && run(() => removeReviewAction(id))} className={b + " text-red-600"}>Supprimer</button>
      {err ? <span className="w-full text-right text-xs text-red-600">{err}</span> : null}
    </div>
  );
}

/** Actions d'une facture en attente : marquer payée (active le forfait), annuler. */
export function InvoiceActions({ id, status }: { id: string; status: string }) {
  const { pending, err, run } = useRun();
  if (status === "paid" || status === "cancelled") return null;
  const b = "text-xs font-semibold hover:underline disabled:opacity-40";
  return (
    <div className="flex flex-wrap justify-end gap-3">
      <button type="button" disabled={pending}
        onClick={() => {
          const method = window.prompt("Paiement reçu par (Wave, Orange Money, espèces, virement…) :", "manuel");
          if (method !== null) run(() => invoiceStatusAction(id, "paid", method || "manuel"));
        }} className={b + " text-emerald-700"}>Marquer payée</button>
      <button type="button" disabled={pending} onClick={() => window.confirm("Annuler cette facture ?") && run(() => invoiceStatusAction(id, "cancelled"))} className={b + " text-red-600"}>Annuler</button>
      {err ? <span className="w-full text-right text-xs text-red-600">{err}</span> : null}
    </div>
  );
}

/** Attribuer un forfait à un compte (paiement reçu hors ligne) : crée une facture payée. */
export function GrantPackage({ packages }: { packages: { id: string; name: string; price: number }[] }) {
  const { pending, err, run } = useRun();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [packageId, setPackageId] = useState(packages[0]?.id ?? "");
  const [method, setMethod] = useState("manuel");
  if (!packages.length) return null;
  if (!open) return <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Attribuer un forfait</button>;
  return (
    <form className="flex flex-wrap items-end gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200"
      onSubmit={(e) => { e.preventDefault(); run(async () => { const r = await grantPackageAction({ phone, packageId, method }); if (r.ok) { setOpen(false); setPhone(""); } return r; }); }}>
      <label className="text-xs font-semibold">Téléphone du compte<input className="input mt-1 w-44" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07 07 00 00 00" required /></label>
      <label className="text-xs font-semibold">Forfait<select className="input mt-1" value={packageId} onChange={(e) => setPackageId(e.target.value)}>{packages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
      <label className="text-xs font-semibold">Payé par<input className="input mt-1 w-36" value={method} onChange={(e) => setMethod(e.target.value)} /></label>
      <button disabled={pending} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Valider</button>
      <button type="button" onClick={() => setOpen(false)} className="px-2 py-2 text-sm font-semibold text-slate-600">Annuler</button>
      {err ? <p className="w-full text-xs text-red-600">{err}</p> : null}
    </form>
  );
}
