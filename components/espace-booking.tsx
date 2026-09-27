"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitEventReservation, type ReserveState } from "@/app/reserver/actions";
import { AvailabilityCalendar, type CalendarSelection } from "./availability-calendar";
import { formatXOF, type OccupiedRange } from "@/lib/api";

const EVENTS = ["mariage", "anniversaire", "conférence", "séminaire", "réception", "autre"];

function SubmitBtn({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className="btn-primary w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-50">
      {pending ? "Envoi…" : "Demander à réserver"}
    </button>
  );
}

export function EspaceBooking({
  espaceId,
  occupied,
  fromPrice,
}: {
  espaceId: string;
  occupied: OccupiedRange[];
  fromPrice?: number | null;
}) {
  const [sel, setSel] = useState<CalendarSelection>({ checkIn: null, checkOut: null, nights: 0 });
  const [state, action] = useFormState<ReserveState, FormData>(submitEventReservation, null);
  const ready = !!(sel.checkIn && sel.checkOut);

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
      <input type="hidden" name="espaceId" value={espaceId} />
      <input type="hidden" name="dateDebut" value={sel.checkIn ?? ""} />
      <input type="hidden" name="dateFin" value={sel.checkOut ?? ""} />

      {fromPrice ? (
        <div className="mb-3 flex items-baseline gap-1">
          <span className="text-sm text-muted">À partir de</span>
          <span className="text-2xl font-extrabold text-ink">{formatXOF(fromPrice)}</span>
        </div>
      ) : null}

      <div className="rounded-xl border border-slate-200 p-3">
        <AvailabilityCalendar occupied={occupied} onChange={setSel} />
      </div>

      <div className="mt-4 grid gap-3">
        <label className="text-sm font-semibold text-ink">
          Type d'événement
          <select name="typeEvenement" defaultValue="mariage" className="input mt-1">
            {EVENTS.map((e) => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
          </select>
        </label>
        <input name="nomEvenement" placeholder="Nom de l'événement (optionnel)" className="input" />
        <input name="nbInvites" type="number" min={1} defaultValue={50} placeholder="Nombre d'invités" className="input" aria-label="Nombre d'invités" />
        <input name="guestName" required placeholder="Votre nom" className="input" />
        <input name="guestPhone" required inputMode="tel" placeholder="Téléphone" className="input" />
      </div>

      {state && !state.ok ? <p className="mt-2 text-sm font-medium text-red-600">{state.message}</p> : null}

      <div className="mt-4">
        <SubmitBtn disabled={!ready} />
      </div>
      <p className="mt-3 text-xs text-muted">
        Le propriétaire confirme la date et vous envoie un devis. Aucun débit avant confirmation.
      </p>
    </form>
  );
}
