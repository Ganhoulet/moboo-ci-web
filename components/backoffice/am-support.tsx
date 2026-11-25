"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSupportLinkAction, supportReplyAction, supportStatusAction } from "@/app/admin/comptes/actions";

const input = "w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm";
const digits = (s?: string | null) => String(s ?? "").replace(/\D/g, "");

/** Fiche de suivi : envoyer au client un lien support (il décrit son problème et joint une capture). */
export function SupportLinkButton({ accountId }: { accountId: string }) {
  const [pending, start] = useTransition();
  const [subject, setSubject] = useState("");
  const [res, setRes] = useState<{ url: string; phone: string | null; whatsappText: string; id: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  return (
    <section className="space-y-2 rounded-lg bg-white p-4 ring-1 ring-slate-200" data-support-link>
      <h2 className="font-display text-base font-bold text-ink">💬 Lien support</h2>
      <p className="text-xs text-muted">Le client ouvre le lien sur son téléphone, décrit son problème et envoie une capture d’écran, sans se connecter. Vous répondez depuis l’onglet Support.</p>
      {!res ? (
        <>
          <input className={input} placeholder="Sujet (ex. Photos de l’annonce, Paiement…)" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Sujet" />
          <button type="button" disabled={pending} onClick={() => start(async () => {
            const r = await createSupportLinkAction(accountId, subject);
            if (r.ok && r.data) setRes(r.data); else setErr(r.error ?? "Erreur.");
          })} className="rounded-md bg-brand-800 px-3 py-1.5 text-sm font-semibold text-white">Créer le lien</button>
        </>
      ) : (
        <div className="space-y-2">
          <input readOnly className={input + " font-mono text-xs"} value={res.url} aria-label="Lien support" onFocus={(e) => e.currentTarget.select()} />
          <div className="flex flex-wrap gap-2">
            {res.phone ? <a href={`https://wa.me/${digits(res.phone)}?text=${encodeURIComponent(res.whatsappText)}`} target="_blank" rel="noreferrer" className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white">Envoyer par WhatsApp</a> : null}
            <button type="button" onClick={() => navigator.clipboard?.writeText(res.url)} className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-300">Copier le lien</button>
            <a href={`/admin/comptes/support/${res.id}`} className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-300">Ouvrir la conversation</a>
          </div>
        </div>
      )}
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
    </section>
  );
}

/** Conversation : répondre, clore ou rouvrir. */
export function SupportReply({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-2 rounded-lg bg-white p-4 ring-1 ring-slate-200">
      <textarea className={input} rows={3} placeholder="Votre réponse au client (il la reçoit par SMS avec le lien)…" value={text} onChange={(e) => setText(e.target.value)} aria-label="Réponse" />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={pending || !text.trim()} onClick={() => start(async () => {
          const r = await supportReplyAction(id, text);
          if (r.ok) { setText(""); router.refresh(); } else setErr(r.error ?? "Erreur.");
        })} className="rounded-md bg-brand-800 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">Répondre</button>
        <button type="button" disabled={pending} onClick={() => start(async () => { await supportStatusAction(id, status === "ferme" ? "ouvert" : "ferme"); router.refresh(); })} className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-300">{status === "ferme" ? "Rouvrir" : "Problème réglé : clore"}</button>
      </div>
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
    </div>
  );
}
