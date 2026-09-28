import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatXOF, getResidence, getApartmentOccupied, type OccupiedRange } from "@/lib/api";
import { apartmentLabel, mapResidence, similarResidences } from "@/lib/property";
import { PhotoGrid } from "@/components/photo-grid";
import { ResidenceBooking, type BookableApt } from "@/components/residence-booking";
import { LocationMap } from "@/components/location-map";
import { PropertyCard } from "@/components/property-card";
import { MobileBookBar } from "@/components/mobile-book-bar";
import { DetailActions, ReadMore } from "@/components/detail-actions";
import {
  BookingSteps, Breadcrumbs, DetailMeta, FeatureList, HostCard, Icons, JsonLd,
  KeyFacts, PinIcon, Section, VideoSection, type Fact,
} from "@/components/detail";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const r = await getResidence(params.id);
  if (!r) return { title: "Résidence" };
  const zone = [r.commune, r.city].filter(Boolean).join(", ");
  const price = r.minNightlyPrice ? ` dès ${formatXOF(r.minNightlyPrice)} / nuit` : "";
  const description = `Résidence meublée à ${zone}${price}. Réservez en ligne sur Moboo.ci.`;
  return {
    title: r.name,
    description,
    openGraph: { title: r.name, description, images: r.photos?.slice(0, 1) },
  };
}

const num = (v: unknown) => (v == null || v === "" ? 0 : Number(v) || 0);

