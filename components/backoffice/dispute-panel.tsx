"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { disputeDecisionAction, disputeMessageAction } from "@/app/admin/litiges/actions";

type To = "guest" | "host_out" | "host_in" | "internal";
const TO: [To, string, string][] = [
  ["guest", "Au client", "Visible par le client, envoyé par e-mail."],
  ["host_out", "Demander à l’hôte", "L’hôte reçoit une notification et répond depuis Moboo Resi ou Moboo Event ; le litige passe « en attente de l’hôte »."],
  ["host_in", "Réponse de l’hôte (retranscrite)", "Si l’hôte a répondu par téléphone ou WhatsApp plutôt que dans son application."],
  ["internal", "Note interne", "Jamais montrée au client ni à l’hôte."],
];

/** Fiche litige : messages (client, hôte, note interne) et décision. */
export function DisputePanel({ id, resolutions, escrowAmount, amountClaimed, hostReplyHours }: {
  id: string; resolutions: Record<string, string>; escrowAmount: number | null; amountClaimed: number | null; hostReplyHours: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [to, setTo] = useState<To>("guest");
  const [body, setBody] = useState("");
  const [askReply, setAskReply] = useState(true);
  const [visible, setVisible] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [decide, setDecide] = useState(false);
  const [resolution, setResolution] = useState("refund_partial");
  const [refund, setRefund] = useState(String(amountClaimed ?? ""));
  const [refundRef, setRefundRef] = useState("");
  const [note, setNote] = useState("");
  const [derr, setDerr] = useState<string | null>(null);
  const label = "block text-xs font-semibold text-slate-700";
  const input = "mt-1 block w-full rounded-md border-slate-300 text-sm";

  return (
    <div className="space-y-4">
      <form className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            setErr(null);
            const r = await disputeMessageAction(id, { to, body, askReply: to === "guest" ? askReply : undefined, visible: to === "host_in" ? visible : undefined });
            if (!r.ok) setErr(r.error); else { setBody(""); router.refresh(); }
          });
        }}>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Destinataire">
          {TO.map(([k, l]) => (
            <button key={k} type="button" role="radio" aria-checked={to === k} onClick={() => setTo(k)}
              className={"rounded-full px-3 py-1 text-xs font-semibold " + (to === k ? (k === "internal" ? "bg-slate-700 text-white" : "bg-brand-700 text-white") : "bg-slate-100 text-slate-700 hover:bg-slate-200")}>{l}</button>
          ))}
        </div>
        <p className="text-xs text-muted">{TO.find(([k]) => k === to)?.[2]}</p>
        <textarea className={input} rows={4} required maxLength={4000} value={body} onChange={(e) => setBody(e.target.value)}
          placeholder={to === "host_out" ? "Question à poser à l’hôte (il reçoit une notification)…" : to === "host_in" ? "Réponse de l’hôte…" : "Message…"} />
        {to === "guest" ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={askReply} onChange={(e) => setAskReply(e.target.checked)} />Attendre une réponse du client ({hostReplyHours} h)</label> : null}
        {to === "host_in" ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />Montrer cette réponse au client</label> : null}
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <button disabled={pending || !body.trim()} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">{pending ? "Envoi…" : "Envoyer"}</button>
      </form>

      {!decide ? (
        <button type="button" onClick={() => setDecide(true)} className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700">Rendre la décision…</button>
      ) : (
        <form className="space-y-3 rounded-lg bg-emerald-50/60 p-4 ring-1 ring-emerald-200"
          onSubmit={(e) => {
            e.preventDefault();
            const reject = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "reject";
            start(async () => {
              setDerr(null);
              const r = await disputeDecisionAction(id, reject
                ? { action: "reject", note }
                : { action: "resolve", resolution, refundAmount: resolution === "refund_partial" || (resolution === "refund_full" && !escrowAmount) ? Number(refund) || 0 : undefined, refundRef: refundRef || undefined, note });
              if (!r.ok) setDerr(r.error); else router.refresh();
            });
          }}>
          <p className="font-semibold text-ink">Décision</p>
          <label className={label}>Solution
            <select className={input} value={resolution} onChange={(e) => setResolution(e.target.value)}>
              {Object.entries(resolutions).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          {resolution === "refund_partial" || (resolution === "refund_full" && !escrowAmount) ? (
            <label className={label}>Montant remboursé (FCFA){escrowAmount ? ` — acompte encaissé : ${escrowAmount.toLocaleString("fr-FR")}` : ""}
              <input type="number" min={1} max={escrowAmount ?? undefined} className={input} value={refund} onChange={(e) => setRefund(e.target.value)} required />
            </label>
          ) : null}
          {resolution === "refund_full" && escrowAmount ? <p className="text-xs text-slate-700">Tout l’acompte ({escrowAmount.toLocaleString("fr-FR")} FCFA) est remboursé ; rien n’est versé à l’hôte.</p> : null}
          {resolution.startsWith("refund") ? (
            <label className={label}>Référence du remboursement (Wave, Orange Money…)
              <input className={input} value={refundRef} onChange={(e) => setRefundRef(e.target.value)} maxLength={120} placeholder="À compléter une fois le virement fait" />
            </label>
          ) : null}
          {resolution === "release_host" ? <p className="text-xs text-slate-700">Le reversement de l’acompte à l’hôte reprend normalement.</p> : null}
          <label className={label}>Explication envoyée au client et à l’hôte *
            <textarea className={input} rows={3} required minLength={5} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {derr ? <p className="text-sm text-red-600">{derr}</p> : null}
          <div className="flex flex-wrap gap-2">
            <button value="resolve" disabled={pending} className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">Clôturer : résolu</button>
            <button value="reject" disabled={pending} className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50">Clôturer sans suite</button>
            <button type="button" onClick={() => setDecide(false)} className="px-2 text-sm text-slate-500 hover:underline">Annuler</button>
          </div>
        </form>
      )}
    </div>
  );
}
