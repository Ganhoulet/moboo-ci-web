"use client";

import { useFormState } from "react-dom";
import { grantAction } from "@/app/admin/immobilier/api-partenaires/actions";

/** Ouvrir l'API à une agence (téléphone ou identifiant du compte). */
export function ApiPartnerGrant() {
  const [state, action] = useFormState(grantAction, null);
  return (
    <form action={action} className="grid gap-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-[2fr_1fr_2fr_auto]">
      <input name="account" required placeholder="Téléphone du compte (07 00 00 00 01) ou identifiant" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input name="rateLimit" type="number" min={10} max={1200} defaultValue={120} title="Requêtes par minute et par clé" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <input name="note" placeholder="Note (logiciel utilisé, contact technique…)" className="rounded-md border border-slate-300 px-3 py-2 text-sm" />
      <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Ouvrir l’accès</button>
      {state ? <p className={"text-xs md:col-span-4 " + (state.ok ? "text-emerald-700" : "text-red-700")}>{state.message}</p> : null}
    </form>
  );
}