export default async function ResidencePage({ params }: { params: { id: string } }) {
  const r = await getResidence(params.id);
  if (!r) notFound();

  const zone = [r.commune, r.city].filter(Boolean).join(", ") || "Côte d'Ivoire";
  const apts = r.apartments ?? [];
  const photos = [...(r.photos ?? []), ...apts.flatMap((a) => a.photos ?? [])];

  // Logements réservables + dates occupées (calendrier), récupérées côté serveur.
  const bookable: BookableApt[] = apts.map((a) => ({
    id: a.id, type: apartmentLabel(a.type), nightlyPrice: num(a.nightlyPrice),
  }));
  const occupiedByApt: Record<string, OccupiedRange[]> = {};
  const [similar] = await Promise.all([
    similarResidences({ commune: r.commune, city: r.city, excludeId: r.id }).catch(() => []),
    ...bookable.map(async (a) => { occupiedByApt[a.id] = await getApartmentOccupied(a.id); }),
  ]);

  // Caractéristiques clés (comme l'en-tête « valued features » de l'appli).
  const surfaces = apts.map((a) => num(a.surface)).filter(Boolean);
  const deposits = apts.map((a) => num(a.deposit)).filter(Boolean);
  const weekly = apts.map((a) => num(a.weeklyPrice)).filter(Boolean);
  const monthly = apts.map((a) => num(a.monthlyPrice)).filter(Boolean);
  const facts: Fact[] = [
    { icon: Icons.home, label: "Type", value: apts.length === 1 ? apartmentLabel(apts[0].type) : "Résidence meublée" },
  ];
  if (apts.length > 1) facts.push({ icon: Icons.door, label: "Logements", value: String(apts.length) });
  if (surfaces.length) facts.push({ icon: Icons.area, label: "Surface", value: surfaces.length > 1 ? `${Math.min(...surfaces)}–${Math.max(...surfaces)} m²` : `${surfaces[0]} m²` });
  if (r.minNightlyPrice) facts.push({ icon: Icons.tag, label: "Par nuit, dès", value: formatXOF(r.minNightlyPrice) });
  if (weekly.length) facts.push({ icon: Icons.cal, label: "Par semaine, dès", value: formatXOF(Math.min(...weekly)) });
  if (monthly.length) facts.push({ icon: Icons.cal, label: "Par mois, dès", value: formatXOF(Math.min(...monthly)) });
  if (deposits.length) facts.push({ icon: Icons.shield, label: "Caution", value: formatXOF(Math.max(...deposits)) });

  const amenities = [...(r.amenities ?? []), ...apts.flatMap((a) => a.amenities ?? [])];
  const rules = apts.map((a) => a.houseRules?.trim()).find(Boolean);
  const services = apts.map((a) => a.services?.trim()).find(Boolean);
  const tour = apts.map((a) => a.virtualTourUrl).find((u) => u && /^https?:\/\//i.test(u));
  const hasMap = r.latitude != null && r.longitude != null;

  return (
    <div className="container-page py-8 pb-28 lg:pb-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "LodgingBusiness",
          name: r.name,
          description: r.description ?? undefined,
          image: photos.slice(0, 5),
          address: { "@type": "PostalAddress", addressLocality: r.commune ?? r.city, addressRegion: r.city, addressCountry: "CI" },
          priceRange: r.minNightlyPrice ? `${formatXOF(r.minNightlyPrice)} / nuit` : undefined,
        }}
      />

      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: "Meublés", href: "/annonces?transaction=furnished" },
          ...(r.commune ? [{ label: r.commune, href: `/annonces?transaction=furnished&q=${encodeURIComponent(r.commune)}` }] : []),
          { label: r.name },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-ink/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">Meublé</span>
        <span className="chip">Réservable en ligne</span>
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{r.name}</h1>
          <p className="mt-1 flex items-center gap-1 text-muted">{PinIcon}{zone}</p>
          <div className="mt-1"><DetailMeta reference={r.reference} updatedAt={r.updatedAt} /></div>
        </div>
        <DetailActions property={mapResidence(r)} />
      </div>

      <div className="mt-6">
        <PhotoGrid photos={photos} alt={r.name} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-10">
          <KeyFacts items={facts} />

          {r.description ? (
            <Section title="À propos de ce logement">
              <ReadMore text={r.description} />
            </Section>
          ) : null}

          {amenities.length ? (
            <Section title="Équipements">
              <FeatureList items={amenities} />
            </Section>
          ) : null}

          {apts.length ? (
            <Section title={apts.length > 1 ? `Logements disponibles (${apts.length})` : "Le logement"}>
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {apts.map((a) => {
                  const cover = a.photos?.[0] ?? r.photos?.[0];
                  const details = [
                    a.surface ? `${a.surface} m²` : null,
                    a.floor != null ? (a.floor === 0 ? "Rez-de-chaussée" : `${a.floor}e étage`) : null,
                    num(a.weeklyPrice) ? `${formatXOF(a.weeklyPrice)} / semaine` : null,
                    num(a.monthlyPrice) ? `${formatXOF(a.monthlyPrice)} / mois` : null,
                  ].filter(Boolean);
                  return (
                    <div key={a.id} className="flex items-center gap-4 p-4">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt="" loading="lazy" className="h-16 w-20 shrink-0 rounded-lg object-cover" />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-ink">{apartmentLabel(a.type)}</p>
                        <p className="truncate text-sm text-muted">{details.length ? details.join(" · ") : "Logement meublé"}</p>
                      </div>
                      <p className="shrink-0 text-right font-bold text-ink">
                        {formatXOF(a.nightlyPrice)}
                        <span className="block text-xs font-medium text-muted">/ nuit</span>
                      </p>
                    </div>
                  );
                })}
              </div>
            </Section>
          ) : null}

          {services ? (
            <Section title="Services inclus">
              <p className="whitespace-pre-line text-slate-600">{services}</p>
            </Section>
          ) : null}

          {rules ? (
            <Section title="Règlement intérieur">
              <p className="whitespace-pre-line text-slate-600">{rules}</p>
            </Section>
          ) : null}

          <VideoSection url={r.videoUrl} />

          {tour ? (
            <Section title="Visite virtuelle">
              <a href={tour} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex">
                Lancer la visite 360° ↗
              </a>
            </Section>
          ) : null}

          {hasMap ? (
            <Section title="Où se situe le logement">
              <LocationMap
                lat={r.latitude!}
                lng={r.longitude!}
                label={zone}
                approximate
                note="Zone approximative — l'adresse exacte vous est envoyée après le paiement de l'acompte."
              />
            </Section>
          ) : null}

          <Section title="Comment se passe la réservation">
            <BookingSteps
              steps={[
                { title: "Envoyez votre demande", text: "Choisissez vos dates : la demande est gratuite et sans engagement." },
                { title: "L'hôte confirme", text: "Il valide la disponibilité depuis son appli Moboo Resi." },
                { title: "Réglez l'acompte de 30 %", text: "Par mobile money, sécurisé par Moboo. Le solde se règle sur place." },
                { title: "Recevez votre code d'arrivée", text: "Avec l'adresse exacte et le contact de l'hôte pour le jour J." },
              ]}
            />
          </Section>

          {r.host ? <HostCard host={r.host} noun="logement" /> : null}
        </div>

        {/* Carte de réservation avec calendrier (façon Airbnb) */}
        <aside id="reserver" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
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

      {similar.length > 0 ? (
        <section className="mt-14">
          <h2 className="font-display text-xl font-bold text-ink">Autres meublés à proximité</h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        </section>
      ) : null}

      <MobileBookBar price={r.minNightlyPrice} unit="/ nuit" prefix={apts.length > 1 ? "dès" : undefined} />
    </div>
  );
}
