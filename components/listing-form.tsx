"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { submitListing, type SubmitState } from "@/app/publier/actions";
import { Field, SubmitButton } from "./booking-form";

const TYPES: [string, string][] = [
  ["appartement", "Appartement"],
  ["maison", "Maison"],
  ["villa", "Villa"],
  ["studio", "Studio"],
  ["terrain", "Terrain"],
  ["bureau", "Bureau"],
  ["magasin", "Magasin / local"],
  ["autre", "Autre"],
];

export function ListingForm() {
  const [state, action] = useFormState<SubmitState, FormData>(submitListing, null);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
            <path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h2 className="mt-3 font-display text-lg font-bold text-ink">Annonce publiée</h2>
        <p className="mt-1 text-sm text-slate-600">{state.message}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {state.id ? (
            <Link href={`/annonce/${state.id}`} className="btn-primary bg-accent-600 hover:bg-accent-700">
              Voir mon annonce
            </Link>
          ) : null}
          <Link href="/annonces" className="btn-ghost">
            Voir le catalogue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Je propose">
          <select name="transaction" required className="input" defaultValue="rent">
            <option value="rent">Une location</option>
            <option value="sale">Une vente</option>
          </select>
        </Field>
        <Field label="Type de bien">
          <select name="propertyType" className="input" defaultValue="appartement">
            {TYPES.map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Titre de l'annonce">
        <input name="title" required placeholder="Ex. Appartement 3 pièces à Cocody" className="input" />
      </Field>

      <Field label="Prix (FCFA)">
        <input type="number" name="price" required min={0} placeholder="120000" className="input" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ville">
          <input name="city" required placeholder="Abidjan" className="input" />
        </Field>
        <Field label="Commune">
          <input name="commune" placeholder="Cocody" className="input" />
        </Field>
      </div>

      <Field label="Quartier (optionnel)">
        <input name="quartier" placeholder="Angré" className="input" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Chambres (optionnel)">
          <input type="number" name="bedrooms" min={0} placeholder="3" className="input" />
        </Field>
        <Field label="Surface m² (optionnel)">
          <input type="number" name="surface" min={0} placeholder="90" className="input" />
        </Field>
      </div>

      <Field label="Description (optionnel)">
        <textarea name="description" rows={4} placeholder="Décrivez le bien…" className="input" />
      </Field>

      <Field label="Photos — URLs, une par ligne (optionnel)">
        <textarea name="photos" rows={2} placeholder="https://…/photo1.jpg" className="input" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Votre nom">
          <input name="contactName" placeholder="Nom" className="input" />
        </Field>
        <Field label="Téléphone (contact)">
          <input name="contactPhone" required inputMode="tel" placeholder="07 00 00 00 00" className="input" />
        </Field>
      </div>

      {state && !state.ok ? (
        <p className="text-sm font-medium text-red-600">{state.message}</p>
      ) : null}

      <SubmitButton label="Publier l'annonce" />

      <p className="text-xs text-muted">
        Les acheteurs/locataires vous contactent directement. Gratuit et sans commission.
      </p>
    </form>
  );
}
