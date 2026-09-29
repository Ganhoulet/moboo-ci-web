"use client";

import { useState, useTransition } from "react";
import { submitReviewAction } from "@/app/reviews-actions";

export function ReviewForm({ type, id, path, intro, moderation }: { type: "listing" | "pro"; id: string; path: string; intro: string; moderation: boolean }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) return <p className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">{done}</p>;
  return (
    <form className="space-y-3 rounded-2xl border border-slate-200 p-4 sm:p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!rating) { setErr("Choisissez une note."); return; }
        start(async () => {
          setErr(null);
          const r = await submitReviewAction({ targetType: type, targetId: id, rating, title, comment, path });
          if (r.ok) setDone(r.status === "pending" || moderation ? "Merci ! Votre avis sera publié après validation." : "Merci, votre avis est publié !");
          else setErr(r.error ?? "Envoi impossible.");
        });
      }}>
      <p className="font-semibold text-ink">Donner mon avis</p>
      {intro ? <p className="text-sm text-muted">{intro}</p> : null}
      <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label="Note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} className="p-0.5">
            <svg width="28" height="28" viewBox="0 0 24 24" className={(hover || rating) >= n ? "fill-amber-400" : "fill-slate-200"}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z" /></svg>
          </button>
        ))}
      </div>
      <input className="input" placeholder="Titre (facultatif)" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} />
      <textarea className="input" rows={4} placeholder="Votre expérience (10 caractères minimum)" value={comment} onChange={(e) => setComment(e.target.value)} minLength={10} maxLength={2000} required />
      {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
      <button disabled={pending} className="btn-primary bg-brand-800 hover:bg-brand-900 disabled:opacity-50">{pending ? "Envoi…" : "Publier mon avis"}</button>
    </form>
  );
}
