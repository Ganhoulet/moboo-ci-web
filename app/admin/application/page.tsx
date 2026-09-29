import Link from "next/link";
import { DailyBars, ShareBars } from "@/components/app-charts";
import { getAppStats } from "./actions";

function Tile({ label, value, sub, live }: { label: string; value: string | number; sub?: string; live?: boolean }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
        {live ? <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" /> : null}{label}
      </p>
      <p className="mt-1 font-display text-2xl font-extrabold text-ink">{typeof value === "number" ? value.toLocaleString("fr-FR") : value}</p>
      {sub ? <p className="text-xs text-muted">{sub}</p> : null}
    </div>
  );
}

export const dynamic = "force-dynamic";

export default async function AppDashboard() {
  const s = await getAppStats();
  if (!s) return <p className="text-muted">Statistiques indisponibles.</p>;
  const empty = s.installs === 0;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Application mobile</h1>
          <p className="text-sm text-muted">Moboo.ci (Android et iOS) : installations, utilisateurs actifs et connectés, passerelle vers le nouveau site.</p>
        </div>
        <Link href="/admin/application/appareils?online=1" className="text-sm font-semibold text-brand-800 hover:underline">Voir qui est en ligne →</Link>
      </div>

      {empty ? (
        <div className="rounded-lg bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
          Aucune donnée pour l’instant : les chiffres arrivent dès que la version de l’application avec le suivi (branche <code>moboo-telemetrie</code> du dépôt moboo-ci) est publiée,
          ou dès que l’application est basculée sur la passerelle.
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Installations" value={s.installs} sub={`+${s.newInstalls7d} en 7 j · +${s.newInstalls30d} en 30 j`} />
        <Tile label="En ligne maintenant" value={s.onlineNow} sub="actifs ces 5 dernières minutes" live />
        <Tile label="Actifs aujourd’hui" value={s.dau} sub={`${s.loggedInToday} connectés à un compte`} />
        <Tile label="Actifs sur 30 jours" value={s.mau} sub={`${s.wau} sur 7 jours`} />
        <Tile label="Taux d’utilisateurs actifs" value={`${s.activeRate30d.toLocaleString("fr-FR")} %`} sub="actifs 30 j / installations" />
        <Tile label="Fidélité" value={`${s.stickiness.toLocaleString("fr-FR")} %`} sub="actifs du jour / actifs du mois" />
        <Tile label="Appareils connectés à un compte" value={s.loggedInDevices} sub={`${s.siteAccounts} comptes sur le site`} />
        <Tile label="Appels de la passerelle (30 j)" value={s.gatewayCalls30d} sub={`${s.gatewayErrors30d} en erreur`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold text-ink">Appareils actifs par jour</h2>
          <p className="mb-3 text-xs text-muted">30 derniers jours</p>
          <DailyBars data={s.series.map((d) => ({ day: d.day, value: d.active }))} label="Appareils actifs" unit="appareil(s) actif(s)" />
        </section>
        <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="font-semibold text-ink">Nouvelles installations par jour</h2>
          <p className="mb-3 text-xs text-muted">30 derniers jours (1er lancement)</p>
          <DailyBars data={s.series.map((d) => ({ day: d.day, value: d.installs }))} label="Nouvelles installations" unit="installation(s)" />
        </section>
        <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 font-semibold text-ink">Plateformes</h2>
          <ShareBars items={s.platforms.map((p) => ({ label: p.platform === "android" ? "Android" : p.platform === "ios" ? "iOS" : p.platform, value: p.devices }))} />
        </section>
        <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
          <h2 className="mb-3 font-semibold text-ink">Versions de l’application</h2>
          <ShareBars items={s.versions.map((v) => ({ label: v.version, value: v.devices }))} />
        </section>
      </div>
      <p className="text-xs text-muted">Téléchargements des boutiques (Google Play Console / App Store Connect) : ils ne sont pas lus ici. « Installations » compte les appareils qui ont ouvert l’application au moins une fois.</p>
    </div>
  );
}
