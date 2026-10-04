import Link from "next/link";
import { BannerReview, GrantCredits } from "@/components/backoffice/ads-admin-actions";
import { getAdsAdmin } from "./actions";

export const dynamic = "force-dynamic";

const n = (v: number) => Math.round(v).toLocaleString("fr-FR");
const d = (s: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) : "—");

function Tile({ label, value, hint, tone }: { label: string; value: string; hint?: string; tone?: "warn" }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={"mt-1 font-display text-2xl font-extrabold tabular-nums " + (tone === "warn" ? "text-amber-700" : "text-ink")}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

/** Back-office → Publicité : espace annonceur façon Zillow. */
export default async function AdminAds() {
  const a = await getAdsAdmin();
  if (!a) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Publicité indisponible.</p>;
  const t = a.totals;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Publicité</h1>
          <p className="max-w-3xl text-sm text-muted">Espace annonceur en libre-service : les annonceurs rechargent des crédits Moboo puis achètent boosts par zone, vitrines, places de partenaire de zone et bannières.</p>
        </div>
        <Link href="/admin/publicite/tarifs" className="rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Tarifs et réglages</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Boosts actifs" value={n(t.activeBoosts)} />
        <Tile label="Partenaires de zone" value={n(t.activePartners)} />
        <Tile label="Vitrines" value={n(t.activeShowcases)} />
        <Tile label="Bannières à valider" value={n(t.pendingBanners)} tone={t.pendingBanners ? "warn" : undefined} />
        <Tile label="Crédits achetés" value={n(t.creditsBought)} hint="recharges payées (bonus compris)" />
        <Tile label="Crédits dépensés" value={n(t.creditsSpent)} hint="boosts, vitrines, zones, bannières" />
        <Tile label="Crédits en circulation" value={n(t.creditsOutstanding)} hint="soldes des annonceurs" />
      </div>

      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="mb-2 font-semibold text-ink">Offrir des crédits</h2>
        <GrantCredits />
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold text-ink">Bannières à valider</h2>
        {a.pending.length ? a.pending.map((c) => (
          <div key={c.id} className="flex flex-wrap items-start gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            {c.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={c.imageUrl} alt="" className="h-20 w-32 rounded-md object-cover" />
            ) : <div className="flex h-20 w-32 items-center justify-center rounded-md bg-brand-900 px-2 text-center text-xs font-bold text-white">{c.title}</div>}
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-ink">{c.title}</p>
              {c.text ? <p className="text-slate-700">{c.text}</p> : null}
              <p className="mt-1 text-xs text-muted">{c.account.name} ({c.account.phone ?? "—"}) · {c.days} j · {c.placements.map((p) => (p === "app_banner" ? "Application" : "Site")).join(" + ")} · {c.targetZones.length ? c.targetZones.join(", ") : "partout"} · {n(c.paid)} crédits{c.ctaUrl ? <> · lien : <span className="font-mono">{c.ctaUrl}</span></> : null}</p>
            </div>
            <BannerReview id={c.id} />
          </div>
        )) : <p className="rounded-lg bg-white p-4 text-sm text-muted ring-1 ring-slate-200">Aucune bannière en attente.</p>}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-ink">Boosts en cours</h2>
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            {a.boosts.length ? (
              <table className="w-full min-w-[34rem] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Annonce</th><th className="px-2 py-2">Zone</th><th className="px-2 py-2">Fin</th><th className="px-3 py-2 text-right">Vues / clics</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {a.boosts.map((b) => (
                    <tr key={b.id}><td className="px-3 py-2"><Link href={`/annonce/${b.listingId}`} className="font-medium text-brand-800 hover:underline">{b.listingTitle}</Link><p className="text-xs text-muted">{b.account.name}</p></td><td className="px-2 py-2">{b.zoneLabel}</td><td className="px-2 py-2">{d(b.endsAt)}</td><td className="px-3 py-2 text-right tabular-nums">{n(b.impressions)} / {n(b.clicks)}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="p-4 text-sm text-muted">Aucun boost en cours.</p>}
          </div>
        </section>
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-ink">Partenaires de zone</h2>
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            {a.partners.length ? (
              <table className="w-full min-w-[30rem] text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Zone</th><th className="px-2 py-2">Agent</th><th className="px-2 py-2">Fin</th><th className="px-3 py-2 text-right">Vues / contacts</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                  {a.partners.map((p) => (
                    <tr key={p.id}><td className="px-3 py-2 font-medium">{p.zoneLabel}</td><td className="px-2 py-2">{p.account.name}</td><td className="px-2 py-2">{d(p.endsAt)}</td><td className="px-3 py-2 text-right tabular-nums">{n(p.impressions)} / {n(p.clicks)}</td></tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="p-4 text-sm text-muted">Aucun partenaire de zone.</p>}
          </div>
        </section>
      </div>

      {a.campaigns.length ? (
        <section>
          <h2 className="mb-2 font-display text-lg font-bold text-ink">Bannières traitées</h2>
          <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
            <table className="w-full min-w-[34rem] text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Bannière</th><th className="px-2 py-2">État</th><th className="px-2 py-2">Fin</th><th className="px-3 py-2 text-right">Vues / clics</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {a.campaigns.map((c) => (
                  <tr key={c.id}><td className="px-3 py-2"><p className="font-medium">{c.title}</p><p className="text-xs text-muted">{c.account.name}</p></td><td className="px-2 py-2">{c.review === "approved" ? "Validée" : `Refusée${c.reviewNote ? ` : ${c.reviewNote}` : ""}`}</td><td className="px-2 py-2">{d(c.endsAt)}</td><td className="px-3 py-2 text-right tabular-nums">{n(c.views)} / {n(c.clicks)}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}
