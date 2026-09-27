import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatXOF, getResidence, getApartmentOccupied, type OccupiedRange } from "@/lib/api";
import { PhotoGrid } from "@/components/photo-grid";
import { ResidenceBooking, type BookableApt } from "@/components/residence-booking";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const r = await getResidence(params.id);
  return { title: r ? r.name : "Résidence" };
}

export default async function ResidencePage({ params }: { params: { id: string } }) {
  const r = await getResidence(params.id);
  if (!r) notFound();

  const zone = [r.commune, r.city].filter(Boolean).join(", ") || "Côte d'Ivoire";
  const photos = [
    ...(r.photos ?? []),
    ...r.apartments.flatMap((a) => a.photos ?? []),
  ];

  // Logements réservables + dates occupées (calendrier), récupérées côté serveur.
  const bookable: BookableApt[] = (r.apartments ?? []).map((a) => ({
    id: a.id, type: a.type, nightlyPrice: Number(a.nightlyPrice) || 0,
  }));
  const occupiedByApt: Record<string, OccupiedRange[]> = {};
  await Promise.all(
    bookable.map(async (a) => { occupiedByApt[a.id] = await getApartmentOccupied(a.id); }),
  );

  return (
    <div className="container-page py-8">
      <Link href="/annonces?reservable=1" className="text-sm font-semibold text-muted hover:text-ink">
        ← Retour aux annonces
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-ink/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          Meublé
        </span>
        <span className="chip">Réservable</span>
      </div>
      <h1 className="mt-2 font-display text-2xl font-extrabold text-ink sm:text-3xl">{r.name}</h1>
      <p className="mt-1 flex items-center gap-1 text-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        {zone}
      </p>

      <div className="mt-6">
        <PhotoGrid photos={photos} alt={r.name} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Contenu */}
        <div className="space-y-8">
          {r.description ? (
            <section>
              <h2 className="font-display text-lg font-bold text-ink">Description</h2>
              <p className="mt-2 whitespace-pre-line text-slate-600">{r.description}</p>
            </section>
          ) : null}

          {r.amenities?.length ? (
            <section>
              <h2 className="font-display text-lg font-bold text-ink">Équipements</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {r.amenities.map((a) => (
                  <span key={a} className="chip">{a}</span>
                ))}
              </div>
            </section>
          ) : null}

          {r.apartments?.length ? (
            <section>
              <h2 className="font-display text-lg font-bold text-ink">
                Logements disponibles ({r.apartments.length})
              </h2>
              <div className="mt-3 divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {r.apartments.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-4 p-4">
                    <div>
                      <p className="font-semibold text-ink">{a.type}</p>
                      <p className="text-sm text-muted">
                        {a.surface ? `${a.surface} m²` : "Logement meublé"}
                      </p>
                    </div>
                    <p className="shrink-0 font-bold text-ink">
                      {formatXOF(a.nightlyPrice)}
                      <span className="text-sm font-medium text-muted"> / nuit</span>
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        {/* Carte de réservation avec calendrier (façon Airbnb) */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          {bookable.length > 0 ? (
            <ResidenceBooking apartments={bookable} occupiedByApt={occupiedByApt} depositPercent={30} />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-ink">{formatXOF(r.minNightlyPrice)}</span>
                <span className="text-sm text-muted">/ nuit</span>
              </div>
              <Link
                href={`/reserver?type=residence&id=${encodeURIComponent(r.id)}`}
                className="btn-primary mt-4 w-full bg-accent-600 hover:bg-accent-700"
              >
                Choisir les dates
              </Link>
            </div>
          )}
          <p className="mt-3 px-1 text-xs text-muted">
            L'adresse exacte est communiquée après le paiement de l'acompte.
          </p>
        </aside>
      </div>
    </div>
  );
}
