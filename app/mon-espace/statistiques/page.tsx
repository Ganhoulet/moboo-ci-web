import { requireSpace } from "@/lib/member-space";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { EmptyState, PageHeader, STATUS_LABEL, StatCard, ViewsChart } from "@/components/dashboard-ui";
import { getStats, type Stats } from "../actions";
import { SiteIcon } from "@/components/site-icon";

const PERIODS = [7, 30, 90];
const PIPE: [keyof NonNullable<Stats["pipeline"]>, string, string][] = [
  ["new", "Nouvelles", "bg-slate-400"], ["contacted", "Contactées", "bg-brand-500"], ["visit", "Visites", "bg-violet-500"],
  ["negotiation", "Négociation", "bg-amber-500"], ["won", "Gagnées", "bg-emerald-500"], ["lost", "Perdues", "bg-red-400"],
];

/** Évolution par rapport à la période précédente (même durée). */
function Delta({ now, before }: { now: number; before: number | undefined }) {
  if (before == null) return null;
  if (!before) return now ? <span className="text-xs font-semibold text-emerald-700">nouveau</span> : null;
  const d = Math.round(((now - before) / before) * 100);
  if (!d) return <span className="text-xs font-semibold text-muted">= stable</span>;
  return <span className={"text-xs font-semibold " + (d > 0 ? "text-emerald-700" : "text-red-600")}>{d > 0 ? "▲" : "▼"} {Math.abs(d)} %</span>;
}

