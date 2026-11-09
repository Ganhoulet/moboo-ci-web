import Link from "next/link";
import { EmailCorrections, JourneyPeople, JourneyResults, JourneySettings } from "@/components/backoffice/journeys-panel";
import { getCorrectionContacts, getCorrectionHistory, getJourneyDiagnostic, getJourneyOverview, getJourneyPeople, getJourneySimulation } from "./actions";

export const dynamic = "force-dynamic";

const TABS = [["apercu", "Vue d’ensemble"], ["reglages", "Réglages et textes"], ["personnes", "Suivi par personne"], ["emails", "E-mails à corriger"]] as const;
type Search = { tab?: string; journey?: string; stage?: string; status?: string; q?: string; page?: string; state?: string };

/** Centre marketing → Parcours de conversion : des inscrits de Moboo.ci vers Moboo Pro, Resi et Event. */
export default async function Parcours({ searchParams: s }: { searchParams: Search }) {
  const tab = TABS.some(([k]) => k === s.tab) ? s.tab! : "apercu";
  const [o, diag, sim, people, contacts, history] = await Promise.all([
    getJourneyOverview(),
    tab === "apercu" ? getJourneyDiagnostic() : null,
    tab === "apercu" ? getJourneySimulation() : null,
    tab === "personnes" ? getJourneyPeople({ journey: s.journey, stage: s.stage, status: s.status, search: s.q, page: s.page }) : null,
    tab === "emails" ? getCorrectionContacts({ state: s.state, search: s.q, page: s.page }) : null,
    tab === "emails" ? getCorrectionHistory() : null,
  ]);
  if (!o) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Parcours de conversion indisponible.</p>;
  const on = o.journeys.filter((j) => j.enabled).length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Parcours de conversion</h1>
        <p className="max-w-3xl text-sm text-muted">Amenez les inscrits de Moboo.ci vers l’application faite pour leur métier : les agents vers Moboo Pro, les résidences meublées vers Moboo Resi, les espaces événementiels vers Moboo Event. Maximum 3 e-mails, arrêt dès que la personne est arrivée sur l’application ou se désinscrit.</p>
      </div>
      <div className={"rounded-lg px-4 py-3 text-sm ring-1 " + (on ? "bg-emerald-50 text-emerald-900 ring-emerald-200" : "bg-slate-50 text-slate-700 ring-slate-200")}>
        {on ? <><strong>{on} parcours allumé{on > 1 ? "s" : ""}.</strong> De vrais e-mails partent chaque heure, de 8 h à 18 h, dans la limite du plafond.</> : <><strong>Tout est éteint : aucun e-mail réel ne part.</strong> Vous pouvez tout préparer et tester sans risque.</>}
        {!o.emailReady ? <span className="ml-1 font-semibold text-amber-700">L’envoi d’e-mails n’est pas configuré sur le serveur.</span> : null}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/admin/centre-marketing/parcours?tab=${k}`} className={"-mb-px border-b-2 px-3 py-2 text-sm font-semibold " + (tab === k ? "border-brand-700 text-brand-800" : "border-transparent text-slate-500 hover:text-ink")}>{l}</Link>
        ))}
      </div>
      {tab === "apercu" ? <JourneyResults overview={o} diagnostic={diag} simulation={sim} /> : null}
      {tab === "reglages" ? <JourneySettings overview={o} /> : null}
      {tab === "personnes" ? <JourneyPeople overview={o} data={people} filters={{ journey: s.journey ?? "", stage: s.stage ?? "", status: s.status ?? "", q: s.q ?? "" }} /> : null}
      {tab === "emails" ? <EmailCorrections data={contacts} history={history} filters={{ state: s.state ?? "", q: s.q ?? "" }} /> : null}
    </div>
  );
}
