"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveSpaceRulesAction } from "@/app/admin/comptes/evenements/actions";

type Plage = { debut: string; fin: string };
export interface SpaceRules {
  rules: { creneaux: Record<"matinee" | "apres_midi" | "soiree", Plage>; weekendPercent: number; saisonPercent: number; invitesInclus: number | null; prixParInviteSup: number };
  options: { id: string; nom: string; prix: number; unite: "forfait" | "par_invite" }[];
  visites: { actif: boolean; jours: number[]; debut: string; fin: string; dureeMin: number };
}
const JOURS = ["Dim.", "Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam."];
const CRENEAUX: [keyof SpaceRules["rules"]["creneaux"], string][] = [["matinee", "Matinée"], ["apres_midi", "Après-midi"], ["soiree", "Soirée"]];

function Save() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-primary bg-brand-800 hover:bg-brand-900 disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer"}</button>;
}
const Num = ({ name, label, value, unit }: { name: string; label: string; value: number | null; unit: string }) => (
  <label className="text-sm font-semibold text-ink">{label}
    <span className="mt-1 flex items-center gap-2"><input name={name} type="number" min={0} defaultValue={value ?? ""} className="input w-28" /><span className="text-xs font-normal text-muted">{unit}</span></span>
  </label>
);

/** Formulaire de l'équipe Moboo : mêmes réglages que le propriétaire dans Moboo Event. */
export function SpaceRulesForm({ id, d }: { id: string; d: SpaceRules }) {
  const [state, action] = useFormState(saveSpaceRulesAction.bind(null, id), null);
  const r = d.rules;
  return (
    <form action={action} className="space-y-5">
      <section className="grid gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:grid-cols-2">
        <Num name="weekendPercent" label="Supplément week-end" value={r.weekendPercent} unit="% (vendredi soir, samedi, dimanche)" />
        <Num name="saisonPercent" label="Majoration haute saison" value={r.saisonPercent} unit="%" />
        <Num name="invitesInclus" label="Invités compris" value={r.invitesInclus} unit="vide = pas de supplément" />
        <Num name="prixParInviteSup" label="Par invité en plus" value={r.prixParInviteSup} unit="FCFA" />
      </section>
      <section className="space-y-2 rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <h2 className="font-bold text-ink">Heures des créneaux</h2>
        {CRENEAUX.map(([k, l]) => (
          <div key={k} className="flex items-center gap-2 text-sm">
            <span className="w-24 font-semibold text-ink">{l}</span>
            <input name={`${k}.debut`} defaultValue={r.creneaux[k].debut} className="input w-24" placeholder="08:00" />
            <span>→</span>
            <input name={`${k}.fin`} defaultValue={r.creneaux[k].fin} className="input w-24" placeholder="13:00" />
          </div>
        ))}
      </section>
      <section className="space-y-2 rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <h2 className="font-bold text-ink">Options payantes</h2>
        <p className="text-xs text-muted">Une option par ligne : <code>Nom | prix | forfait</code> ou <code>Nom | prix | par invité</code>.</p>
        <textarea name="options" rows={5} className="input w-full font-mono text-sm"
          defaultValue={d.options.map((o) => `${o.nom} | ${o.prix} | ${o.unite === "par_invite" ? "par invité" : "forfait"}`).join("\n")} />
      </section>
      <section className="space-y-2 rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <h2 className="font-bold text-ink">Visites</h2>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="visites.actif" defaultChecked={d.visites.actif} /> Les clients peuvent demander une visite</label>
        <div className="flex flex-wrap gap-3 text-sm">
          {JOURS.map((j, i) => <label key={j} className="flex items-center gap-1"><input type="checkbox" name="visites.jours" value={i} defaultChecked={d.visites.jours.includes(i)} />{j}</label>)}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          De <input name="visites.debut" defaultValue={d.visites.debut} className="input w-24" /> à <input name="visites.fin" defaultValue={d.visites.fin} className="input w-24" />
          · durée <input name="visites.dureeMin" type="number" defaultValue={d.visites.dureeMin} className="input w-20" /> min
        </div>
      </section>
      <div className="flex items-center gap-3">
        <Save />
        {state?.ok ? <span className="text-sm font-semibold text-emerald-700">Enregistré.</span> : null}
        {state && !state.ok ? <span className="text-sm font-semibold text-red-600">{state.error}</span> : null}
      </div>
    </form>
  );
}
