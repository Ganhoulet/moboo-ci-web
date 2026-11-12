"use client";

import { useState } from "react";
import { API_URL } from "@/lib/api";

/** Formulaire d'avis d'un séjour vérifié : étoiles, qualités cochées, commentaire. */
export function StayReviewForm({ token, qualities, place }: { token: string; qualities: string[]; place: string }) {
  const [rating, setRating] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) return setError("Choisissez une note de 1 à 5 étoiles.");
    if (comment.trim().length < 10) return setError("Dites-en un peu plus (au moins 10 caractères).");
    setError(""); setState("sending");
    try {
      const res = await fetch(`${API_URL}/site/stays/review/${encodeURIComponent(token)}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, qualities: picked }),
      });
      if (!res.ok) throw new Error(((await res.json().catch(() => ({}))) as { message?: string }).message || "Envoi impossible pour le moment.");
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible pour le moment.");
      setState("idle");
    }
  }

  if (state === "done") {
    return <div className="rounded-2xl bg-emerald-50 p-6 text-emerald-900 ring-1 ring-emerald-200"><p className="font-semibold">Merci pour votre avis !</p><p className="mt-1 text-sm">Il apparaît sur la page de {place}, avec la mention « séjour vérifié ».</p></div>;
  }
  return (
    <form onSubmit={submit} className="space-y-6 rounded-2xl bg-white p-6 ring-1 ring-slate-200">
      <fieldset>
        <legend className="font-semibold text-ink">Votre note</legend>
        <div className="mt-2 flex gap-1" role="radiogroup" aria-label="Note de 1 à 5 étoiles">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              onClick={() => setRating(n)} className={`text-4xl leading-none ${n <= rating ? "text-amber-500" : "text-slate-300"} hover:scale-110`}>★</button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="font-semibold text-ink">Ce qui était bien <span className="font-normal text-muted">(facultatif)</span></legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {qualities.map((q) => {
            const on = picked.includes(q);
            return (
              <button key={q} type="button" aria-pressed={on} onClick={() => setPicked(on ? picked.filter((x) => x !== q) : [...picked, q])}
                className={`rounded-full px-3 py-1.5 text-sm ring-1 ${on ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-slate-300 hover:ring-ink"}`}>{q}</button>
            );
          })}
        </div>
      </fieldset>
      <label className="block">
        <span className="font-semibold text-ink">Votre avis</span>
        <textarea value={comment} onChange={(e) => { setComment(e.target.value); setError(""); }} rows={5} maxLength={1500}
          placeholder="Propreté, électricité, eau, Wi-Fi, accueil, quartier…" className="mt-2 w-full rounded-xl border border-slate-300 p-3 text-ink focus:border-ink focus:outline-none" />
      </label>
      {error ? <p className="text-sm text-red-600" role="alert">{error}</p> : null}
      <button type="submit" disabled={state === "sending"} className="btn-primary bg-ink hover:bg-black">{state === "sending" ? "Envoi…" : "Publier mon avis"}</button>
    </form>
  );
}
