import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { canAccess } from "@/lib/accounts";
import { EmptyState, PageHeader, STATUS_LABEL, StatCard, ViewsChart } from "@/components/dashboard-ui";
import { getStats } from "../actions";

const PERIODS = [7, 30, 90];

export default async function Statistiques({ searchParams }: { searchParams: { jours?: string } }) {
  const account = getSession()!;
  if (!canAccess(account.accountType, "statistiques")) redirect("/mon-espace");
  const days = PERIODS.includes(Number(searchParams.jours)) ? Number(searchParams.jours) : 30;
  const stats = await getStats(days);
  const contacts = stats ? stats.totals.inquiries + stats.totals.calls + stats.totals.whatsapp : 0;
  const contactRate = stats?.totals.views ? `${((contacts / stats.totals.views) * 100).toFixed(1)} %` : "—";

  return (
    <div>
      <PageHeader
        title="Statistiques"
        sub="Vues de vos annonces, demandes reçues et clics sur « Appeler » / « WhatsApp », jour par jour."
        action={
          <div className="flex rounded-full bg-white p-1 shadow-sm">
            {PERIODS.map((p) => (
              <Link key={p} href={`/mon-espace/statistiques?jours=${p}`}
                className={"rounded-full px-3.5 py-1.5 text-sm font-semibold " + (p === days ? "bg-ink text-white" : "text-slate-600 hover:bg-slate-50")}>
                {p} j
              </Link>
            ))}
          </div>
        }
      />
      {!stats || !stats.top.length ? (
        <EmptyState title="Pas encore de statistiques" text="Publiez une annonce : chaque visite de sa page est comptée ici." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <StatCard label={`Vues · ${days} j`} value={stats.totals.views} hint={`${(stats.totals.views / days).toFixed(1)} par jour`} tone="violet" />
            <StatCard label={`Demandes · ${days} j`} value={stats.totals.inquiries} hint="formulaires de contact / visite" tone="accent" />
            <StatCard label={`Taux de contact`} value={contactRate} hint="(demandes + appels + WhatsApp) / vues" tone="emerald" />
            <StatCard label={`Clics « Appeler » · ${days} j`} value={stats.totals.calls} hint="clics sur le bouton « Appeler »" />
            <StatCard label={`Clics « WhatsApp » · ${days} j`} value={stats.totals.whatsapp} hint="clics sur le bouton « WhatsApp »" tone="emerald" />
            <StatCard label="Contacts directs" value={stats.totals.calls + stats.totals.whatsapp} hint="appels + WhatsApp" tone="brand" />
          </div>
          <ViewsChart series={stats.series} />
          <section>
            <h2 className="mb-3 font-display text-lg font-bold text-ink">Par annonce</h2>
            <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
              <table className="w-full min-w-[42rem] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Annonce</th>
                    <th className="px-4 py-3 text-right font-semibold">Vues ({days} j)</th>
                    <th className="px-4 py-3 text-right font-semibold">Demandes</th>
                    <th className="px-4 py-3 text-right font-semibold">Appeler</th>
                    <th className="px-4 py-3 text-right font-semibold">WhatsApp</th>
                    <th className="px-4 py-3 text-right font-semibold">Vues totales</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats.top.map((l) => {
                    const st = STATUS_LABEL[l.status] ?? STATUS_LABEL.ACTIVE;
                    return (
                      <tr key={l.id}>
                        <td className="max-w-[18rem] px-4 py-3">
                          <Link href={`/mon-espace/annonces/${l.id}`} className="block truncate font-semibold text-ink hover:text-brand-800">{l.title}</Link>
                          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-ink">{l.views}</td>
                        <td className="px-4 py-3 text-right">{l.inquiries}</td>
                        <td className="px-4 py-3 text-right" title={`${l.totalCalls} depuis le début`}>{l.calls}</td>
                        <td className="px-4 py-3 text-right" title={`${l.totalWhatsapp} depuis le début`}>{l.whatsapp}</td>
                        <td className="px-4 py-3 text-right text-muted">{l.totalViews}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
