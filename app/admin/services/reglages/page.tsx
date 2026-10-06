import { getServices } from "../actions";
import { ServicesSettingsEditor } from "@/components/backoffice/services-settings-editor";
import type { ServicesConfig } from "@/lib/moboo-services";

export const dynamic = "force-dynamic";

/** Services Moboo → Réglages (ex-réglages des extensions WordPress). */
export default async function ServicesSettings() {
  const cfg = await getServices<ServicesConfig>("/config");
  if (!cfg) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Réglages indisponibles.</p>;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Réglages des services</h1>
        <p className="max-w-3xl text-sm text-muted">Activation, gratuit ou payant, forfaits (payés par Money Fusion), pourcentages et textes. Les applications lisent ces réglages en direct : aucune mise à jour à publier.</p>
      </div>
      <ServicesSettingsEditor initial={cfg} />
    </div>
  );
}
