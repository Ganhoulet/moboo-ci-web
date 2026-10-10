import { getServices } from "../actions";
import { AppConfigEditor } from "@/components/backoffice/app-config-editor";

export const dynamic = "force-dynamic";

/** Services Moboo → Configuration des applications (ex-extension moboo-app-config). */
export default async function AppConfigPage() {
  const d = await getServices<any>("/app-config");
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Configuration indisponible.</p>;
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Configuration des applications</h1>
        <p className="max-w-3xl text-sm text-muted">Activez des fonctions par type de compte, ajoutez des onglets et des écrans dans l’application, réglez le lien « gérer mon compte » (paiement sur le site, connexion automatique) — <strong>sans mise à jour du store</strong>. Chaque enregistrement augmente la version : l’application recharge sa configuration.</p>
      </div>
      <AppConfigEditor initial={d} />
    </div>
  );
}
