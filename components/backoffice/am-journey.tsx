/** Parcours de démarrage d'un hôte (calculé par l'API) : étapes franchies, étape en cours, blocage. */

export type Journey = {
  stage: string;
  label: string;
  rank: number;
  steps: { key: string; label: string; done: boolean; at: string | null }[];
  since: string;
  days: number;
  stuck: boolean;
  reason: string | null;
  action: string | null;
};

const d = (s: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "");

/** Étape en cours, en une ligne (portefeuille, listes). */
export function JourneyChip({ j }: { j?: Journey | null }) {
  if (!j) return null;
  if (j.stage === "done") return <span className="text-[11px] font-semibold text-emerald-700">✓ Démarrage terminé</span>;
  return (
    <span className={"text-[11px] font-semibold " + (j.stuck ? "text-red-700" : "text-slate-600")}>
      Étape {j.rank}/5 : {j.label}{j.stuck ? ` · bloqué ${j.days} j` : ""}
    </span>
  );
}

/** Frise des étapes (fiche du compte). */
export function JourneySteps({ j }: { j: Journey }) {
  const current = j.steps.findIndex((s) => !s.done);
  return (
    <section className={"rounded-lg bg-white p-4 ring-1 " + (j.stuck ? "ring-red-200" : "ring-slate-200")}>
      <h2 className="font-display text-lg font-bold text-ink">Parcours de démarrage</h2>
      <ol className="mt-3 grid gap-2 sm:grid-cols-6">
        {j.steps.map((s, i) => (
          <li key={s.key} className={"rounded-md p-2 text-xs ring-1 " + (s.done ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : i === current ? (j.stuck ? "bg-red-50 text-red-700 ring-red-300" : "bg-amber-50 text-amber-800 ring-amber-300") : "bg-slate-50 text-slate-500 ring-slate-200")}>
            <p className="font-bold">{s.done ? "✓" : i === current ? "→" : "○"} {s.label}</p>
            <p>{s.done ? d(s.at) : i === current ? `depuis ${j.days} j` : ""}</p>
          </li>
        ))}
      </ol>
      {j.stage !== "done" && (j.reason || j.action) ? (
        <p className="mt-3 text-sm text-ink">{j.reason ? <b>{j.reason}. </b> : null}{j.action ? <>À faire : {j.action}.</> : null}</p>
      ) : null}
    </section>
  );
}
