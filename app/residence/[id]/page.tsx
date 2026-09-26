import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatXOF, getResidence } from "@/lib/api";
import { PhotoGrid } from "@/components/photo-grid";

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

        {/* Carte de réservation */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-ink">{formatXOF(r.minNightlyPrice)}</span>
              <span className="text-sm text-muted">/ nuit</span>
            </div>
            <p className="mt-1 text-sm text-muted">Acompte 30 % à la réservation.</p>
            <Link
              href={`/reserver?type=residence&id=${encodeURIComponent(r.id)}`}
              className="btn-primary mt-4 w-full bg-accent-600 hover:bg-accent-700"
            >
              Choisir les dates
            </Link>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              {[
                "L'hôte confirme la disponibilité",
                "Paiement sécurisé de l'acompte",
                "Code d'arrivée à votre check-in",
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <svg className="mt-0.5 shrink-0 text-accent-600" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                    <path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-3 px-1 text-xs text-muted">
            L'adresse exacte est communiquée après le paiement de l'acompte.
          </p>
        </aside>
      </div>
    </div>
  );
}
