import type { Metadata } from "next";
import Link from "next/link";
import { getSession, displayName, initials } from "@/lib/session";
import { LoginFlow } from "@/components/login-flow";
import { logoutAction } from "./actions";
import { listSearches, deleteSearchAction, toggleAlertAction } from "./searches-actions";
import { searchToHref } from "@/lib/searches";
import { accountLabel, isPublisher, MOBOO_APPS, WELCOME_NEXT, type AccountType } from "@/lib/accounts";
import { listMyListings, listMyInquiries, setListingStatusAction } from "./listings-actions";

export const metadata: Metadata = {
  title: "Mon compte",
  description: "Connectez-vous à Moboo.ci pour retrouver vos favoris, réservations et alertes.",
};

export const dynamic = "force-dynamic";

export default async function ComptePage({ searchParams }: { searchParams: { bienvenue?: string } }) {
  const account = getSession();

  if (!account) {
    return (
      <div className="container-page py-10">
        <div className="mx-auto max-w-md">
          <span className="chip bg-brand-50 text-brand-800">Connexion sans mot de passe</span>
          <h1 className="mt-3 font-display text-2xl font-extrabold text-ink sm:text-3xl">
            Se connecter
          </h1>
          <p className="mt-2 text-muted">
            Un numéro de téléphone suffit. Retrouvez vos favoris, vos annonces, vos réservations
            et recevez des alertes sur les nouveaux biens.
          </p>
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-card">
            <LoginFlow />
          </div>
          <div className="mt-5 rounded-2xl border border-accent-200 bg-accent-50 p-5 text-center">
            <p className="font-semibold text-ink">Pas encore de compte ?</p>
            <p className="mt-1 text-sm text-slate-600">
              Particulier, propriétaire, agent, agence, promoteur ou hôte : inscription en 1 minute.
            </p>
            <Link href="/inscription" className="btn-primary mt-3 bg-accent-600 hover:bg-accent-700">
              Créer mon compte
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const type = account.onboarded ? (account.accountType as AccountType) : null;
  const publisher = isPublisher(type);

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-3xl">
        {/* En-tête du profil */}
        <div className="flex items-start gap-4">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-brand-800 text-xl font-extrabold text-white">
            {initials(account)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold leading-tight text-ink">
              {account.companyName && (type === "entreprise" || type === "agent") ? account.companyName : displayName(account)}
            </h1>
            <p className="mt-0.5 truncate text-sm text-muted">
              {[account.username ? `@${account.username}` : null, account.phone].filter(Boolean).join(" · ")}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {type ? (
                <span className="inline-flex rounded-full bg-accent-50 px-2.5 py-1 text-xs font-semibold text-accent-700">
                  {accountLabel(account)}
                </span>
              ) : null}
              <Link href="/inscription?profil=modifier" className="text-xs font-semibold text-brand-800 hover:underline">
                Modifier mon profil
              </Link>
            </div>
          </div>
        </div>

        {type && searchParams.bienvenue ? (
          <div className="mt-6 animate-[stepIn_.35s_ease-out] overflow-hidden rounded-3xl bg-gradient-to-br from-accent-500 to-accent-700 p-6 text-white shadow-card">
            <p className="font-display text-2xl font-extrabold">
              Bienvenue sur Moboo.ci{account.firstName ? `, ${account.firstName}` : ""} ! 🎉
            </p>
            <p className="mt-2 max-w-lg text-white/90">{WELCOME_NEXT[type].text}</p>
            {WELCOME_NEXT[type].cta ? (
              <Link href={WELCOME_NEXT[type].cta!.href} className="mt-4 inline-flex rounded-full bg-white px-5 py-2.5 text-sm font-bold text-accent-700 transition hover:bg-accent-50">
                {WELCOME_NEXT[type].cta!.label}
              </Link>
            ) : null}
          </div>
        ) : null}

        {!type ? (
          <Link href="/inscription" className="mt-6 flex items-center gap-4 rounded-2xl border-2 border-dashed border-accent-300 bg-accent-50 p-5 transition hover:border-accent-500">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent-600 text-white">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M12 5v14M5 12h14" strokeLinecap="round" /></svg>
            </span>
            <span>
              <span className="block font-display font-bold text-ink">Complétez votre profil</span>
              <span className="block text-sm text-slate-600">
                Particulier, propriétaire, agent, entreprise ou hôte ? Votre espace s'adapte en 1 minute.
              </span>
            </span>
          </Link>
        ) : null}

        {publisher ? <PublisherSpace type={type!} /> : null}
        {type === "etablissement" ? <HostSpace subtype={account.accountSubtype} /> : null}

        <SavedSearches />

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {linksFor(type).map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-card transition hover:shadow-card-hover"
            >
              <span>
                <span className="block font-semibold text-ink">{l.label}</span>
                <span className="block text-sm text-muted">{l.desc}</span>
              </span>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
          ))}
        </div>

        <form action={logoutAction} className="mt-8">
          <button type="submit" className="btn-ghost w-full">
            Se déconnecter
          </button>
        </form>
      </div>
    </div>
  );
}

