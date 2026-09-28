import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatXOF, getListing } from "@/lib/api";
import { mapListing, similarListings } from "@/lib/property";
import { PhotoGrid } from "@/components/photo-grid";
import { DetailActions, ReadMore } from "@/components/detail-actions";
import {
  Breadcrumbs, DetailMeta, FeatureList, Icons as I, JsonLd, KeyFacts, PinIcon, Section, VideoSection, type Fact,
} from "@/components/detail";
import { LocationMap } from "@/components/location-map";
import { PropertyCard } from "@/components/property-card";
import { InquiryForm } from "@/components/inquiry-form";
import { AgentCard } from "@/components/agent-card";
import { VisitForm } from "@/components/visit-form";
import { MobileContactBar } from "@/components/mobile-contact-bar";
import { ListingReservation } from "@/components/listing-reservation";

export const revalidate = 60;

const TX_LABEL: Record<string, string> = { rent: "À louer", sale: "À vendre" };
const TYPE_LABEL: Record<string, string> = {
  appartement: "Appartement", maison: "Maison", villa: "Villa", studio: "Studio",
  terrain: "Terrain", bureau: "Bureau", magasin: "Magasin", autre: "Bien",
};

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const l = await getListing(params.id);
  if (!l) return { title: "Annonce" };
  const zone = [l.quartier, l.commune, l.city].filter(Boolean).join(", ");
  const description = `${TYPE_LABEL[l.propertyType] ?? "Bien"} ${l.transaction === "rent" ? "à louer" : "à vendre"} à ${zone} — ${formatXOF(l.price)}${l.transaction === "rent" ? " / mois" : ""}. Contact direct sur Moboo.ci.`;
  return {
    title: l.title,
    description,
    openGraph: { title: l.title, description, images: l.photos?.slice(0, 1) },
  };
}

