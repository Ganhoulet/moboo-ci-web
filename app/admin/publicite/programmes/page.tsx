import { getProgramsAdmin } from "./actions";
import { ProgramsAdmin } from "@/components/backoffice/programs-admin";

export const dynamic = "force-dynamic";

/** Programmes neufs des promoteurs : fiches, mise en avant payée, contacts reçus. */
export default async function ProgramsAdminPage() {
  const d = await getProgramsAdmin();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Programmes neufs</h1>
        <p className="max-w-3xl text-sm text-muted">Pages des promoteurs (<b>/programmes-neufs</b>) : lots, prix, plan de paiement, avancement, statut foncier. « Mis en avant » : affiché en haut des recherches de sa commune jusqu’à la date de fin payée. Cochez « Documents vérifiés » seulement après contrôle de l’ACD / titre foncier.</p>
      </div>
      {d ? <ProgramsAdmin data={d} /> : <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Indisponible.</p>}
    </div>
  );
}
