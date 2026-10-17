import { getProPlanConfig } from "../pro-actions";
import { ProPlansForm } from "./form";

export const dynamic = "force-dynamic";

export default async function ForfaitsPro() {
  const cfg = await getProPlanConfig();
  if (!cfg) return <p className="text-muted">Réglages indisponibles (droit « Application » requis).</p>;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Forfaits Moboo Pro</h1>
        <p className="max-w-3xl text-sm text-muted">
          Prix, modules inclus, limites et prix des états des lieux de l’application Moboo Pro (ex-« Moboo Paiements » de WordPress). Appliqués aussitôt
          à la page <a href="/abonnements-moboo-pro" target="_blank" className="font-semibold text-brand-800 underline">Abonnements Moboo Pro</a> et à l’application.
        </p>
      </div>
      <ProPlansForm cfg={cfg} />
    </div>
  );
}
