"use client";

import { useState } from "react";
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

type Category = "sale" | "rent" | "short";
type ShortType = "furnished" | "event" | "coworking";

// Catégorie → { transaction, listingKind, subType, priceLabel }
function resolve(cat: Category, short: ShortType) {
  if (cat === "sale") return { transaction: "sale", listingKind: "classic", subType: "", priceLabel: "Prix de vente (FCFA)", reservable: false };
  if (cat === "rent") return { transaction: "rent", listingKind: "classic", subType: "", priceLabel: "Loyer / mois (FCFA)", reservable: false };
  // courte durée
  if (short === "furnished") return { transaction: "rent", listingKind: "furnished", subType: "Résidence meublée", priceLabel: "Prix / nuit (FCFA)", reservable: true };
  if (short === "coworking") return { transaction: "rent", listingKind: "event", subType: "Coworking", priceLabel: "Prix / jour (FCFA)", reservable: true };
  return { transaction: "rent", listingKind: "event", subType: "Espace événementiel", priceLabel: "Prix (à partir de, FCFA)", reservable: true };
}

const CATS: { key: Category; label: string; desc: string }[] = [
  { key: "sale", label: "Vendre", desc: "Mettre un bien en vente" },
  { key: "rent", label: "Location simple", desc: "Louer (longue durée)" },
  { key: "short", label: "Courte durée", desc: "Meublé, espace, coworking — réservable" },
];

const SHORTS: { key: ShortType; label: string; icon: string }[] = [
  { key: "furnished", label: "Résidence meublée", icon: "M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" },
  { key: "event", label: "Espace événementiel", icon: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" },
  { key: "coworking", label: "Coworking", icon: "M4 20V10l8-6 8 6v10M9 20v-6h6v6" },
];

export function ListingForm() {
  const [state, action] = useFormState<SubmitState, FormData>(submitListing, null);
  const [cat, setCat] = useState<Category>("rent");
  const [short, setShort] = useState<ShortType>("furnished");
  const r = resolve(cat, short);

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h2 className="mt-3 font-display text-lg font-bold text-ink">Annonce publiée</h2>
        <p className="mt-1 text-sm text-slate-600">{state.message}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {state.id ? (
            <Link href={`/annonce/${state.id}`} className="btn-primary bg-accent-600 hover:bg-accent-700">Voir mon annonce</Link>
          ) : null}
          <Link href="/annonces" className="btn-ghost">Voir le catalogue</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <input type="hidden" name="transaction" value={r.transaction} />
      <input type="hidden" name="listingKind" value={r.listingKind} />
      <input type="hidden" name="subType" value={r.subType} />

      {/* Catégorie principale */}
      <div>
        <p className="mb-2 text-sm font-semibold text-ink">Que souhaitez-vous publier ?</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {CATS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setCat(c.key)}
              className={
                "rounded-xl border p-3 text-left transition " +
                (cat === c.key ? "border-accent-500 bg-accent-50 ring-1 ring-accent-500" : "border-slate-200 hover:border-slate-300")
              }
            >
              <span className="block font-semibold text-ink">{c.label}</span>
              <span className="block text-xs text-muted">{c.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sous-catégorie courte durée */}
      {cat === "short" ? (
        <div>
          <p className="mb-2 text-sm font-semibold text-ink">Type de courte durée</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {SHORTS.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setShort(s.key)}
                className={
                  "flex items-center gap-2 rounded-xl border p-3 text-sm font-semibold transition " +
                  (short === s.key ? "border-accent-500 bg-accent-50 text-accent-800 ring-1 ring-accent-500" : "border-slate-200 text-ink hover:border-slate-300")
                }
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={s.icon} strokeLinecap="round" strokeLinejoin="round" /></svg>
                {s.label}
              </button>
            ))}
          </div>
          {r.reservable ? (
            <p className="mt-2 rounded-lg bg-accent-50 px-3 py-2 text-xs font-medium text-accent-800">
              Cette annonce sera <b>réservable en ligne</b> (calendrier + acompte), comme sur Airbnb/Booking.
            </p>
          ) : null}
        </div>
      ) : null}

      {cat !== "short" ? (
        <Field label="Type de bien">
          <select name="propertyType" className="input" defaultValue="appartement">
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      ) : (
        <input type="hidden" name="propertyType" value={short === "furnished" ? "appartement" : "autre"} />
      )}

      <Field label="Titre de l'annonce">
        <input name="title" required placeholder="Ex. Studio meublé à Cocody" className="input" />
      </Field>

      <Field label={r.priceLabel}>
        <input type="number" name="price" required min={0} placeholder="120000" className="input" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Ville"><input name="city" required placeholder="Abidjan" className="input" /></Field>
        <Field label="Commune"><input name="commune" placeholder="Cocody" className="input" /></Field>
      </div>
      <Field label="Quartier (optionnel)"><input name="quartier" placeholder="Angré" className="input" /></Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Chambres (optionnel)"><input type="number" name="bedrooms" min={0} placeholder="3" className="input" /></Field>
        <Field label="Surface m² (optionnel)"><input type="number" name="surface" min={0} placeholder="90" className="input" /></Field>
      </div>

      <Field label="Description (optionnel)">
        <textarea name="description" rows={4} placeholder="Décrivez le bien…" className="input" />
      </Field>
      <Field label="Photos — URLs, une par ligne (optionnel)">
        <textarea name="photos" rows={2} placeholder="https://…/photo1.jpg" className="input" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Votre nom"><input name="contactName" placeholder="Nom" className="input" /></Field>
        <Field label="Téléphone (contact)"><input name="contactPhone" required inputMode="tel" placeholder="07 00 00 00 00" className="input" /></Field>
      </div>

      {state && !state.ok ? <p className="text-sm font-medium text-red-600">{state.message}</p> : null}

      <SubmitButton label="Publier l'annonce" />
      <p className="text-xs text-muted">
        {r.reservable
          ? "Annonce réservable : les clients réservent en ligne, vous confirmez la disponibilité."
          : "Les acheteurs/locataires vous contactent directement. Gratuit et sans commission."}
      </p>
    </form>
  );
}
