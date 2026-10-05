"use client";

import { useState, useTransition } from "react";
import { replyReviewAction } from "@/app/pro-reviews-actions";

/** Réponse publique de l'agent à un avis (affichée sous l'avis, sur le site et dans l'application). */
export function ReviewReply({ id, initial }: { id: string; initial: string }) {
  const [saved, setSaved] = useState(initial);
  const [text, setText] = useState(initial);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!open) {
    return saved ? (
      <div className="mt-3 rounded-xl border-l-4 border-brand-700 bg-brand-50/60 px-4 py-3 text-sm">
        <p className="font-semibold text-brand-900">Votre réponse</p>
        <p className="mt-1 whitespace-pre-line text-slate-700">{saved}</p>
        <button type="button" onClick={() => setOpen(true)} className="mt-2 text-xs font-semibold text-brand-800 hover:underline">Modifier</button>
      </div>
    ) : (
      <button type="button" onClick={() => setOpen(true)} className="mt-3 rounded-full border border-brand-700 px-4 py-1.5 text-sm font-semibold text-brand-800 hover:bg-brand-50">Répondre</button>
    );
  }
  return (
    <form className="mt-3 space-y-2"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setErr(null);
          const r = await replyReviewAction(id, text);
          if (r.ok) { setSaved(text.trim()); setOpen(false); } else setErr(r.error ?? "Erreur.");
        });
      }}>
      <textarea className="input" rows={3} maxLength={1500} value={text} onChange={(e) => setText(e.target.value)} placeholder="Merci pour votre confiance…" autoFocus />
      {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
      <div className="flex gap-2">
        <button disabled={pending} className="btn-primary bg-brand-800 px-5 text-sm hover:bg-brand-900 disabled:opacity-50">{pending ? "Envoi…" : "Publier la réponse"}</button>
        <button type="button" onClick={() => { setText(saved); setOpen(false); }} className="btn-ghost text-sm">Annuler</button>
      </div>
    </form>
  );
}
