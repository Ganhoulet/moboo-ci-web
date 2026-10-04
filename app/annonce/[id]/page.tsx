import { ReviewsSection } from "@/components/reviews";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatXOF, getListing } from "@/lib/api";
import { mapListing, similarListings } from "@/lib/property";
import { ReadMore } from "@/components/detail-actions";
import { ReportButton } from "@/components/report-button";
import { AsidePerson, DetailHero, DetailIntro, type HeroPerson } from "@/components/detail-hero";
import {
  DetailMeta, FeatureList, Icons as I, JsonLd, KeyFacts, Section, displayName, type Fact,
} from "@/components/detail";
import { LocationMap } from "@/components/location-map";
import { PropertyCard } from "@/components/property-card";
import { InquiryForm } from "@/components/inquiry-form";
import { VisitForm } from "@/components/visit-form";
import { MobileContactBar } from "@/components/mobile-contact-bar";
import { ContactLink } from "@/components/contact-link";
import { getSiteSettings } from "@/lib/settings";
import { getTaxonomies, typeLabel } from "@/lib/taxonomies";
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
  const phoneDigits = (l.agent?.whatsapp || l.agent?.phone || l.contactPhone || "").replace(/[^0-9]/g, "");
  // Sections affichées, extrait, biens similaires : back-office → Détails de la propriété.
  const { listing: cfg, general, print, moderation } = await getSiteSettings();
  const tax = await getTaxonomies();
  const TYPE = (slug: string) => typeLabel(tax, slug);
  const similar = cfg.showSimilar
    ? await similarListings({
        city: l.city,
        transaction: l.transaction,
        excludeId: l.id,
        limit: cfg.similarCount,
      }).catch(() => [])
    : [];

  const specs: Fact[] = [
    { icon: I.home, label: "Type", value: TYPE(l.propertyType) },
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

  // Agent / agence rattaché (reprise WP), sinon l'annonceur particulier.
  const person: HeroPerson | null = l.agent
    ? {
        role: l.agent.kind === "agency" ? "Agence" : "Agent",
        name: l.agent.name,
        photoUrl: l.agent.photoUrl,
        sub: [l.agent.position, l.agent.company].filter(Boolean).join(" · ") || l.agent.serviceArea || "Agent immobilier Moboo.ci",
      }
    : l.owner
      ? { role: "Annonceur", name: l.owner.name, photoUrl: l.owner.photoUrl, sub: "Contact direct, sans commission", verified: !!l.owner.verified, businessVerified: !!l.owner.businessVerified }
      : l.contactName
        ? { role: "Annonceur", name: displayName(l.contactName), sub: "Contact direct, sans commission" }
        : null;

  // Phrase de résumé : « À vendre : villa · 3 chambres · 2 salles de bain · 250 m² ».
  // (Sur mobile les badges portent déjà la transaction : on n'y reprend que les chiffres.)
  const summary = [
    `${txLabel} : ${TYPE(l.propertyType).toLowerCase()}`,
    l.bedrooms ? `${l.bedrooms} chambre${l.bedrooms > 1 ? "s" : ""}` : null,
    l.bathrooms ? `${l.bathrooms} salle${l.bathrooms > 1 ? "s" : ""} de bain` : null,
    l.surface ? `${l.surface} m²` : null,
  ];
  const meta = <DetailMeta reference={l.reference} updatedAt={l.updatedAt} views={l.views} />;

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

      <DetailHero
        bannerStyle={cfg.bannerStyle}
        printHref={print.enabled ? `/annonce/${l.id}/imprimer` : undefined}
        photos={l.photos}
        videoUrl={cfg.showVideo ? l.videoUrl : null}
        backHref={`/annonces?transaction=${l.transaction}`}
        breadcrumbs={[
          { label: "Accueil", href: "/" },
          { label: txLabel, href: `/annonces?transaction=${l.transaction}` },
          ...(l.commune ? [{ label: l.commune, href: `/annonces?transaction=${l.transaction}&q=${encodeURIComponent(l.commune)}` }] : []),
          { label: l.title },
        ]}
        badges={
          <>
            <span className="rounded-md bg-ink/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white"
              style={l.listingKind === "classic" && l.statusLabel?.color ? { background: l.statusLabel.color } : undefined}>
              {l.listingKind === "furnished" ? "Meublé" : l.listingKind === "event" ? "Événementiel" : l.statusLabel?.label ?? TX_LABEL[l.transaction] ?? l.transaction}
            </span>
            <span className="chip">{TYPE(l.propertyType)}</span>
            {l.featured ? <span className="rounded-md bg-amber-500 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">★ En vedette</span> : null}
            {(l.labels ?? []).map((lb) => <span key={lb.slug} className="rounded-md px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white" style={{ background: lb.color ?? "#334155" }}>{lb.label}</span>)}
          </>
        }
        title={l.title}
        zone={zone}
        summary={summary.slice(1)}
        price={
          <p className="text-xl font-extrabold text-brand-800">
            {formatXOF(l.price)}
            {l.transaction === "rent" ? <span className="text-sm font-medium text-muted"> / mois</span> : null}
          </p>
        }
        meta={meta}
        person={person}
        property={mapListing(l)}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-10">
          <DetailIntro summary={summary} meta={meta} />
          <KeyFacts items={specs} />

          {l.description ? (
            <Section title="Description">
              <ReadMore text={l.description} words={general.excerptEnabled ? general.excerptWords : 0} label={general.readMoreText} />
            </Section>
          ) : null}

          {cfg.showFeatures && features.length > 0 ? (
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

          {cfg.showMap && l.latitude != null && l.longitude != null ? (
            <Section title="Localisation">
              <LocationMap lat={l.latitude} lng={l.longitude} label={zone} />
            </Section>
          ) : null}

          {l.listingKind === "classic" || !l.listingKind ? <ReviewsSection type="listing" id={l.id} path={`/annonce/${l.id}`} /> : null}

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

        <aside className="lg:self-start">
          <AsidePerson person={person} />
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
              {/* Coordonnées de l'agent si rattaché, sinon de l'annonceur. */}
              {phoneDigits ? (
                <div className="mt-4 grid gap-2">
                  <ContactLink listingId={l.id} channel="call" href={`tel:${barPhone}`} className="btn-primary w-full bg-brand-800 hover:bg-brand-900">Appeler</ContactLink>
                  <ContactLink listingId={l.id} channel="whatsapp" href={`https://wa.me/${phoneDigits}`} className="btn-ghost w-full" target="_blank" rel="noopener noreferrer">WhatsApp</ContactLink>
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted">Contact communiqué par l'annonceur.</p>
              )}
              <p className="mt-3 text-xs text-muted">
                {cfg.contactNotice}
              </p>
            </div>
          )}

          {cfg.showVisitForm ? (
            <div className="mt-4">
              <VisitForm listingId={l.id} />
            </div>
          ) : null}

          {cfg.showContactForm ? (
            <div className="mt-4">
              <InquiryForm listingId={l.id} title={l.title} />
            </div>
          ) : null}

          {moderation.reportsEnabled ? (
            <div className="mt-4 text-center">
              <ReportButton targetType="listing" targetId={l.id} />
            </div>
          ) : null}
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

      <MobileContactBar listingId={l.id} price={l.price} transaction={l.transaction} phone={barPhone} whatsapp={barWhatsapp} />
    </div>
  );
}
