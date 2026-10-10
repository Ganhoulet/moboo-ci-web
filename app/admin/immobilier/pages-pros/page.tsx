import { getProPageSettings } from "./actions";
import { ProPageSettingsForm } from "@/components/backoffice/pro-page-settings";

export const dynamic = "force-dynamic";

/** Immobilier → Pages des pros : médias autorisés sur les pages des agents et agences. */
export default async function ProPagesAdmin() {
  const s = await getProPageSettings();
  if (!s) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Réglages indisponibles.</p>;
  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Pages des pros</h1>
        <p className="text-sm text-muted">Les agents, agences et propriétaires présentent leur activité sur leur page publique (façon Zillow) : vidéos et photos ajoutées depuis « Mon espace → Ma page pro ». Réglez ici ce qui est permis.</p>
      </div>
      <ProPageSettingsForm initial={s} />
    </div>
  );
}
