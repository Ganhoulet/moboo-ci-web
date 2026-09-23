import type { Metadata } from "next";
import { listEspaces, listResidences } from "@/lib/api";
import { ResidenceCard } from "@/components/residence-card";
import { EspaceCard } from "@/components/espace-card";

export const metadata: Metadata = {
  title: "Réserver",
  description:
    "Explorez les résidences meublées et espaces événementiels réservables sur Moboo.ci.",
};

export const revalidate = 60;

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: { type?: string; city?: string };
}) {
  const type = searchParams.type;
  const showResidences = type !== "espace";
  const showEspaces = type !== "residence";

  const [residences, espaces] = await Promise.all([
    showResidences ? listResidences({ city: searchParams.city }) : Promise.resolve(null),
    showEspaces ? listEspaces({ commune: searchParams.city }) : Promise.resolve(null),
  ]);

  const total = (residences?.total ?? 0) + (espaces?.total ?? 0);

  return (
    <div>
      {/* Hero */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50 to-slate-50">
        <div className="container-page py-14 sm:py-20">
          <span className="chip bg-white text-brand-800 shadow-sm">
            Réservation en ligne · Côte d'Ivoire
          </span>
          <h1 className="mt-4 max-w-2xl text-3xl font-extrabold tracking-tight text-ink sm:text-5xl">
            Réservez votre séjour ou votre événement,{" "}
            <span className="text-brand-800">en toute confiance.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted sm:text-lg">
            Résidences meublées et espaces événementiels vérifiés. Paiement
            sécurisé, confirmation par l'hôte et code d'arrivée à votre check-in.
          </p>

          {/* Barre de recherche (visuelle — filtres à venir) */}
          <div className="mt-8 flex max-w-2xl flex-col gap-3 rounded-2xl bg-white p-3 shadow-card sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2 px-3">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" strokeLinejoin="round" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <input
                className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-slate-400"
                placeholder="Quartier ou ville (ex. Cocody, Abidjan)"
                aria-label="Lieu"
                disabled
              />
            </div>
            <button className="btn-primary sm:w-auto" type="button" disabled>
              Rechercher
            </button>
          </div>
        </div>
      </section>

      {/* Résultats */}
      <div className="container-page py-12">
        {total === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-14">
            {showResidences && residences && residences.items.length > 0 && (
              <Section
                title="Résidences meublées"
                subtitle="Courts séjours, à la nuitée"
                count={residences.total}
              >
                {residences.items.map((r) => (
                  <ResidenceCard key={r.id} r={r} />
                ))}
              </Section>
            )}

            {showEspaces && espaces && espaces.items.length > 0 && (
              <Section
                title="Espaces événementiels"
                subtitle="Mariages, corporate, réceptions"
                count={espaces.total}
              >
                {espaces.items.map((e) => (
                  <EspaceCard key={e.id} e={e} />
                ))}
              </Section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-ink sm:text-2xl">{title}</h2>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        <span className="hidden text-sm text-muted sm:block">{count} annonce(s)</span>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {children}
      </div>
    </section>
  );
}

function EmptyState() {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-slate-100 text-slate-400">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="M3 9h18M8 4v16" strokeLinejoin="round" />
        </svg>
      </div>
      <h3 className="mt-4 font-semibold text-ink">Aucune annonce pour le moment</h3>
      <p className="mt-1 text-sm text-muted">
        Les propriétaires publient leurs biens depuis Moboo Resi & Moboo Event.
        Revenez bientôt !
      </p>
    </div>
  );
}
