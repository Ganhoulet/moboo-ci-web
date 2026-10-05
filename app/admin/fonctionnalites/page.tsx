import { FlagCard, NewFlagForm } from "@/components/backoffice/flags-editor";
import { getFlags } from "@/lib/flags";
import { getAdminFlags } from "./actions";

export const dynamic = "force-dynamic";

/** Activation progressive : couper, tester, puis ouvrir petit à petit chaque fonctionnalité. */
export default async function FeatureFlags() {
  const [d, mine] = await Promise.all([getAdminFlags(), getFlags()]);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Interrupteurs indisponibles.</p>;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Activation progressive</h1>
        <p className="max-w-3xl text-sm text-muted">
          Chaque fonctionnalité a son interrupteur : coupez-la instantanément en cas de problème, montrez-la d’abord à vos comptes test,
          puis ouvrez-la à 5 %, 25 %, 50 %… des visiteurs avant de la donner à tous. Les changements s’appliquent sur le site en moins de 30 secondes,
          sans mise en ligne. Les applications peuvent lire les mêmes interrupteurs (<code>GET /site/flags</code>).
        </p>
      </div>
      <div className="space-y-3">
        {d.flags.map((f) => <FlagCard key={`${f.key}-${f.updatedAt}`} flag={f} audiences={d.audiences} onForMe={!!mine[f.key]} />)}
      </div>
      <section className="space-y-2">
        <h2 className="font-display text-lg font-bold text-ink">Nouvel interrupteur</h2>
        <p className="text-xs text-muted">Pour une nouvelle fonctionnalité : l’équipe technique l’associe à la clé choisie ; il est créé coupé.</p>
        <NewFlagForm />
      </section>
    </div>
  );
}
