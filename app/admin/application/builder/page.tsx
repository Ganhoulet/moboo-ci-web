import { AppBuilder } from "@/components/backoffice/app-builder/app-builder";
import { getBuilder } from "./actions";

export const dynamic = "force-dynamic";

export default async function AppBuilderPage() {
  const state = await getBuilder();
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Builder de l’application</h1>
        <p className="text-sm text-muted">
          Thème, accueil, onglets, menu, résultats, fiche et filtres de l’application Moboo.ci, avec aperçu en direct.
          Une publication est appliquée par les téléphones au prochain lancement, sans nouvelle version sur les stores.
        </p>
      </div>
      {state ? <AppBuilder initial={state} /> : <p className="text-muted">Configuration indisponible pour le moment.</p>}
    </div>
  );
}
