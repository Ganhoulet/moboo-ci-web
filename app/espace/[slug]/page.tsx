import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { formatXOF, getEspace, getEspaceOccupied } from "@/lib/api";
import { mapEspace, similarEspaces } from "@/lib/property";
import type { Tarif } from "@/lib/types";
import { PhotoGrid } from "@/components/photo-grid";
import { EspaceBooking } from "@/components/espace-booking";
import { LocationMap } from "@/components/location-map";
import { PropertyCard } from "@/components/property-card";
import { MobileBookBar } from "@/components/mobile-book-bar";
import { DetailActions, ReadMore } from "@/components/detail-actions";
import {
  BookingSteps, Breadcrumbs, DetailMeta, FeatureList, HostCard, Icons, JsonLd,
  KeyFacts, PinIcon, Section, VideoSection, type Fact,
} from "@/components/detail";

export const revalidate = 60;

const TYPE_LABEL: Record<string, string> = {
  salle_mariage: "Salle de réception",
  rooftop: "Rooftop",
  villa: "Villa",
  jardin: "Jardin",
  corporate: "Corporate",
  club: "Club",
  conference: "Salle de conférence",
  culturel: "Culturel",
  maquis: "Maquis",
};

const TARIF_TYPE: Record<string, string> = {
  soiree: "Soirée",
  journee: "Journée",
  weekend: "Week-end",
  heure: "À l'heure",
  forfait: "Forfait",
};

const INCLUS: [keyof Tarif, string][] = [
  ["inclutSon", "Sonorisation"],
  ["inclutLumiere", "Éclairage"],
  ["inclutNettoyage", "Nettoyage"],
  ["inclutSecurite", "Sécurité"],
  ["inclutParking", "Parking"],
];

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const e = await getEspace(params.slug);
  if (!e) return { title: "Espace" };
  const zone = [e.quartier, e.commune].filter(Boolean).join(", ");
  const description = `${TYPE_LABEL[e.type] ?? "Espace événementiel"} à ${zone} — ${e.capaciteMin} à ${e.capaciteMax} personnes. Réservez votre date sur Moboo.ci.`;
  return {
    title: e.nom,
    description,
    openGraph: { title: e.nom, description, images: e.photoPrincipaleUrl ? [e.photoPrincipaleUrl] : undefined },
  };
}

