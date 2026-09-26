"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitReservation, type ReserveState } from "@/app/reserver/actions";
import { formatXOF } from "@/lib/api";

type Apt = { id: string; type: string; nightlyPrice: number | string };

export function BookingForm({ apartments }: { apartments: Apt[] }) {
  const [state, action] = useFormState<ReserveState, FormData>(submitReservation, null);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
            <path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="mt-3 font-display text-lg font-bold text-ink">Demande envoyée</h2>
        <p className="mt-1 text-sm text-slate-600">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <Field label="Logement">
        <select name="apartmentId" required className="input" defaultValue="">
          <option value="" disabled>
            Choisir un logement…
          </option>
          {apartments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.type} — {formatXOF(a.nightlyPrice)} / nuit
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Arrivée">
          <input type="date" name="checkIn" required className="input" />
        </Field>
        <Field label="Départ">
          <input type="date" name="checkOut" className="input" />
        </Field>
      </div>

      <Field label="Voyageurs">
        <input type="number" name="personsCount" min={1} defaultValue={1} className="input" />
      </Field>

      <Field label="Votre nom">
        <input name="guestName" required placeholder="Nom complet" className="input" />
      </Field>

      <Field label="Téléphone (mobile money)">
        <input name="guestPhone" required inputMode="tel" placeholder="07 00 00 00 00" className="input" />
      </Field>

      {state && !state.ok ? (
        <p className="text-sm font-medium text-red-600">{state.message}</p>
      ) : null}

      <SubmitButton />

      <p className="text-xs text-muted">
        Vous n'êtes débité qu'après confirmation de l'hôte. Aucun compte requis.
      </p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary w-full bg-accent-600 hover:bg-accent-700 disabled:opacity-60"
    >
      {pending ? "Envoi…" : "Envoyer la demande"}
    </button>
  );
}