function Kpi({ label, value, now, before, hint }: { label: string; value: string | number; now: number; before?: number; hint?: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 flex items-baseline gap-2"><span className="font-display text-3xl font-extrabold text-ink">{value}</span><Delta now={now} before={before} /></p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

const ago = (iso: string | null) => {
  if (!iso) return "jamais";
  const d = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return d <= 0 ? "aujourd’hui" : d === 1 ? "hier" : `il y a ${d} j`;
};

export default async function Statistiques({ searchParams }: { searchParams: { jours?: string } }) {
  const account = getSession()!;
  await requireSpace(account.accountType, "statistiques");
  const days = PERIODS.includes(Number(searchParams.jours)) ? Number(searchParams.jours) : 30;
  const stats = await getStats(days);
  const t = stats?.totals;
  const contacts = t ? t.inquiries + t.calls + t.whatsapp : 0;
  const rate = stats?.contactRate !== undefined ? stats.contactRate : t?.views ? Math.round((contacts / t.views) * 1000) / 10 : null;
  const prev = stats?.previous;
  const prevContacts = prev ? prev.inquiries + prev.calls + prev.whatsapp : undefined;
  const rows = stats?.listings ?? null;
  const pipeTotal = stats?.pipeline ? Object.values(stats.pipeline).reduce((a, b) => a + b, 0) : 0;
  const srcTotal = stats?.sources ? stats.sources.app + stats.sources.site : 0;
  const maxCommune = Math.max(1, ...(stats?.communes ?? []).map((c) => c.count));

  return (
    <div>
      <PageHeader
        title="Statistiques"
        sub="Vues, contacts, suivi de vos clients et provenance de vos visiteurs. Les mêmes chiffres que dans l’application Moboo.ci."
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
      {!stats || !t || !stats.top.length ? (
        <EmptyState title="Pas encore de statistiques" text="Publiez une annonce : chaque visite de sa page est comptée ici." />
      ) : (
        <div className="space-y-8">
          {/* 1. Évolution et taux */}
          <section>
            <h2 className="mb-3 font-display text-lg font-bold text-ink">Évolution sur {days} jours{prev ? <span className="ml-2 text-sm font-normal text-muted">comparée aux {days} jours précédents</span> : null}</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi label="Vues" value={t.views} now={t.views} before={prev?.views} hint={`${(t.views / days).toFixed(1)} par jour`} />
              <Kpi label="Contacts" value={contacts} now={contacts} before={prevContacts} hint="demandes + appels + WhatsApp" />
              <Kpi label="Demandes" value={t.inquiries} now={t.inquiries} before={prev?.inquiries} hint="formulaires de contact / visite" />
              <Kpi label="Taux de contact" value={rate != null ? `${rate.toLocaleString("fr-FR")} %` : "—"} now={rate ?? 0} hint="contacts / vues" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Clics « Appeler »" value={t.calls} tone="brand" />
              <StatCard label="Clics « WhatsApp »" value={t.whatsapp} tone="emerald" />
              {stats.impressions !== undefined ? <StatCard label="Apparitions" value={stats.impressions} hint="dans les résultats de recherche" tone="violet" /> : null}
              {stats.shares !== undefined ? <StatCard label="Partages" value={stats.shares} hint="clics sur « Partager »" tone="accent" /> : null}
            </div>
          </section>

          <ViewsChart series={stats.series} />

          {/* 3. Suivi des clients */}
          {stats.pipeline ? (
            <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-2xl bg-white p-5 shadow-card">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="font-display text-lg font-bold text-ink">Suivi des clients</h2>
                  <Link href="/mon-espace/demandes" className="text-sm font-semibold text-brand-700">Voir les demandes →</Link>
                </div>
                <p className="text-sm text-muted">{pipeTotal} demande(s) reçue(s) sur la période, par étape.</p>
                <div className="mt-4 space-y-2.5">
                  {PIPE.map(([k, label, color]) => {
                    const n = stats.pipeline![k];
                    return (
                      <div key={k} className="flex items-center gap-3 text-sm">
                        <span className="w-24 shrink-0 text-slate-600">{label}</span>
                        <span className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100"><span className={"block h-full rounded-full " + color} style={{ width: `${pipeTotal ? Math.max(n ? 4 : 0, (n / pipeTotal) * 100) : 0}%` }} /></span>
                        <b className="w-8 text-right text-ink">{n}</b>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <StatCard label="Délai de réponse" value={stats.responseHours != null ? (stats.responseHours < 24 ? `${Math.round(stats.responseHours)} h` : `${Math.round(stats.responseHours / 24)} j`) : "—"} hint="avant de traiter une demande" tone="brand" />
                <StatCard label="Avis reçus" value={stats.reviews?.count ?? 0} hint={stats.reviews?.rating != null ? `note moyenne ${stats.reviews.rating.toLocaleString("fr-FR")}/5` : "sur la période"} tone="violet" />
                <StatCard label="Biens vendus" value={stats.deals?.sold ?? 0} hint="réalisations de la période" tone="emerald" />
                <StatCard label="Biens loués" value={stats.deals?.rented ?? 0} hint="réalisations de la période" tone="accent" />
              </div>
            </section>
          ) : null}

          {/* 4. Provenance */}
          {stats.sources ? (
            <section className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-card">
                <h2 className="font-display text-lg font-bold text-ink">D’où viennent les vues</h2>
                <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-slate-100">
                  {srcTotal ? <><span className="bg-brand-600" style={{ width: `${(stats.sources.site / srcTotal) * 100}%` }} /><span className="bg-accent-500" style={{ width: `${(stats.sources.app / srcTotal) * 100}%` }} /></> : null}
                </div>
                <ul className="mt-3 space-y-1 text-sm">
                  <li className="flex justify-between"><span><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-brand-600" />Site moboo.ci</span><b>{stats.sources.site}</b></li>
                  <li className="flex justify-between"><span><span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-accent-500" />Application</span><b>{stats.sources.app}</b></li>
                </ul>
                <p className="mt-3 text-xs text-muted">Détail disponible depuis la mise en ligne de ces statistiques.</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-card">
                <h2 className="font-display text-lg font-bold text-ink">Communes des visiteurs</h2>
                {stats.communes?.length ? (
                  <ul className="mt-4 space-y-2 text-sm">
                    {stats.communes.map((c) => (
                      <li key={c.name} className="flex items-center gap-3">
                        <span className="w-28 shrink-0 truncate text-slate-700">{c.name}</span>
                        <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-violet-500" style={{ width: `${(c.count / maxCommune) * 100}%` }} /></span>
                        <b className="w-8 text-right">{c.count}</b>
                      </li>
                    ))}
                  </ul>
                ) : <p className="mt-3 text-sm text-muted">Pas encore de données : elles apparaissent quand des visiteurs cherchent une commune et voient vos annonces.</p>}
              </div>
              <StatCard label="Vues de votre page pro" value={stats.proPageViews ?? 0} hint="moboo.ci/pro et écran agent de l’application" tone="emerald" />
            </section>
          ) : null}

          {/* 2. Détail par annonce */}
          <section>
            <h2 className="mb-3 font-display text-lg font-bold text-ink">Par annonce</h2>
            {rows ? (
              <div className="space-y-3">
                {rows.map((l) => {
                  const st = STATUS_LABEL[l.status] ?? STATUS_LABEL.ACTIVE;
                  return (
                    <div key={l.id} className="rounded-2xl bg-white p-4 shadow-card">
                      <div className="flex gap-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        {l.photo ? <img src={l.photo} alt="" className="h-20 w-28 shrink-0 rounded-xl object-cover" loading="lazy" /> : <span className="grid h-20 w-28 shrink-0 place-items-center rounded-xl bg-slate-100 text-xs text-muted">Sans photo</span>}
                        <div className="min-w-0 flex-1">
                          <Link href={`/mon-espace/annonces/${l.id}`} className="block truncate font-semibold text-ink hover:text-brand-800">{l.title}</Link>
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                            <span className={`inline-flex rounded-full px-2 py-0.5 font-semibold ${st.cls}`}>{st.label}</span>
                            <span>En ligne depuis {l.daysOnline} j</span>
                            <span>· {l.photos} photo(s)</span>
                            <span>· Dernier contact : {ago(l.lastContactAt)}</span>
                            {l.priceVsArea != null ? <span className={"font-semibold " + (l.priceVsArea > 10 ? "text-red-600" : l.priceVsArea < -10 ? "text-emerald-700" : "text-slate-600")}>· Prix {l.priceVsArea > 0 ? "+" : ""}{l.priceVsArea} % vs quartier</span> : null}
                          </p>
                          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
                            {[["Vues", l.views], ["Demandes", l.inquiries], ["Appels", l.calls], ["WhatsApp", l.whatsapp], ["Favoris", l.favorites], ["Partages", l.shares]].map(([k, v]) => (
                              <span key={k as string} className="rounded-lg bg-slate-50 py-1.5"><b className="block text-base text-ink">{v}</b>{k}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {l.tips.length ? (
                        <ul className="mt-3 flex flex-wrap gap-2">
                          {l.tips.map((tip) => <li key={tip} className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900 ring-1 ring-amber-200"><SiteIcon value="💡" size={13} className="mr-1 inline-block align-[-2px]" />{tip}</li>)}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl bg-white shadow-card">
                <table className="w-full min-w-[42rem] text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-muted">
                    <tr><th className="px-4 py-3 font-semibold">Annonce</th><th className="px-4 py-3 text-right font-semibold">Vues ({days} j)</th><th className="px-4 py-3 text-right font-semibold">Demandes</th><th className="px-4 py-3 text-right font-semibold">Appeler</th><th className="px-4 py-3 text-right font-semibold">WhatsApp</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats.top.map((l) => (
                      <tr key={l.id}><td className="max-w-[18rem] truncate px-4 py-3 font-semibold">{l.title}</td><td className="px-4 py-3 text-right font-bold">{l.views}</td><td className="px-4 py-3 text-right">{l.inquiries}</td><td className="px-4 py-3 text-right">{l.calls}</td><td className="px-4 py-3 text-right">{l.whatsapp}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