export default async function EspacePage({ params }: { params: { slug: string } }) {
  const e = await getEspace(params.slug);
  if (!e) notFound();

  const zone = [e.quartier, e.commune].filter(Boolean).join(", ") || "Côte d'Ivoire";
  const tarifs = (e.tarifs ?? []).filter((t) => (t.prix ?? 0) > 0);
  const aPartir = tarifs.length ? Math.min(...tarifs.map((t) => t.prix!)) : null;
  const photos = [e.photoPrincipaleUrl, ...(e.photos ?? [])].filter(Boolean) as string[];
  const [occupied, similar] = await Promise.all([
    getEspaceOccupied(e.id),
    similarEspaces({ commune: e.commune, excludeId: e.id }).catch(() => []),
  ]);
  const typeLabel = TYPE_LABEL[e.type] ?? "Espace";

  const facts: Fact[] = [
    { icon: Icons.home, label: "Type", value: typeLabel },
    { icon: Icons.users, label: "Capacité", value: `${e.capaciteMin}–${e.capaciteMax} pers.` },
  ];
  if (e.superficie) facts.push({ icon: Icons.area, label: "Superficie", value: `${e.superficie} m²` });
  if (e.horaireOuverture && e.horaireFermeture) facts.push({ icon: Icons.clock, label: "Horaires", value: `${e.horaireOuverture} – ${e.horaireFermeture}` });
  if (aPartir) facts.push({ icon: Icons.tag, label: "À partir de", value: formatXOF(aPartir) });
  if (e.cautionMontant) facts.push({ icon: Icons.shield, label: "Caution", value: formatXOF(e.cautionMontant) });

  const acompte = e.acomptePourcentage ?? 30;
  const steps = [
    { title: "Envoyez votre demande", text: "Choisissez la date et le type d'événement : c'est gratuit et sans engagement." },
    { title: "Le propriétaire confirme", text: "Il valide la date et vous adresse un devis depuis son appli Moboo Event." },
    { title: `Bloquez la date avec ${acompte} % d'acompte`, text: "Paiement par mobile money, sécurisé par Moboo. Le solde se règle selon le devis." },
  ];
  if (e.cautionMontant) {
    steps.push({ title: "Caution restituée", text: `Une caution de ${formatXOF(e.cautionMontant)} est demandée et restituée après l'événement si tout est en ordre.` });
  }
  const hasMap = e.latitude != null && e.longitude != null;

  return (
    <div className="container-page py-8 pb-28 lg:pb-8">
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "EventVenue",
          name: e.nom,
          description: e.description ?? undefined,
          image: photos.slice(0, 5),
          maximumAttendeeCapacity: e.capaciteMax,
          address: { "@type": "PostalAddress", addressLocality: e.commune, addressCountry: "CI" },
        }}
      />

      <Breadcrumbs
        items={[
          { label: "Accueil", href: "/" },
          { label: "Espaces", href: "/annonces?transaction=event" },
          ...(e.commune ? [{ label: e.commune, href: `/annonces?transaction=event&q=${encodeURIComponent(e.commune)}` }] : []),
          { label: e.nom },
        ]}
      />

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-ink/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">{typeLabel}</span>
        <span className="chip">{e.capaciteMin}–{e.capaciteMax} pers.</span>
        {e.accepteReservationAuto ? <span className="chip">Confirmation rapide</span> : null}
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">{e.nom}</h1>
          <p className="mt-1 flex items-center gap-1 text-muted">{PinIcon}{zone}</p>
          <div className="mt-1"><DetailMeta reference={e.reference} updatedAt={e.updatedAt} /></div>
        </div>
        <DetailActions property={mapEspace(e)} />
      </div>

      <div className="mt-6">
        <PhotoGrid photos={photos} alt={e.nom} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-10">
          <KeyFacts items={facts} />

          {e.description ? (
            <Section title="À propos de cet espace">
              <ReadMore text={e.description} />
            </Section>
          ) : null}

          {e.equipementsInclus?.length ? (
            <Section title="Équipements inclus">
              <FeatureList items={e.equipementsInclus} />
            </Section>
          ) : null}

          {tarifs.length ? (
            <Section title="Formules et tarifs">
              <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                {tarifs.map((t, i) => {
                  const inclus = INCLUS.filter(([k]) => t[k]).map(([, l]) => l);
                  const meta = [
                    t.type && TARIF_TYPE[t.type] && TARIF_TYPE[t.type] !== t.nom ? TARIF_TYPE[t.type] : null,
                    t.dureesIncluses && t.type !== "heure" ? `${t.dureesIncluses} h incluses` : null,
                    t.prixHeureSup ? `heure sup. ${formatXOF(t.prixHeureSup)}` : null,
                  ].filter(Boolean);
                  return (
                    <div key={t.id ?? i} className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{t.nom ?? "Formule"}</p>
                          {meta.length ? <p className="text-sm text-muted">{meta.join(" · ")}</p> : null}
                        </div>
                        <p className="shrink-0 font-bold text-ink">{formatXOF(t.prix ?? null)}</p>
                      </div>
                      {inclus.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {inclus.map((l) => <span key={l} className="chip text-xs">{l} inclus</span>)}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </Section>
          ) : null}

          {e.reglesInternes ? (
            <Section title="Règlement intérieur">
              <ReadMore text={e.reglesInternes} lines={5} />
            </Section>
          ) : null}

          <VideoSection url={e.videoUrl} />

          {hasMap ? (
            <Section title="Où se situe l'espace">
              <LocationMap
                lat={e.latitude!}
                lng={e.longitude!}
                label={zone}
                approximate
                note="Zone approximative — l'adresse exacte vous est envoyée à la confirmation."
              />
            </Section>
          ) : null}

          <Section title="Comment se passe la réservation">
            <BookingSteps steps={steps} />
            {e.delaiAnnulationHeures ? (
              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
                <span className="font-semibold text-ink">Annulation :</span> à signaler au moins{" "}
                {e.delaiAnnulationHeures >= 48 && e.delaiAnnulationHeures % 24 === 0
                  ? `${e.delaiAnnulationHeures / 24} jours`
                  : `${e.delaiAnnulationHeures} h`}{" "}
                avant l'événement, selon les conditions du devis.
              </p>
            ) : null}
          </Section>

          {e.host ? <HostCard host={e.host} noun="espace" /> : null}
        </div>

        <aside id="reserver" className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start">
          <EspaceBooking espaceId={e.id} occupied={occupied} fromPrice={aPartir} />
        </aside>
      </div>

      {similar.length > 0 ? (
        <section className="mt-14">
          <h2 className="font-display text-xl font-bold text-ink">D'autres espaces pour votre événement</h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {similar.map((p) => <PropertyCard key={p.id} p={p} />)}
          </div>
        </section>
      ) : null}

      <MobileBookBar price={aPartir} prefix="dès" cta="Choisir une date" />
    </div>
  );
}
