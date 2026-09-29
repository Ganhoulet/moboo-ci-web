"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { requestReservationAction, type InquiryState } from "@/app/annonce/[id]/inquiry-action";
import { AvailabilityCalendar, type CalendarSelection } from "./availability-calendar";
import { formatXOF } from "@/lib/api";

function SubmitBtn({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className="btn-primary w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-50">
      {pending ? "Envoi…" : "Demander à réserver"}
    </button>
  );
}

/** Réservation pour une annonce meublée / espace événementiel (calendrier + demande). */
export function ListingReservation({
  listingId,
  mode,
  price,
  depositPercent = 30,
}: {
  listingId: string;
  mode: "furnished" | "event";
  price: number;
  depositPercent?: number;
}) {
  const [sel, setSel] = useState<CalendarSelection>({ checkIn: null, checkOut: null, nights: 0 });
  const [state, action] = useFormState<InquiryState, FormData>(requestReservationAction, null);
  const ready = !!(sel.checkIn && sel.checkOut);
  const total = mode === "furnished" && sel.nights ? price * sel.nights : 0;
  const deposit = Math.round((total * depositPercent) / 100);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-green-600 text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <p className="mt-3 font-semibold text-ink">{state.message}</p>
        {state.link ? <a href={state.link.href} className="mt-3 inline-block rounded-full bg-brand-800 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-900">{state.link.label}</a> : null}
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <input type="hidden" name="listingId" value={listingId} />
      <input type="hidden" name="checkIn" value={sel.checkIn ?? ""} />
      <input type="hidden" name="checkOut" value={sel.checkOut ?? ""} />

      <div className="mb-1 flex items-baseline gap-1">
        <span className="text-2xl font-extrabold text-ink">{formatXOF(price)}</span>
        <span className="text-sm text-muted">{mode === "furnished" ? "/ nuit" : ""}</span>
      </div>
      <span className="chip mb-3 bg-accent-50 text-accent-700">
        {mode === "furnished" ? "Résidence meublée · réservable" : "Espace événementiel · réservable"}
      </span>

      <div className="rounded-xl border border-slate-200 p-3">
        <AvailabilityCalendar occupied={[]} onChange={setSel} />
      </div>

      {mode === "furnished" && sel.nights > 0 ? (
        <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>{formatXOF(price)} × {sel.nights} nuit(s)</span>
            <span>{formatXOF(total)}</span>
          </div>
          <div className="flex justify-between font-semibold text-ink">
            <span>Acompte à payer ({depositPercent} %)</span>
            <span>{formatXOF(deposit)}</span>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        <input name="guests" type="number" min={1} placeholder={mode === "event" ? "Nombre d'invités" : "Voyageurs"} className="input" aria-label="Personnes" />
        <input name="name" required placeholder="Votre nom" className="input" />
        <input name="phone" required inputMode="tel" placeholder="Téléphone (mobile money)" className="input" />
      </div>

      {state && !state.ok ? <p className="mt-2 text-sm font-medium text-red-600">{state.message}</p> : null}

      <div className="mt-4">
        <SubmitBtn disabled={!ready} />
      </div>
      <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
        {["L'hôte confirme la disponibilité", "Paiement sécurisé de l'acompte", "Adresse exacte après acompte"].map((t) => (
          <li key={t} className="flex items-start gap-1.5">
            <svg className="mt-0.5 shrink-0 text-accent-600" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {t}
          </li>
        ))}
      </ul>
    </form>
  );
}
