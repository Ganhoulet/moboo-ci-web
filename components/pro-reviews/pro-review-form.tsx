"use client";

import { useState, useTransition } from "react";
import { submitProReviewAction } from "@/app/pro-reviews-actions";
import { CATEGORIES, type AvisItem, type CategoryKey, type Quality } from "@/lib/pro-reviews";

function StarInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${label} : ${n} sur 5`}
          onMouseEnter={() => setHover(n)} onClick={() => onChange(n)} className="p-0.5">
          <svg width="26" height="26" viewBox="0 0 24 24" className={(hover || value) >= n ? "fill-amber-400" : "fill-slate-200"}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z" /></svg>
        </button>
      ))}
    </div>
  );
}

/** Formulaire d'avis (identique à l'application) : 4 critères, recommandation, qualités, commentaire. */
export function ProReviewForm({ refId, path, qualities, initial, certified }: { refId: string; path: string; qualities: Quality[]; initial: AvisItem | null; certified: boolean }) {
  const labelToKey = new Map(qualities.map((q) => [q.libelle, q.cle]));
  const [scores, setScores] = useState<Record<CategoryKey, number>>({
    fiabilite: initial?.categories.fiabilite ?? 0, reactivite: initial?.categories.reactivite ?? 0,
    secteur: initial?.categories.secteur ?? 0, accompagnement: initial?.categories.accompagnement ?? 0,
  });
  const [recommend, setRecommend] = useState<boolean | null>(initial?.recommande ?? null);
  const [picked, setPicked] = useState<string[]>((initial?.qualites ?? []).map((l) => labelToKey.get(l) ?? l));
  const [comment, setComment] = useState(initial?.commentaire ?? "");
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (done) return <p className="rounded-xl bg-emerald-50 p-4 text-sm font-medium text-emerald-800">{done}</p>;
  return (
    <form className="space-y-5 rounded-2xl border border-slate-200 p-4 sm:p-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (CATEGORIES.some((c) => !scores[c.key])) { setErr("Notez les 4 critères."); return; }
        if (recommend === null) { setErr("Dites-nous si vous recommandez ce professionnel."); return; }
        start(async () => {
          setErr(null);
          const r = await submitProReviewAction(refId, { ...scores, recommande: recommend ? 1 : 0, qualites: picked, commentaire: comment }, path);
          if (r.ok) setDone(r.message ?? "Merci pour votre avis !");
          else setErr(r.error ?? "Envoi impossible.");
        });
      }}>
      <div>
        <p className="font-display text-lg font-bold text-ink">{initial ? "Modifier mon avis" : "Noter ce professionnel"}</p>
        {certified ? <p className="mt-1 text-sm text-emerald-700">✓ Vous l’avez contacté via Moboo : votre avis sera marqué « certifié ».</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {CATEGORIES.map((c) => (
          <div key={c.key}>
            <p className="text-sm font-semibold text-ink">{c.label}</p>
            <p className="text-xs text-muted">{c.help}</p>
            <StarInput label={c.label} value={scores[c.key]} onChange={(n) => setScores((s) => ({ ...s, [c.key]: n }))} />
          </div>
        ))}
      </div>
      <div>
        <p className="text-sm font-semibold text-ink">Recommandez-vous ce professionnel ?</p>
        <div className="mt-2 flex gap-2">
          {[{ v: true, l: "👍 Oui" }, { v: false, l: "Non" }].map((o) => (
            <button key={String(o.v)} type="button" onClick={() => setRecommend(o.v)} aria-pressed={recommend === o.v}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${recommend === o.v ? "border-brand-800 bg-brand-800 text-white" : "border-slate-300 text-slate-700 hover:border-brand-700"}`}>{o.l}</button>
          ))}
        </div>
      </div>
      {qualities.length ? (
        <div>
          <p className="text-sm font-semibold text-ink">Ses qualités <span className="font-normal text-muted">(facultatif)</span></p>
          <div className="mt-2 flex flex-wrap gap-2">
            {qualities.map((q) => {
              const on = picked.includes(q.cle);
              return (
                <button key={q.cle} type="button" aria-pressed={on} onClick={() => setPicked((p) => (on ? p.filter((x) => x !== q.cle) : [...p, q.cle]))}
                  className={`rounded-full border px-3 py-1 text-xs font-medium ${on ? "border-amber-400 bg-amber-50 text-amber-900" : "border-slate-200 text-slate-600 hover:border-amber-300"}`}>{on ? "✓ " : ""}{q.libelle}</button>
              );
            })}
          </div>
        </div>
      ) : null}
      <label className="block">
        <span className="text-sm font-semibold text-ink">Votre expérience <span className="font-normal text-muted">(facultatif)</span></span>
        <textarea className="input mt-1" rows={4} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} placeholder="Visite, négociation, suivi du dossier…" />
      </label>
      {err ? <p className="text-sm font-medium text-red-600">{err}</p> : null}
      <button disabled={pending} className="btn-primary bg-brand-800 hover:bg-brand-900 disabled:opacity-50">{pending ? "Envoi…" : initial ? "Mettre à jour mon avis" : "Publier mon avis"}</button>
    </form>
  );
}
