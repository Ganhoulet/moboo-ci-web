"use client";

import { useState, useTransition } from "react";
import { billService } from "@/app/admin/services/actions";
import { fcfa } from "@/lib/moboo-services";

export interface Bill { id: string; number: string; amount: number; status: string; label: string; paid_at: string | null; pay_url: string | null }
const TONE: Record<string, string> = { paid: "bg-emerald-100 text-emerald-900", pending: "bg-amber-100 text-amber-900", failed: "bg-red-100 text-red-800", cancelled: "bg-slate-100 text-slate-600" };
const LABEL: Record<string, string> = { paid: "Payée", pending: "En attente", failed: "Échec", cancelled: "Annulée" };
const waText = (name: string, b: { label: string; amount: number }, url: string) =>
  `Bonjour ${name}, voici votre facture Moboo « ${b.label} » : ${fcfa(b.amount)}. Payez par Wave, Orange Money, MTN ou Moov : ${url}`;

/**
 * Facturation d'une demande (mission, état des lieux) : montant → lien de paiement
 * envoyé par e-mail et SMS, et bouton WhatsApp prêt à envoyer. Statut à jour au paiement.
 */
export function ServiceBill({ target, id, name, phone, title, bills, suggested }: { target: "mission" | "edl"; id: string; name: string; phone: string; title: string; bills: Bill[]; suggested?: number }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(suggested ? String(suggested) : "");
  const [label, setLabel] = useState(title);
  const [sms, setSms] = useState(true);
  const [msg, setMsg] = useState<{ ok: boolean; text: string; wa?: string; url?: string } | null>(null);
  const [pending, start] = useTransition();
  const wa = (url: string, b: { label: string; amount: number }) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(waText(name, b, url))}`;
  return (
    <div className="mt-2 space-y-1.5 text-xs">
      {bills.map((b) => (
        <div key={b.id} className="rounded-md bg-slate-50 p-2 ring-1 ring-slate-200">
          <p><span className={"rounded-full px-2 py-0.5 font-semibold " + (TONE[b.status] ?? "")}>{LABEL[b.status] ?? b.status}</span> <b>{fcfa(b.amount)}</b> <span className="text-muted">{b.number}</span></p>
          {b.pay_url && b.status !== "paid" && b.status !== "cancelled" ? (
            <p className="mt-1 flex flex-wrap gap-2">
              <a href={wa(b.pay_url, b)} target="_blank" rel="noreferrer" className="font-semibold text-emerald-700">Relancer sur WhatsApp</a>
              <button type="button" onClick={() => navigator.clipboard?.writeText(b.pay_url!)} className="font-semibold text-brand-700">Copier le lien</button>
            </p>
          ) : null}
        </div>
      ))}
      {!open ? (
        <button type="button" onClick={() => { setOpen(true); setMsg(null); }} className="rounded-md bg-ink px-3 py-1.5 font-semibold text-white">{bills.length ? "Nouvelle facture" : "Facturer"}</button>
      ) : (
        <form className="space-y-1.5 rounded-md bg-white p-2 ring-1 ring-slate-300" onSubmit={(e) => {
          e.preventDefault();
          setMsg(null);
          start(async () => {
            const r = await billService(target, id, Number(amount.replace(/\D/g, "")), label, sms);
            if (!r.ok || !r.data) { setMsg({ ok: false, text: r.error ?? "Facture impossible." }); return; }
            setMsg({ ok: true, text: `Facture ${r.data.number} créée${r.data.emailed ? ", envoyée par e-mail" : ""}${sms ? " et par SMS (si le SMS est branché)" : ""}.`, wa: r.data.whatsappUrl, url: r.data.payUrl });
            setOpen(false);
          });
        }}>
          <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Libellé" aria-label="Libellé de la facture" className="w-full rounded border border-slate-300 px-2 py-1" />
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" required placeholder="Montant (FCFA)" aria-label="Montant en FCFA" className="w-full rounded border border-slate-300 px-2 py-1" />
          <label className="flex items-center gap-1.5"><input type="checkbox" checked={sms} onChange={(e) => setSms(e.target.checked)} />Envoyer aussi par SMS</label>
          <div className="flex gap-2">
            <button type="submit" disabled={pending} className="rounded-md bg-accent-600 px-3 py-1.5 font-semibold text-white disabled:opacity-60">{pending ? "Envoi…" : "Envoyer la facture"}</button>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md px-2 py-1.5 ring-1 ring-slate-300">Annuler</button>
          </div>
        </form>
      )}
      {msg ? (
        <div className={"rounded-md p-2 " + (msg.ok ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-700")}>
          {msg.text}
          {msg.wa ? <p className="mt-1 flex flex-wrap gap-2"><a href={msg.wa} target="_blank" rel="noreferrer" className="font-semibold text-emerald-700">Envoyer sur WhatsApp</a>{msg.url ? <button type="button" onClick={() => navigator.clipboard?.writeText(msg.url!)} className="font-semibold text-brand-700">Copier le lien</button> : null}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
