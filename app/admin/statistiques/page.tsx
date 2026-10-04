import Link from "next/link";
import { getOverview } from "./actions";
import { KpiTile, RangeTabs, SeriesCard, fcfa } from "@/components/backoffice/stats-ui";
import { ShareBars } from "@/components/app-charts";
import { TYPE_LABEL } from "@/components/backoffice/ui";

const KIND: Record<string, string> = { contact: "Demandes de contact", visit: "Demandes de visite", reservation: "Demandes de réservation" };
const INVOICE: Record<string, string> = { package: "Forfaits", listing: "Publications payantes", featured: "Mises en vedette" };
const num = (n: number) => n.toLocaleString("fr-FR");

/** Back-office → Statistiques : indicateurs clés (façon tableau de bord Zillow / Airbnb). */
export default async function StatsPage({ searchParams }: { searchParams: { range?: string } }) {
  const range = ["7", "30", "90", "365"].includes(searchParams.range ?? "") ? searchParams.range! : "30";
  const d = await getOverview(range);
  const sum = (k: keyof NonNullable<typeof d>["series"]) => d ? d.series[k].reduce((s, p) => s + p.value, 0) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Statistiques</h1>
          <p className="text-sm text-muted">Activité du site et de l’application, comparée à la période précédente de même durée.</p>
        </div>
        <RangeTabs base="/admin/statistiques" range={range} />
      </div>

      {!d ? <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Impossible de charger les statistiques.</p> : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiTile label="Contacts reçus" value={num(d.kpis.contacts.value)} change={d.kpis.contacts.change}
              hint={`${num(d.kpis.contacts.calls)} appels · ${num(d.kpis.contacts.whatsapp)} WhatsApp · ${num(d.kpis.contacts.forms)} formulaires`} />
            <KpiTile label="Vues des annonces" value={num(d.kpis.views.value)} change={d.kpis.views.change} hint={`taux de contact ${d.kpis.conversion.value.toLocaleString("fr-FR")} %`} />
            <KpiTile label="Chiffre d’affaires" value={fcfa(d.kpis.revenue.value)} change={d.kpis.revenue.change} hint={`${d.kpis.revenue.invoices} facture(s) · ${d.kpis.revenue.subscriptions} forfait(s) actif(s)`} href="/admin/immobilier/factures" />
            <KpiTile label="Nouveaux comptes" value={num(d.kpis.accounts.value)} change={d.kpis.accounts.change} href="/admin/utilisateurs" />
            <KpiTile label="Nouvelles annonces" value={num(d.kpis.listings.value)} change={d.kpis.listings.change} hint={`${num(d.kpis.listings.active)} en ligne · ${d.kpis.listings.pending} à valider`} href="/admin/immobilier" />
            <KpiTile label="Recherches" value={num(d.kpis.searches.value)} change={d.kpis.searches.change} hint={`${d.kpis.searches.zeroRate.toLocaleString("fr-FR")} % sans résultat`} href={`/admin/statistiques/recherches?range=${range}`} />
            <KpiTile label="Appareils actifs (application)" value={num(d.kpis.app.value)} change={d.kpis.app.change} href="/admin/application" />
            <KpiTile label="Professionnels" value="Classement" hint="vues, contacts, conversion" href={`/admin/statistiques/professionnels?range=${range}`} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SeriesCard title="Contacts reçus" data={d.series.contacts} unit="contact(s)" total={num(sum("contacts"))} />
            <SeriesCard title="Vues des annonces" data={d.series.views} unit="vue(s)" total={num(sum("views"))} />
            <SeriesCard title="Chiffre d’affaires" data={d.series.revenue} unit="FCFA" total={fcfa(sum("revenue"))} />
            <SeriesCard title="Recherches" data={d.series.searches} unit="recherche(s)" total={num(sum("searches"))} />
            <SeriesCard title="Nouveaux comptes" data={d.series.accounts} unit="compte(s)" total={num(sum("accounts"))} />
            <SeriesCard title="Nouvelles annonces" data={d.series.listings} unit="annonce(s)" total={num(sum("listings"))} />
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
              <h2 className="border-b border-slate-100 px-4 py-3 font-semibold text-ink">Annonces les plus contactées</h2>
              {d.topListings.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[34rem] text-sm">
                    <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
                      <tr><th className="px-4 py-2">Annonce</th><th className="px-2 py-2 text-right">Vues</th><th className="px-2 py-2 text-right">Appels</th><th className="px-2 py-2 text-right">WhatsApp</th><th className="px-4 py-2 text-right">Formulaires</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {d.topListings.map((l) => (
                        <tr key={l.id}>
                          <td className="px-4 py-2"><Link href={`/admin/immobilier/${l.id}`} className="font-medium text-ink hover:underline">{l.title}</Link><span className="block text-xs text-muted">{l.place}</span></td>
                          <td className="px-2 py-2 text-right tabular-nums">{num(l.views)}</td>
                          <td className="px-2 py-2 text-right tabular-nums">{num(l.calls)}</td>
                          <td className="px-2 py-2 text-right tabular-nums">{num(l.whatsapp)}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{num(l.forms)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : <p className="p-4 text-sm text-muted">Pas encore d’activité sur la période.</p>}
            </section>
            <div className="space-y-4">
              <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-3 font-semibold text-ink">Communes les plus vues</h2>
                <ShareBars items={d.topPlaces.map((p) => ({ label: `${p.place} · ${num(p.contacts)} contact(s)`, value: p.views }))} />
              </section>
              <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <h2 className="mb-3 font-semibold text-ink">Demandes reçues par type</h2>
                <ShareBars items={d.breakdown.inquiryKinds.map((k) => ({ label: KIND[k.key] ?? k.key, value: k.value }))} />
              </section>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-3 font-semibold text-ink">Nouveaux comptes par type</h2>
              <ShareBars items={d.breakdown.accountTypes.map((a) => ({ label: TYPE_LABEL[a.key] ?? a.key, value: a.value }))} />
            </section>
            <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <h2 className="mb-3 font-semibold text-ink">Chiffre d’affaires par source</h2>
              {d.breakdown.revenueKinds.length ? (
                <ul className="space-y-2 text-sm">
                  {d.breakdown.revenueKinds.map((r) => (
                    <li key={r.key} className="flex justify-between gap-2"><span>{INVOICE[r.key] ?? r.key} <span className="text-muted">({r.count})</span></span><span className="font-semibold tabular-nums">{fcfa(r.value)}</span></li>
                  ))}
                </ul>
              ) : <p className="text-sm text-muted">Aucun paiement sur la période.</p>}
            </section>
          </div>
        </>
      )}
    </div>
  );
}