/** Raccourcis selon le profil. */
function linksFor(type: AccountType | null) {
  const favoris = { href: "/favoris", label: "Mes favoris", desc: "Les biens que vous avez enregistrés" };
  const sejour = { href: "/annonces?transaction=furnished", label: "Réserver un séjour", desc: "Résidences meublées & espaces" };
  const chercher = { href: "/annonces", label: "Rechercher un bien", desc: "À louer, à vendre, meublés, espaces" };
  if (type === "etablissement") return [chercher, favoris];
  if (isPublisher(type)) return [chercher, favoris];
  return [chercher, favoris, sejour];
}

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " FCFA";
const STATUS: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "En ligne", cls: "bg-emerald-50 text-emerald-700" },
  SOLD: { label: "Vendu", cls: "bg-slate-100 text-slate-600" },
  RENTED: { label: "Loué", cls: "bg-slate-100 text-slate-600" },
  DISABLED: { label: "Masquée", cls: "bg-amber-50 text-amber-700" },
};

/** Propriétaire / agent / entreprise : annonces, statistiques, demandes reçues. */
async function PublisherSpace({ type }: { type: AccountType }) {
  const [mine, inquiries] = await Promise.all([listMyListings(), listMyInquiries()]);
  const items = mine?.items ?? [];
  const title = type === "entreprise" ? "Espace entreprise" : type === "agent" ? "Espace agent" : "Mes biens";

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-extrabold text-ink">{title}</h2>
          <p className="text-sm text-muted">Vos annonces à louer / à vendre — contact direct, sans commission.</p>
        </div>
        <Link href="/publier" className="btn-primary bg-accent-600 hover:bg-accent-700">+ Publier une annonce</Link>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { v: mine?.totalListings ?? 0, l: "Annonces" },
          { v: mine?.totalViews ?? 0, l: "Vues" },
          { v: mine?.totalInquiries ?? 0, l: "Demandes" },
        ].map((k) => (
          <div key={k.l} className="rounded-2xl bg-white p-4 text-center shadow-card">
            <p className="font-display text-2xl font-extrabold text-ink">{k.v}</p>
            <p className="text-xs text-muted">{k.l}</p>
          </div>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="mt-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 text-center">
          <p className="font-semibold text-ink">Aucune annonce pour l'instant</p>
          <p className="mt-1 text-sm text-muted">Publiez votre premier bien : il apparaît aussitôt dans le catalogue.</p>
        </div>
      ) : (
        <div className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-card">
          {items.map((l) => {
            const st = STATUS[l.status] ?? STATUS.ACTIVE;
            const closed = l.transaction === "sale" ? "SOLD" : "RENTED";
            return (
              <div key={l.id} className="flex items-center gap-3 p-3">
                {l.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={l.photo} alt="" className="h-14 w-16 shrink-0 rounded-lg object-cover" />
                ) : (
                  <span className="h-14 w-16 shrink-0 rounded-lg bg-slate-100" />
                )}
                <div className="min-w-0 flex-1">
                  <Link href={`/annonce/${l.id}`} className="block truncate font-semibold text-ink hover:text-brand-800">{l.title}</Link>
                  <p className="truncate text-xs text-muted">
                    {fmt(l.price)}{l.transaction === "rent" ? " / mois" : ""} · {[l.commune, l.city].filter(Boolean).join(", ")} · {l.views} vues · {l.inquiries} demande(s)
                  </p>
                  <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${st.cls}`}>{st.label}</span>
                </div>
                <form action={setListingStatusAction.bind(null, l.id, l.status === "ACTIVE" ? closed : "ACTIVE")}>
                  <button type="submit" className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-brand-800 hover:bg-brand-50">
                    {l.status === "ACTIVE" ? (l.transaction === "sale" ? "Marquer vendu" : "Marquer loué") : "Remettre en ligne"}
                  </button>
                </form>
              </div>
            );
          })}
        </div>
      )}

      {inquiries.length > 0 ? (
        <div className="mt-6">
          <h3 className="font-display text-lg font-bold text-ink">Demandes reçues</h3>
          <div className="mt-3 grid gap-3">
            {inquiries.slice(0, 20).map((q) => {
              const digits = q.phone.replace(/[^0-9]/g, "");
              return (
                <div key={q.id} className="rounded-2xl bg-white p-4 shadow-card">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold text-ink">{q.name}</p>
                    <span className="text-xs text-muted">{new Date(q.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                  </div>
                  <p className="text-xs text-muted">
                    {q.kind === "visit" ? `Demande de visite${q.preferredDate ? ` · ${q.preferredDate}` : ""}` : "Demande de contact"} · {q.listingTitle}
                  </p>
                  {q.message ? <p className="mt-2 text-sm text-slate-600">{q.message}</p> : null}
                  <div className="mt-3 flex gap-2">
                    <a href={`tel:${q.phone}`} className="btn-ghost px-3 py-1.5 text-xs">Appeler</a>
                    <a href={`https://wa.me/${digits.startsWith("225") ? digits : "225" + digits}`} target="_blank" rel="noopener noreferrer"
                      className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white">WhatsApp</a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {type !== "proprietaire" ? (
        <p className="mt-5 text-sm text-muted">
          Vous aviez un compte agent sur l'ancien moboo.ci ?{" "}
          <Link href="/agent/login" className="font-semibold text-brand-800 hover:underline">Retrouvez vos annonces importées</Link>
        </p>
      ) : null}
    </section>
  );
}

/** Hôtes (résidences meublées / espaces) : publication et réservations via les applis. */
function HostSpace({ subtype }: { subtype?: string | null }) {
  const apps = subtype === "residences" ? [MOBOO_APPS.resi] : subtype === "espaces" ? [MOBOO_APPS.event] : [MOBOO_APPS.resi, MOBOO_APPS.event];
  return (
    <section className="mt-8">
      <h2 className="font-display text-xl font-extrabold text-ink">Espace hôte</h2>
      <p className="text-sm text-muted">
        Vos logements et espaces se publient et se gèrent dans nos applis gratuites. Dès que vous
        activez « Visible sur Moboo.ci », ils apparaissent ici et les voyageurs réservent en ligne.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {apps.map((a) => (
          <div key={a.name} className="rounded-2xl bg-white p-5 shadow-card">
            <p className="font-display text-lg font-bold text-ink">{a.name}</p>
            <p className="mt-1 text-sm text-muted">Pour vos {a.what}.</p>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-600">
              {["Réservations Moboo.ci reçues et confirmées gratuitement", "Calendrier et dates bloquées synchronisés", "Acompte sécurisé et code d'arrivée"].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <svg className="mt-0.5 shrink-0 text-accent-600" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {t}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <a href={a.play} target="_blank" rel="noopener noreferrer" className="btn-primary bg-accent-600 px-4 hover:bg-accent-700">Android</a>
              <a href={a.page} target="_blank" rel="noopener noreferrer" className="btn-ghost px-4">iPhone, ordinateur…</a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

async function SavedSearches() {
  const searches = await listSearches();
  if (searches.length === 0) return null;

  return (
    <section className="mt-8">
      <h2 className="font-display text-lg font-bold text-ink">Mes recherches</h2>
      <p className="text-sm text-muted">
        Recevez une alerte dès qu’un bien correspond.
      </p>
      <div className="mt-3 grid gap-3">
        {searches.map((s) => (
          <div key={s.id} className="rounded-2xl bg-white p-4 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <Link href={searchToHref(s.params)} className="min-w-0">
                <span className="block truncate font-semibold text-ink hover:text-brand-800">
                  {s.label}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {s.alertsEnabled ? "Alertes activées" : "Alertes en pause"}
                </span>
              </Link>
              <form action={deleteSearchAction.bind(null, s.id)}>
                <button
                  type="submit"
                  aria-label="Supprimer la recherche"
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </form>
            </div>
            <form action={toggleAlertAction.bind(null, s.id, !s.alertsEnabled)} className="mt-3">
              <button
                type="submit"
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition " +
                  (s.alertsEnabled
                    ? "bg-accent-50 text-accent-700 hover:bg-accent-100"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200")
                }
              >
                {s.alertsEnabled ? "Mettre les alertes en pause" : "Réactiver les alertes"}
              </button>
            </form>
          </div>
        ))}
      </div>
    </section>
  );
}
