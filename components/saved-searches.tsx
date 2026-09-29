import Link from "next/link";
import { listSearches, deleteSearchAction, toggleAlertAction } from "@/app/compte/searches-actions";
import { searchToHref } from "@/lib/searches";

export async function SavedSearches() {
  const searches = await listSearches();
  if (searches.length === 0) return null;

  return (
    <section>
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
