/**
 * « Je réserve pour un proche » : la personne qui séjourne reçoit elle-même son code
 * d'arrivée, l'adresse et l'itinéraire sur son téléphone après l'acompte.
 */
export function BeneficiaryFields() {
  return (
    <details className="rounded-xl bg-slate-50 p-3 text-sm ring-1 ring-slate-200">
      <summary className="cursor-pointer font-semibold text-ink">Je réserve pour un proche</summary>
      <p className="mt-2 text-xs text-muted">Vous payez ; la personne qui séjourne reçoit son code d’arrivée, l’adresse et l’itinéraire sur son téléphone dès l’acompte payé.</p>
      <div className="mt-3 grid gap-3">
        <input name="beneficiaryName" placeholder="Nom de la personne qui séjourne" className="input" aria-label="Nom de la personne qui séjourne" maxLength={80} />
        <input name="beneficiaryPhone" inputMode="tel" placeholder="Son téléphone (07 00 00 00 00)" className="input" aria-label="Téléphone de la personne qui séjourne" />
      </div>
    </details>
  );
}
