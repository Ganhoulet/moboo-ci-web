"use client";

import { useFormState, useFormStatus } from "react-dom";
import { addReference } from "./actions";

const input = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm";

function Bouton() {
  const { pending } = useFormStatus();
  return <button disabled={pending} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer le chiffre"}</button>;
}

/** Saisie d'un chiffre publié (toujours avec sa source). */
export function ReferenceForm() {
  const [state, action] = useFormState(addReference, null);
  return (
    <form action={action} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Source *<input name="source" required placeholder="Ex. : Panorama du marché H&A Properties 2024" className={input} /></label>
        <label className="text-sm font-medium">Lien vers la source<input name="url" type="url" placeholder="https://…" className={input} /></label>
        <label className="text-sm font-medium">Date de publication<input name="publieLe" type="date" className={input} /></label>
        <label className="text-sm font-medium">Type de bien<input name="typeBien" placeholder="Ex. : Appartement 3 pièces, Villa, Tous types" className={input} /></label>
        <label className="text-sm font-medium">Commune<input name="commune" placeholder="Ex. : Cocody (vide = tout le pays)" className={input} /></label>
        <label className="text-sm font-medium">Quartier<input name="quartier" placeholder="Ex. : Riviera 3" className={input} /></label>
        <label className="text-sm font-medium">Location ou vente
          <select name="transaction" className={input}><option value="rent">Location</option><option value="sale">Vente</option></select>
        </label>
        <label className="text-sm font-medium">Le chiffre est…
          <select name="unite" className={input}><option value="mois">un loyer par mois</option><option value="prix">un prix de vente</option><option value="m2">un prix au m²</option></select>
        </label>
        <label className="text-sm font-medium">Valeur (FCFA) *<input name="valeur" required inputMode="numeric" placeholder="Ex. : 350000" className={input} /></label>
        <div className="grid grid-cols-2 gap-2">
          <label className="text-sm font-medium">Minimum<input name="valeurMin" inputMode="numeric" className={input} /></label>
          <label className="text-sm font-medium">Maximum<input name="valeurMax" inputMode="numeric" className={input} /></label>
        </div>
      </div>
      <label className="block text-sm font-medium">Note<input name="note" placeholder="Ex. : moyenne des loyers constatés, page 12" className={input} /></label>
      <div className="flex items-center gap-3">
        <Bouton />
        {state?.ok ? <span className="text-sm font-semibold text-emerald-700">Chiffre enregistré.</span> : null}
        {state?.error ? <span className="text-sm text-red-600">{state.error}</span> : null}
      </div>
    </form>
  );
}
