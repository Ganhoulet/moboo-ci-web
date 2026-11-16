"use client";

import { useFormState, useFormStatus } from "react-dom";
import { saveEventSettingsAction } from "@/app/admin/comptes/evenements/actions";

export interface EventSettings {
  depositPercent: number; optionHours: number; soldeDaysBefore: number; soldeNoticeDays: number;
  releaseHoursAfterEnd: number; freeCancelDays: number; halfCancelDays: number; halfCancelPercent: number;
}
export interface Saison { label: string; from: string; to: string }

const FIELDS: [keyof EventSettings, string, string][] = [
  ["depositPercent", "Acompte payé en ligne", "% du prix total"],
  ["optionHours", "Délai pour payer l’acompte", "heures (sinon la date est libérée)"],
  ["soldeDaysBefore", "Solde à payer au plus tard", "jours avant l’événement"],
  ["soldeNoticeDays", "Lien du solde envoyé", "jours avant cette échéance"],
  ["releaseHoursAfterEnd", "Part de l’hôte disponible", "heures après la fin de l’événement"],
  ["freeCancelDays", "Annulation remboursée à 100 %", "jusqu’à N jours avant"],
  ["halfCancelDays", "Annulation partiellement remboursée", "jusqu’à N jours avant"],
  ["halfCancelPercent", "Part remboursée dans ce cas", "%"],
];

function Save() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="btn-primary bg-brand-800 hover:bg-brand-900 disabled:opacity-50">{pending ? "Enregistrement…" : "Enregistrer"}</button>;
}

/** Réglages des réservations d'espaces en ligne (Moboo Event) et périodes de haute saison. */
export function EventSettingsForm({ s, saisons }: { s: EventSettings; saisons: Saison[] }) {
  const [state, action] = useFormState(saveEventSettingsAction, null);
  return (
    <form action={action} className="space-y-5">
      <section className="grid gap-3 rounded-xl bg-white p-4 ring-1 ring-slate-200 sm:grid-cols-2">
        {FIELDS.map(([k, label, unit]) => (
          <label key={k} className="text-sm font-semibold text-ink">
            {label}
            <span className="mt-1 flex items-center gap-2">
              <input name={k} type="number" min={0} defaultValue={s[k]} className="input w-28" />
              <span className="text-xs font-normal text-muted">{unit}</span>
            </span>
          </label>
        ))}
      </section>
      <section className="space-y-2 rounded-xl bg-white p-4 ring-1 ring-slate-200">
        <h2 className="font-bold text-ink">Périodes de haute saison</h2>
        <p className="text-xs text-muted">
          Une période par ligne : <code>Nom | début | fin</code>. Dates <code>MM-JJ</code> pour chaque année (ex. <code>Fêtes | 12-15 | 01-05</code>)
          ou <code>AAAA-MM-JJ</code> pour une année précise (ex. Pâques). Chaque propriétaire choisit sa majoration dans Moboo Event.
        </p>
        <textarea name="saisons" rows={5} className="input w-full font-mono text-sm" defaultValue={saisons.map((x) => `${x.label} | ${x.from} | ${x.to}`).join("\n")} />
      </section>
      <div className="flex items-center gap-3">
        <Save />
        {state?.ok ? <span className="text-sm font-semibold text-emerald-700">Enregistré.</span> : null}
        {state && !state.ok ? <span className="text-sm font-semibold text-red-600">{state.error}</span> : null}
      </div>
    </form>
  );
}
