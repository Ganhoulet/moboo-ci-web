import type { Stage } from "@/app/mon-espace/reservations/actions";

export const fcfa = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} FCFA`;
export const frDay = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

const STAGE_CLS: Record<Stage, string> = {
  requested: "bg-amber-50 text-amber-800 ring-amber-200",
  accepted: "bg-sky-50 text-sky-800 ring-sky-200",
  confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  ongoing: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  completed: "bg-slate-100 text-slate-700 ring-slate-200",
  cancelled: "bg-red-50 text-red-700 ring-red-200",
  no_show: "bg-red-50 text-red-700 ring-red-200",
};
const STAGE_ICON: Record<Stage, string> = { requested: "⏳", accepted: "💳", confirmed: "✓", ongoing: "🏠", completed: "✓", cancelled: "✕", no_show: "✕" };

export function StagePill({ stage, label }: { stage: Stage; label: string }) {
  return <span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 " + STAGE_CLS[stage]}><span aria-hidden="true">{STAGE_ICON[stage]}</span>{label}</span>;
}

export const DISPUTE_CLS: Record<string, string> = {
  open: "bg-amber-50 text-amber-800 ring-amber-200", awaiting_host: "bg-sky-50 text-sky-800 ring-sky-200",
  awaiting_guest: "bg-orange-50 text-orange-800 ring-orange-300", review: "bg-violet-50 text-violet-800 ring-violet-200",
  resolved: "bg-emerald-50 text-emerald-800 ring-emerald-200", rejected: "bg-slate-100 text-slate-700 ring-slate-200", withdrawn: "bg-slate-100 text-slate-600 ring-slate-200",
};
/** Libellés vus par l'équipe (le client lit « en attente de votre réponse »). */
export const ADMIN_DISPUTE_LABEL: Record<string, string> = {
  open: "Nouveau", awaiting_host: "En attente de l’hôte", awaiting_guest: "En attente du client", review: "En cours d’examen",
  resolved: "Résolu", rejected: "Clôturé sans suite", withdrawn: "Retiré par le client",
};
export function DisputePill({ status, label }: { status: string; label: string }) {
  return <span className={"inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 " + (DISPUTE_CLS[status] ?? DISPUTE_CLS.rejected)}>⚖ {label}</span>;
}

/** Étapes d'une réservation (séjour : demande → acceptée → acompte → séjour → terminé). */
export function StageSteps({ stage, kind }: { stage: Stage; kind: "stay" | "event" }) {
  if (stage === "cancelled" || stage === "no_show") return null;
  const steps: [Stage, string][] = kind === "stay"
    ? [["requested", "Demande envoyée"], ["accepted", "Acceptée par l’hôte"], ["confirmed", "Acompte payé"], ["ongoing", "Séjour"], ["completed", "Terminé"]]
    : [["requested", "Demande envoyée"], ["confirmed", "Confirmée"], ["completed", "Événement passé"]];
  const at = Math.max(0, steps.findIndex(([k]) => k === stage));
  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs">
      {steps.map(([k, l], i) => (
        <li key={k} className="flex items-center gap-1">
          <span className={"grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold " + (i <= at ? "bg-brand-800 text-white" : "bg-slate-200 text-slate-500")}>{i < at || stage === "completed" ? "✓" : i + 1}</span>
          <span className={i <= at ? "font-semibold text-ink" : "text-muted"}>{l}</span>
          {i < steps.length - 1 ? <span className={"mx-1 h-px w-5 " + (i < at ? "bg-brand-800" : "bg-slate-300")} aria-hidden="true" /> : null}
        </li>
      ))}
    </ol>
  );
}
