import Link from "next/link";
import { getServices } from "./actions";
import { CreditsTool } from "@/components/backoffice/services-admin-widgets";
import { fcfa } from "@/lib/moboo-services";

export const dynamic = "force-dynamic";

function Stat({ label, value, href, hint }: { label: string; value: React.ReactNode; href?: string; hint?: string }) {
  const body = (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 transition hover:ring-brand-300">
      <p className="text-xs font-semibold uppercase text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold text-ink">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** Back-office → Services Moboo : alertes, état des lieux, support, estimations, cartes pro. */
export default async function ServicesOverview() {
  const d = await getServices<any>("/overview");
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Services indisponibles (permission « Services Moboo » requise).</p>;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Services Moboo</h1>
        <p className="max-w-3xl text-sm text-muted">
          Les fonctions maison des applications Moboo.ci et Moboo Pro, reprises des extensions WordPress : <strong>alertes</strong> (demandes de bien envoyées aux agents de la zone), <strong>état des lieux</strong> (avec séquestre), <strong>support</strong>, <strong>estimations foncière et de loyer</strong>, <strong>carte professionnelle</strong>. Les applications utilisent les mêmes écrans qu’avant ; tout se règle ici.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Alertes" value={d.alertes.total} hint={`${d.alertes.last30} sur 30 jours`} href="/admin/services/alertes" />
        <Stat label="États des lieux" value={d.edl.total} hint={`${d.edl.completed} réalisés · commissions ${fcfa(d.edl.commissions)}`} href="/admin/services/etats-des-lieux" />
        <Stat label="Tickets ouverts" value={d.support.open} hint={`${d.support.unread} à lire · ${d.support.total} au total`} href="/admin/services/support" />
        <Stat label="Estimations foncières" value={d.estimation.estimations} hint={`${d.estimation.pdfs} rapports PDF · ${d.estimation.reports} rapports loyer`} href="/admin/services/estimations" />
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Séquestres gelés" value={fcfa(d.edl.held)} hint="État des lieux en cours" />
        <Stat label="Wallets des agents" value={fcfa(d.edl.wallets)} hint="Solde total disponible" />
        <Stat label="Grilles de prix" value={`${d.estimation.grids.dgi + d.estimation.grids.marche} zones`} hint={`DGI ${d.estimation.grids.dgi} · marché ${d.estimation.grids.marche} · loyers ${d.estimation.grids.loyer}`} href="/admin/services/estimations" />
      </div>
      <CreditsTool />
      <p className="text-xs text-muted">Reprise des données WordPress : extension « Moboo Migration » 1.4 → bouton « Envoyer les services Moboo » (réglages, crédits, alertes, demandes, tickets, estimations, grilles, cartes).</p>
    </div>
  );
}
