import type { Metadata } from "next";
import Link from "next/link";
import { withSeoOverride } from "@/lib/seo";
import { getSession } from "@/lib/session";
import { fcfa } from "@/lib/community";
import { getProPlans, limitText, PRO_MODULE_LABELS, PRO_PLAN_KEYS, PRO_RANK, unitPrice } from "@/lib/pro-plans";
import { getMyProPlan } from "./actions";
import { ProPlanBuy, ProPaymentWatch } from "./buy";

const BASE_METADATA: Metadata = {
  title: "Abonnements Moboo Pro",
  description: "Forfaits de l’application Moboo Pro pour agences, agents et propriétaires, et états des lieux à l’unité. Paiement Mobile Money.",
};
export function generateMetadata() {
  return withSeoOverride("/abonnements-moboo-pro", BASE_METADATA);
}
export const dynamic = "force-dynamic";

const COLORS: Record<string, string> = { pro: "#003580", business: "#7B1FA2", enterprise: "#FF6600" };

export default async function AbonnementsMobooPro({ searchParams }: { searchParams: { paiement?: string } }) {
  const plans = await getProPlans();
  const account = getSession();
  const mine = account ? await getMyProPlan() : null;
  const paid = Number(searchParams?.paiement) || null;
  if (!plans) return <p className="container-page py-16 text-center text-muted">Les forfaits sont momentanément indisponibles.</p>;
  const free = plans.limits.starter;
  const cards = PRO_PLAN_KEYS.map((k) => ({ key: k, ...plans.plans[k], limits: plans.limits[k] }));

  return (
    <div className="bg-slate-50">
      <div className="container-page py-12">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">Abonnements Moboo Pro</h1>
          <p className="mt-3 text-muted">L’application de gestion immobilière des agences, agents et propriétaires. L’abonnement se règle ici, puis s’active aussitôt dans l’application.</p>
        </div>

        {paid && account ? <ProPaymentWatch id={paid} /> : null}

        {account && mine ? (
          <div className="mx-auto mt-6 max-w-2xl rounded-2xl bg-white p-5 text-sm shadow-card ring-1 ring-slate-200">
            {mine.linked ? (
              <p>
                <strong className="text-ink">{mine.name}</strong> — forfait <strong>{mine.active ? plans.plans[mine.plan as "pro"]?.label ?? mine.plan : "Gratuit"}</strong>
                {mine.active && mine.expires_at ? <> jusqu’au {new Date(mine.expires_at).toLocaleDateString("fr-FR")}</> : null}
                {" · "}{mine.edl_credits ?? 0} crédit(s) d’état des lieux
                {mine.shared ? <span className="block text-xs text-muted">Abonnement partagé avec {mine.shared}.</span> : null}
              </p>
            ) : (
              <p className="text-amber-800">Ce compte n’est relié à aucun compte Moboo Pro. Connectez-vous avec le numéro ou l’e-mail utilisé dans l’application.</p>
            )}
          </div>
        ) : null}

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200">
            <h2 className="text-sm font-bold uppercase tracking-wide text-emerald-700">Gratuit</h2>
            <p className="mt-2 font-display text-3xl font-black text-ink">0 FCFA</p>
            <ul className="mt-4 flex flex-wrap gap-1.5 text-xs">
              <li className="rounded-lg bg-slate-100 px-2 py-1"><b>{limitText(free.max_biens)}</b> biens</li>
              <li className="rounded-lg bg-slate-100 px-2 py-1"><b>{limitText(free.max_locataires)}</b> locataires</li>
              <li className="rounded-lg bg-slate-100 px-2 py-1"><b>{limitText(free.max_agents)}</b> agent</li>
            </ul>
            <ul className="mt-4 flex-1 space-y-1.5 text-sm text-slate-700"><li>✓ Baux & loyers (basique)</li><li>✓ Notes & QR codes</li><li>✓ Relances limitées</li></ul>
          </div>
          {cards.map((p) => {
            const included = Object.entries(plans.modules).filter(([, plan]) => PRO_RANK[plan] <= PRO_RANK[p.key]).map(([k]) => PRO_MODULE_LABELS[k] ?? k);
            const unit = unitPrice(p);
            return (
              <div key={p.key} className={"flex flex-col rounded-2xl bg-white p-6 shadow-card " + (p.key === "pro" ? "ring-2 ring-brand-800" : "ring-1 ring-slate-200")}>
                <h2 className="text-sm font-bold uppercase tracking-wide" style={{ color: COLORS[p.key] }}>{p.label}</h2>
                <p className="mt-2 font-display text-3xl font-black text-ink">{fcfa(unit)}<span className="text-sm font-semibold text-muted"> /mois</span></p>
                {unit < p.price ? <p className="text-xs text-muted">puis {fcfa(p.price)} /mois</p> : <p className="text-xs">&nbsp;</p>}
                <ul className="mt-4 flex flex-wrap gap-1.5 text-xs">
                  <li className="rounded-lg bg-slate-100 px-2 py-1"><b>{limitText(p.limits.max_biens)}</b> biens</li>
                  <li className="rounded-lg bg-slate-100 px-2 py-1"><b>{limitText(p.limits.max_locataires)}</b> locataires</li>
                  <li className="rounded-lg bg-slate-100 px-2 py-1"><b>{limitText(p.limits.max_agents)}</b> agent{p.limits.max_agents === 1 ? "" : "s"}</li>
                </ul>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm text-slate-700">{included.map((m) => <li key={m}>✓ {m}</li>)}</ul>
                {account ? <ProPlanBuy kind={p.key} unit={unit} color={COLORS[p.key]} label={`Choisir ${p.label}`} disabled={mine?.linked === false} withMonths />
                  : <Link href="/compte?next=/abonnements-moboo-pro" className="mt-6 rounded-full bg-brand-800 py-2.5 text-center text-sm font-bold text-white hover:bg-brand-900">Se connecter pour choisir</Link>}
              </div>
            );
          })}
        </div>

        <section className="mt-10 rounded-2xl bg-white p-6 shadow-card ring-1 ring-slate-200">
          <h2 className="font-display text-xl font-extrabold text-ink">Locataire ou propriétaire ?</h2>
          <p className="text-sm text-muted">Compte gratuit : vous ne payez que vos états des lieux.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-ink">1 état des lieux</p>
              <p className="font-display text-2xl font-black text-purple-800">{fcfa(plans.edl.single)}</p>
              {account ? <ProPlanBuy kind="edl" unit={plans.edl.single} color="#7B1FA2" label="Acheter 1 crédit" disabled={mine?.linked === false} withQuantity /> : null}
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="font-semibold text-ink">Pack 2 (entrée + sortie)</p>
              <p className="font-display text-2xl font-black text-purple-800">{fcfa(plans.edl.pack2)}</p>
              {account ? <ProPlanBuy kind="edl_pack2" unit={plans.edl.pack2} color="#7B1FA2" label="Acheter le pack" disabled={mine?.linked === false} withQuantity /> : null}
            </div>
          </div>
          {!account ? <p className="mt-4 text-sm"><Link href="/compte?next=/abonnements-moboo-pro" className="font-semibold text-brand-800 underline">Connectez-vous</Link> pour acheter.</p> : null}
        </section>
        <p className="mt-6 text-center text-xs text-muted">Paiement sécurisé Mobile Money (Wave, Orange Money, MTN MoMo, Moov Money) via Money Fusion. L’abonnement s’ajoute à la durée restante.</p>
      </div>
    </div>
  );
}
