"use client";

import { useState, useTransition } from "react";
import { reportAction } from "@/app/report-actions";

const REASONS: [string, string][] = [
  ["arnaque", "Arnaque ou demande d’argent suspecte"],
  ["faux", "Annonce fausse ou trompeuse"],
  ["indisponible", "Bien déjà loué ou vendu"],
  ["doublon", "Annonce en double"],
  ["prix", "Prix erroné"],
  ["photos", "Photos trompeuses ou inappropriées"],
  ["comportement", "Comportement inapproprié de l’annonceur"],
  ["autre", "Autre"],
];

/** « Signaler » (façon Airbnb) : motif + détails, envoyé à l'équipe de modération. */
export function ReportButton({ targetType, targetId, label, loggedIn }: { targetType: "listing" | "account"; targetId: string; label?: string; loggedIn?: boolean }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const reasons = targetType === "account" ? REASONS.filter(([k]) => ["arnaque", "faux", "comportement", "autre"].includes(k)) : REASONS.filter(([k]) => k !== "comportement");

  return (
    <>
      <button type="button" onClick={() => { setOpen(true); setDone(false); setErr(null); }}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 underline-offset-2 hover:text-red-600 hover:underline">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 21V4M4 4h12l-2 4 2 4H4" /></svg>
        {label ?? (targetType === "listing" ? "Signaler cette annonce" : "Signaler ce profil")}
      </button>
      {open ? (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Signaler" onClick={() => setOpen(false)}>
          <div className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 text-ink shadow-xl" onClick={(e) => e.stopPropagation()}>
            {done ? (
              <div className="py-4 text-center">
                <p className="text-3xl">✅</p>
                <p className="mt-2 font-display text-lg font-bold">Merci pour votre signalement</p>
                <p className="mt-1 text-sm text-muted">L’équipe Moboo va l’examiner rapidement. Vous nous aidez à garder le site sûr.</p>
                <button type="button" onClick={() => setOpen(false)} className="btn-primary mt-5 bg-brand-800 hover:bg-brand-900">Fermer</button>
              </div>
            ) : (
              <form onSubmit={(e) => {
                e.preventDefault();
                start(async () => {
                  const r = await reportAction({ targetType, targetId, reason, details, name: loggedIn ? undefined : name, contact: loggedIn ? undefined : contact });
                  if (r.ok) setDone(true); else setErr(r.error ?? "Envoi impossible.");
                });
              }}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-display text-lg font-bold">{targetType === "listing" ? "Signaler cette annonce" : "Signaler ce profil"}</p>
                  <button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="text-2xl leading-none text-slate-400 hover:text-ink">×</button>
                </div>
                <p className="mt-1 text-sm text-muted">Votre signalement reste confidentiel : l’annonceur ne saura pas qui l’a envoyé.</p>
                <fieldset className="mt-4 space-y-1.5">
                  {reasons.map(([k, l]) => (
                    <label key={k} className={"flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm " + (reason === k ? "border-brand-600 bg-brand-50" : "border-slate-200 hover:bg-slate-50")}>
                      <input type="radio" name="reason" value={k} checked={reason === k} onChange={() => setReason(k)} required /> {l}
                    </label>
                  ))}
                </fieldset>
                <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} maxLength={1000} className="input mt-3 text-sm" placeholder="Précisez si possible (ex. on m’a demandé de payer avant la visite)" />
                {!loggedIn ? (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <input value={name} onChange={(e) => setName(e.target.value)} className="input text-sm" placeholder="Votre nom (facultatif)" maxLength={80} />
                    <input value={contact} onChange={(e) => setContact(e.target.value)} className="input text-sm" placeholder="E-mail ou téléphone (facultatif)" maxLength={120} />
                  </div>
                ) : null}
                {err ? <p className="mt-2 text-sm text-red-600">{err}</p> : null}
                <button disabled={pending || !reason} className="btn-primary mt-4 w-full bg-red-600 hover:bg-red-700 disabled:opacity-60">{pending ? "Envoi…" : "Envoyer le signalement"}</button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
