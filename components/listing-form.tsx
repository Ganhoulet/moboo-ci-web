"use client";

import { useState } from "react";
import Link from "next/link";
import { useFormState } from "react-dom";
import { submitListing, type SubmitState } from "@/app/publier/actions";
import { Field, SubmitButton } from "./booking-form";
import { MOBOO_APPS } from "@/lib/accounts";

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

// Les annonces réservables se publient uniquement depuis l'appli métier
// (feuille de route §4) : Moboo.ci n'en est que la vitrine.
const APPS = MOBOO_APPS;

function AppRedirect({ short }: { short: ShortType }) {
  const app = short === "furnished" ? APPS.resi : APPS.event;
  return (
    <div className="rounded-2xl border border-accent-200 bg-accent-50 p-5">
      <p className="font-display text-lg font-bold text-ink">Publiez depuis l'application {app.name}</p>
      <p className="mt-1 text-sm text-slate-700">
        Les {app.what} sont réservables en ligne (calendrier, acompte sécurisé, code d'arrivée).
        Vous les créez et les gérez dans {app.name} : dès que vous cochez
        « Visible sur Moboo.ci », votre annonce apparaît ici automatiquement.
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-slate-700">
        {[
          "Inscription gratuite : vous ne payez que si vous louez",
          "Les demandes de Moboo.ci arrivent directement dans l'application",
          "Vos dates réservées se mettent à jour partout",
        ].map((t) => (
          <li key={t} className="flex items-start gap-2">
            <svg className="mt-0.5 shrink-0 text-accent-600" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
            {t}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <a href={app.play} target="_blank" rel="noopener noreferrer" className="btn-primary bg-accent-600 hover:bg-accent-700">
          Télécharger {app.name} (Android)
        </a>
        <a href={app.page} target="_blank" rel="noopener noreferrer" className="btn-ghost">
          iPhone, ordinateur…
        </a>
      </div>
    </div>
  );
}

export function ListingForm({ defaults }: { defaults?: { contactName?: string; contactPhone?: string } } = {}) {
  const [state, action] = useFormState<SubmitState, FormData>(submitListing, null);
  const [cat, setCat] = useState<Category>("rent");
  const [short, setShort] = useState<ShortType>("furnished");

  if (state?.ok) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-600 text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <h2 className="mt-3 font-display text-lg font-bold text-ink">{state.pending ? "Annonce envoyée" : "Annonce publiée"}</h2>
        <p className="mt-1 text-sm text-slate-600">{state.message}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          {state.id && !state.pending ? (
            <Link href={`/annonce/${state.id}`} className="btn-primary bg-accent-600 hover:bg-accent-700">Voir mon annonce</Link>
          ) : null}
          <Link href="/annonces" className="btn-ghost">Voir le catalogue</Link>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-card">
      <input type="hidden" name="transaction" value={cat === "sale" ? "sale" : "rent"} />

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

      {cat === "short" ? (
        <>
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
          </div>
          <AppRedirect short={short} />
        </>
      ) : (
        <>
          <Field label="Type de bien">
            <select name="propertyType" className="input" defaultValue="appartement">
              {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </Field>

          <Field label="Titre de l'annonce">
            <input name="title" required placeholder="Ex. Appartement 3 pièces à Cocody" className="input" />
          </Field>

          <Field label={cat === "sale" ? "Prix de vente (FCFA)" : "Loyer / mois (FCFA)"}>
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
            <Field label="Votre nom"><input name="contactName" placeholder="Nom" className="input" defaultValue={defaults?.contactName} /></Field>
            <Field label="Téléphone (contact)"><input name="contactPhone" required inputMode="tel" placeholder="07 00 00 00 00" className="input" defaultValue={defaults?.contactPhone} /></Field>
          </div>

          {state && !state.ok ? <p className="text-sm font-medium text-red-600">{state.message}</p> : null}

          <SubmitButton label="Publier l'annonce" />
          <p className="text-xs text-muted">
            Les acheteurs/locataires vous contactent directement. Gratuit et sans commission.
          </p>
        </>
      )}
    </form>
  );
}
