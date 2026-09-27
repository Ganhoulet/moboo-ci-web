import type { Metadata } from "next";
import Link from "next/link";
import { getSession, displayName, initials } from "@/lib/session";
import { LoginFlow } from "@/components/login-flow";
import { logoutAction } from "./actions";
import { listSearches, deleteSearchAction, toggleAlertAction } from "./searches-actions";
import { searchToHref } from "@/lib/searches";

export const metadata: Metadata = {
  title: "Mon compte",
  description: "Connectez-vous à Moboo.ci pour retrouver vos favoris, réservations et alertes.",
};

export const dynamic = "force-dynamic";

const LINKS = [
  { href: "/favoris", label: "Mes favoris", desc: "Les biens que vous avez enregistrés" },
  { href: "/annonces?reservable=1", label: "Réserver un séjour", desc: "Résidences meublées & espaces" },
  { href: "/publier", label: "Publier une annonce", desc: "Mettre un bien à louer ou à vendre" },
];

export default async function ComptePage() {
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
            Un numéro de téléphone suffit. Retrouvez vos favoris, vos réservations et
            recevez des alertes sur les nouveaux biens.
          </p>
          <div className="mt-6 rounded-2xl bg-white p-6 shadow-card">
            <LoginFlow />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-4">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-800 text-xl font-extrabold text-white">
            {initials(account)}
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold text-ink">
              {displayName(account)}
            </h1>
            <p className="text-sm text-muted">{account.phone}</p>
          </div>
        </div>

        <SavedSearches />

        <div className="mt-8 grid gap-3">
          {LINKS.map((l) => (
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
