import Link from "next/link";
import { getSession } from "@/lib/session";
import { INQUIRY_STEPS, WELCOME_NEXT, isPublisher, type AccountType } from "@/lib/accounts";
import { EmptyState, HostApps, StatCard, ViewsChart, fmtXOF } from "@/components/dashboard-ui";
import { listSearches } from "@/app/compte/searches-actions";
import { getStats, listAccountFavorites, listMyInquiries, listMyListings } from "./actions";

export default async function EspaceHome({ searchParams }: { searchParams: { bienvenue?: string } }) {
  const account = getSession()!;
  const type = (account.accountType ?? "particulier") as AccountType;
  const hello = account.firstName ? `Bonjour, ${account.firstName}` : "Bonjour";

  return (
    <div className="space-y-8">
      {searchParams.bienvenue ? (
        <div className="animate-[stepIn_.35s_ease-out] rounded-3xl bg-gradient-to-br from-accent-500 to-accent-700 p-6 text-white shadow-card">
          <p className="font-display text-2xl font-extrabold">
            Bienvenue sur Moboo.ci{account.firstName ? `, ${account.firstName}` : ""} ! 🎉
          </p>
          <p className="mt-2 max-w-lg text-white/90">{WELCOME_NEXT[type].text}</p>
          {WELCOME_NEXT[type].cta ? (
            <Link href={WELCOME_NEXT[type].cta!.href === "/publier" ? "/mon-espace/annonces/nouvelle" : WELCOME_NEXT[type].cta!.href}
              className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-accent-700 transition hover:bg-accent-50">
              {WELCOME_NEXT[type].cta!.label}
            </Link>
          ) : null}
        </div>
      ) : (
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{hello} 👋</h1>
          <p className="mt-1 text-sm text-muted">Voici l'essentiel de votre activité sur Moboo.ci.</p>
        </div>
      )}

      {isPublisher(type) ? <PublisherHome /> : type === "etablissement" ? <HostHome subtype={account.accountSubtype} /> : <SeekerHome />}
    </div>
  );
}

async function PublisherHome() {
  const [mine, stats, inquiries] = await Promise.all([listMyListings(), getStats(30), listMyInquiries()]);
  const fresh = inquiries.filter((q) => q.status === "new");
  const won = inquiries.filter((q) => q.status === "won").length;
  const items = mine?.items ?? [];

  if (!items.length) {
    return (
      <EmptyState
        title="Publiez votre première annonce"
        text="En quelques minutes : photos, prix, localisation. Les intéressés vous contactent directement, sans commission."
        action={<Link href="/mon-espace/annonces/nouvelle" className="btn-primary bg-accent-600 hover:bg-accent-700">+ Publier une annonce</Link>}
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="En ligne" value={mine?.activeListings ?? 0} hint={`${mine?.totalListings ?? 0} annonce(s) au total`} href="/mon-espace/annonces" />
        <StatCard label="Vues · 30 j" value={stats?.totals.views ?? 0} hint={`${mine?.totalViews ?? 0} depuis le début`} tone="violet" href="/mon-espace/statistiques" />
        <StatCard label="Demandes · 30 j" value={stats?.totals.inquiries ?? 0} hint={`${fresh.length} nouvelle(s) à traiter`} tone="accent" href="/mon-espace/demandes" />
        <StatCard label="Conclues" value={won} hint="ventes / locations suivies" tone="emerald" href="/mon-espace/demandes" />
      </div>

      {stats ? (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Vues des 30 derniers jours</h2>
            <Link href="/mon-espace/statistiques" className="text-sm font-semibold text-brand-800 hover:underline">Détails</Link>
          </div>
          <ViewsChart series={stats.series} />
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Dernières demandes</h2>
            <Link href="/mon-espace/demandes" className="text-sm font-semibold text-brand-800 hover:underline">Tout voir</Link>
          </div>
          {inquiries.length ? (
            <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-card">
              {inquiries.slice(0, 5).map((q) => {
                const step = INQUIRY_STEPS.find((s) => s.key === q.status) ?? INQUIRY_STEPS[0];
                return (
                  <Link key={q.id} href="/mon-espace/demandes" className="flex items-center gap-3 p-3 hover:bg-slate-50">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${step.color}`} title={step.label} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-ink">{q.name}</p>
                      <p className="truncate text-xs text-muted">{q.kind === "visit" ? "Visite" : "Contact"} · {q.listingTitle}</p>
                    </div>
                    <span className="shrink-0 text-xs text-muted">{new Date(q.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <p className="rounded-2xl bg-white p-5 text-sm text-muted shadow-card">Aucune demande pour l'instant.</p>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h2 className="font-display text-lg font-bold text-ink">Annonces les plus vues</h2>
            <Link href="/mon-espace/annonces" className="text-sm font-semibold text-brand-800 hover:underline">Mes annonces</Link>
          </div>
          <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-card">
            {[...items].sort((a, b) => b.views - a.views).slice(0, 5).map((l) => (
              <Link key={l.id} href={`/mon-espace/annonces/${l.id}`} className="flex items-center gap-3 p-3 hover:bg-slate-50">
                {l.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.photo} alt="" className="h-11 w-14 shrink-0 rounded-lg object-cover" />
                ) : <span className="h-11 w-14 shrink-0 rounded-lg bg-slate-100" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{l.title}</p>
                  <p className="truncate text-xs text-muted">{fmtXOF(l.price)}{l.transaction === "rent" ? " / mois" : ""}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-slate-500">{l.views} vues</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

async function HostHome({ subtype }: { subtype?: string | null }) {
  const [favs, searches] = await Promise.all([listAccountFavorites(), listSearches()]);
  return (
    <>
      <HostApps subtype={subtype} />
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Favoris" value={favs.length} href="/mon-espace/favoris" />
        <StatCard label="Alertes" value={searches.length} tone="violet" href="/mon-espace/recherches" />
      </div>
    </>
  );
}

async function SeekerHome() {
  const [favs, searches] = await Promise.all([listAccountFavorites(), listSearches()]);
  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Favoris" value={favs.length} hint="biens enregistrés" href="/mon-espace/favoris" />
        <StatCard label="Alertes" value={searches.filter((s) => s.alertsEnabled).length} hint="recherches suivies" tone="violet" href="/mon-espace/recherches" />
        <StatCard label="Catalogue" value="→" hint="explorer les annonces" tone="accent" href="/annonces" />
      </div>
      {favs.length ? (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold text-ink">Vos derniers favoris</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {favs.slice(0, 4).map((p) => (
              <Link key={p.id} href={p.href} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-card hover:shadow-card-hover">
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="h-14 w-16 shrink-0 rounded-lg object-cover" />
                ) : <span className="h-14 w-16 shrink-0 rounded-lg bg-slate-100" />}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{p.title}</p>
                  <p className="truncate text-xs text-muted">{p.zone}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <EmptyState
          title="Trouvez le bien idéal"
          text="Touchez ♥ sur une annonce pour l'enregistrer, ou enregistrez une recherche pour être alerté des nouveautés."
          action={<Link href="/annonces" className="btn-primary bg-accent-600 hover:bg-accent-700">Explorer les annonces</Link>}
        />
      )}
    </>
  );
}
