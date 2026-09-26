"use client";

import { useFormState } from "react-dom";
import { submitEventReservation, type ReserveState } from "@/app/reserver/actions";
import { Field, SubmitButton, SuccessCard } from "./booking-form";

const TYPES: [string, string][] = [
  ["mariage", "Mariage"],
  ["anniversaire", "Anniversaire"],
  ["corporate", "Corporate / séminaire"],
  ["conference", "Conférence"],
  ["bapteme", "Baptême"],
  ["autre", "Autre"],
];

export function EventBookingForm({ espaceId }: { espaceId: string }) {
  const [state, action] = useFormState<ReserveState, FormData>(submitEventReservation, null);

  if (state?.ok) return <SuccessCard message={state.message} />;

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <input type="hidden" name="espaceId" value={espaceId} />

      <Field label="Type d'événement">
        <select name="typeEvenement" className="input" defaultValue="mariage">
          {TYPES.map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
      </Field>

      <Field label="Nom de l'événement (optionnel)">
        <input name="nomEvenement" placeholder="Ex. Mariage Awa & Koffi" className="input" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Début">
          <input type="date" name="dateDebut" required className="input" />
        </Field>
        <Field label="Fin">
          <input type="date" name="dateFin" required className="input" />
        </Field>
      </div>

      <Field label="Nombre d'invités">
        <input type="number" name="nbInvites" min={1} defaultValue={50} className="input" />
      </Field>

      <Field label="Votre nom">
        <input name="guestName" required placeholder="Nom complet" className="input" />
      </Field>

      <Field label="Téléphone">
        <input name="guestPhone" required inputMode="tel" placeholder="07 00 00 00 00" className="input" />
      </Field>

      {state && !state.ok ? (
        <p className="text-sm font-medium text-red-600">{state.message}</p>
      ) : null}

      <SubmitButton label="Envoyer la demande" />

      <p className="text-xs text-muted">
        Le propriétaire confirme la date et vous envoie un devis. Aucun compte requis.
      </p>
    </form>
  );
}