export default async function AnnoncePage({ params }: { params: { id: string } }) {
  const l = await getListing(params.id);
  if (!l) notFound();

  const zone = [l.quartier, l.commune, l.city].filter(Boolean).join(", ") || "Côte d'Ivoire";
  const phoneDigits = (l.contactPhone ?? "").replace(/[^0-9]/g, "");
  const similar = await similarListings({
    city: l.city,
    transaction: l.transaction,
    excludeId: l.id,
    limit: 4,
  }).catch(() => []);

  const specs: Fact[] = [
    { icon: I.home, label: "Type", value: TYPE_LABEL[l.propertyType] ?? "Bien" },
  ];
  if (l.bedrooms != null) specs.push({ icon: I.bed, label: "Chambres", value: String(l.bedrooms) });
  if (l.bathrooms != null) specs.push({ icon: I.bath, label: "Salles de bain", value: String(l.bathrooms) });
  if (l.garage != null && l.garage > 0) specs.push({ icon: I.car, label: "Garage", value: String(l.garage) });
  if (l.surface != null) specs.push({ icon: I.area, label: "Surface", value: `${l.surface} m²` });
  if (l.yearBuilt != null && l.yearBuilt > 0) specs.push({ icon: I.cal, label: "Année", value: String(l.yearBuilt) });

  if (l.transaction === "sale" && l.surface && l.price > 0 && l.propertyType === "terrain") {
    specs.push({ icon: I.tag, label: "Prix au m²", value: formatXOF(l.price / l.surface) });
  }
  const features = l.features ?? [];
  const units = (l.units ?? []).filter((u) => u?.title);
  const txLabel = l.transaction === "rent" ? "À louer" : "À vendre";

  const barPhone = l.agent?.phone || l.contactPhone;
  const barWhatsapp = l.agent?.whatsapp || l.contactPhone;
  const isReservable = l.listingKind === "furnished" || l.listingKind === "event";

  return (
    <div className="container-page py-8 pb-24 lg:pb-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "RealEstateListing",
          name: l.title,
          description: l.description ?? undefined,
          image: (l.photos ?? []).slice(0, 5),
          datePosted: l.createdAt,
          offers: {
            "@type": "Offer",
            price: l.price,
            priceCurrency: "XOF",
            businessFunction: l.transaction === "rent" ? "http://purl.org/goodrelations/v1#LeaseOut" : "http://purl.org/goodrelations/v1#Sell",
          },
          address: { "@type": "PostalAddress", addressLocality: l.commune ?? l.city, addressRegion: l.city, addressCountry: "CI" },
        }}
      />

      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: txLabel, href: `/annonces?transaction=${l.transaction}` },
          ...(l.commune ? [{ label: l.commune, href: `/annonces?transaction=${l.transaction}&q=${encodeURIComponent(l.commune)}` }] : []),
          { label: l.title },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-ink/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {l.listingKind === "furnished" ? "Meublé" : l.listingKind === "event" ? "Événementiel" : TX_LABEL[l.transaction] ?? l.transaction}
        </span>
        <span className="chip">{TYPE_LABEL[l.propertyType] ?? "Bien"}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{l.title}</h1>
          <p className="mt-1 flex items-center gap-1 text-muted">{PinIcon}{zone}</p>
          <p className="mt-1 text-xl font-extrabold text-brand-800">
            {formatXOF(l.price)}
            {l.transaction === "rent" ? <span className="text-sm font-medium text-muted"> / mois</span> : null}
          </p>
          <div className="mt-1"><DetailMeta reference={l.reference} updatedAt={l.updatedAt} views={l.views} /></div>
        </div>
        <DetailActions property={mapListing(l)} />
      </div>

      <div className="mt-6">
        <PhotoGrid photos={l.photos} alt={l.title} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-10">
          <KeyFacts items={specs} />

          {l.description ? (
            <Section title="Description">
              <ReadMore text={l.description} />
            </Section>
          ) : null}

          {features.length > 0 ? (
            <Section title="Équipements">
              <FeatureList items={features} />
            </Section>
          ) : null}

          {units.length > 0 ? (
            <Section title={`Unités disponibles (${units.length})`}>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="w-full min-w-[28rem] text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Unité</th>
                      <th className="px-4 py-2.5 font-semibold">Chambres</th>
                      <th className="px-4 py-2.5 font-semibold">Surface</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Prix</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {units.map((u, i) => (
                      <tr key={u.title + i}>
                        <td className="px-4 py-3 font-semibold text-ink">{u.title}</td>
                        <td className="px-4 py-3 text-slate-600">{u.bedrooms || "—"}</td>
                        <td className="px-4 py-3 text-slate-600">{u.size ? `${u.size.replace(/\s*m(²|2)?$/i, "")} m²` : "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold text-ink">{u.price ? formatXOF(u.price) : "Sur demande"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          ) : null}

          <VideoSection url={l.videoUrl} />

          {l.latitude != null && l.longitude != null ? (
            <Section title="Localisation">
              <LocationMap lat={l.latitude} lng={l.longitude} label={zone} />
            </Section>
          ) : null}

          {!isReservable ? (
            <Section title="Conseils avant de vous engager">
              <ul className="space-y-2 text-sm text-slate-600">
                {[
                  "Visitez toujours le bien avant de verser de l'argent.",
                  l.transaction === "sale"
                    ? "Vérifiez les documents (ACD, titre foncier, lettre d'attribution) auprès d'un notaire."
                    : "Demandez un contrat de bail écrit et un reçu pour chaque paiement (caution, avance).",
                  "Méfiez-vous des prix anormalement bas ou des demandes d'avance à distance.",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="mt-0.5 shrink-0 text-brand-800">{I.shield}</span>
                    {t}
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {isReservable ? (
            <ListingReservation
              listingId={l.id}
              mode={l.listingKind === "event" ? "event" : "furnished"}
              price={l.price}
              depositPercent={30}
            />
          ) : (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-extrabold text-ink">{formatXOF(l.price)}</span>
                {l.transaction === "rent" ? <span className="text-sm text-muted">/ mois</span> : null}
              </div>
              {l.contactName ? (
                <p className="mt-3 text-sm text-slate-600">
                  Contact : <span className="font-semibold text-ink">{l.contactName}</span>
                </p>
              ) : null}
              {phoneDigits ? (
                <div className="mt-3 grid gap-2">
                  <a href={`tel:${l.contactPhone}`} className="btn-primary w-full bg-brand-800 hover:bg-brand-900">Appeler</a>
                  <a href={`https://wa.me/${phoneDigits}`} className="btn-ghost w-full" target="_blank" rel="noopener noreferrer">WhatsApp</a>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">Contact communiqué par l'annonceur.</p>
              )}
              <p className="mt-3 text-xs text-muted">
                Mise en relation directe avec l'annonceur — Moboo ne prend pas de commission
                sur les ventes et locations classiques.
              </p>
            </div>
          )}

          {l.agent ? (
            <div className="mt-4">
              <AgentCard agent={l.agent} />
            </div>
          ) : null}

          <div className="mt-4">
            <VisitForm listingId={l.id} />
          </div>

          <div className="mt-4">
            <InquiryForm listingId={l.id} title={l.title} />
          </div>
        </aside>
      </div>

      {similar.length > 0 ? (
        <section className="mt-12">
          <h2 className="font-display text-xl font-bold text-ink">Biens similaires</h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((p) => (
              <PropertyCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      ) : null}

      <MobileContactBar price={l.price} transaction={l.transaction} phone={barPhone} whatsapp={barWhatsapp} />
    </div>
  );
}
