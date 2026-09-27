"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitReservation, type ReserveState } from "@/app/reserver/actions";
import { AvailabilityCalendar, type CalendarSelection } from "./availability-calendar";
import { formatXOF, type OccupiedRange } from "@/lib/api";

export type BookableApt = { id: string; type: string; nightlyPrice: number };

function SubmitBtn({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="btn-primary w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-50"
    >
      {pending ? "Envoi…" : "Demander à réserver"}
    </button>
  );
}

export function ResidenceBooking({
  apartments,
  occupiedByApt,
  depositPercent = 30,
}: {
  apartments: BookableApt[];
  occupiedByApt: Record<string, OccupiedRange[]>;
  depositPercent?: number;
}) {
  const [aptId, setAptId] = useState(apartments[0]?.id ?? "");
  const [sel, setSel] = useState<CalendarSelection>({ checkIn: null, checkOut: null, nights: 0 });
  const [state, action] = useFormState<ReserveState, FormData>(submitReservation, null);

  const apt = apartments.find((a) => a.id === aptId);
  const total = apt && sel.nights ? apt.nightlyPrice * sel.nights : 0;
  const deposit = Math.round((total * depositPercent) / 100);
  const ready = !!(aptId && sel.checkIn && sel.checkOut);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-5 text-center">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-green-600 text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <p className="mt-3 font-semibold text-ink">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <input type="hidden" name="apartmentId" value={aptId} />
      <input type="hidden" name="checkIn" value={sel.checkIn ?? ""} />
      <input type="hidden" name="checkOut" value={sel.checkOut ?? ""} />

      {apt ? (
        <div className="mb-3 flex items-baseline gap-1">
          <span className="text-2xl font-extrabold text-ink">{formatXOF(apt.nightlyPrice)}</span>
          <span className="text-sm text-muted">/ nuit</span>
        </div>
      ) : null}

      {apartments.length > 1 ? (
        <label className="mb-3 block text-sm font-semibold text-ink">
          Logement
          <select
            className="input mt-1"
            value={aptId}
            onChange={(e) => { setAptId(e.target.value); setSel({ checkIn: null, checkOut: null, nights: 0 }); }}
          >
            {apartments.map((a) => (
              <option key={a.id} value={a.id}>{a.type} — {formatXOF(a.nightlyPrice)}/nuit</option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="rounded-xl border border-slate-200 p-3">
        <AvailabilityCalendar
          key={aptId}
          occupied={occupiedByApt[aptId] ?? []}
          onChange={setSel}
        />
      </div>

      {sel.nights > 0 && apt ? (
        <div className="mt-4 space-y-1.5 rounded-xl bg-slate-50 p-3 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>{formatXOF(apt.nightlyPrice)} × {sel.nights} nuit(s)</span>
            <span>{formatXOF(total)}</span>
          </div>
          <div className="flex justify-between font-semibold text-ink">
            <span>Acompte à payer ({depositPercent} %)</span>
            <span>{formatXOF(deposit)}</span>
          </div>
          <p className="pt-1 text-xs text-muted">
            Le solde se règle sur place. Débit uniquement après confirmation de l'hôte.
          </p>
        </div>
      ) : null}

      <div className="mt-4 grid gap-3">
        <input name="guestName" required placeholder="Votre nom" className="input" />
        <input name="guestPhone" required inputMode="tel" placeholder="Téléphone (mobile money)" className="input" />
        <input name="personsCount" type="number" min={1} defaultValue={1} placeholder="Voyageurs" className="input" aria-label="Voyageurs" />
      </div>

      {state && !state.ok ? <p className="mt-2 text-sm font-medium text-red-600">{state.message}</p> : null}

      <div className="mt-4">
        <SubmitBtn disabled={!ready} />
      </div>
      <ul className="mt-3 space-y-1.5 text-xs text-slate-600">
        {["L'hôte confirme la disponibilité", "Paiement sécurisé de l'acompte", "Code d'arrivée au check-in"].map((t) => (
          <li key={t} className="flex items-start gap-1.5">
            <svg className="mt-0.5 shrink-0 text-accent-600" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {t}
          </li>
        ))}
      </ul>
    </form>
  );
}
