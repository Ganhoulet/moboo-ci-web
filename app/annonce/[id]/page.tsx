import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatXOF, getListing } from "@/lib/api";
import { similarListings } from "@/lib/property";
import { PhotoGrid } from "@/components/photo-grid";
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
  return { title: l ? l.title : "Annonce" };
}

function Spec({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-800">{icon}</span>
      <span className="min-w-0">
        <span className="block text-xs text-muted">{label}</span>
        <span className="block truncate font-semibold text-ink">{value}</span>
      </span>
    </div>
  );
}

const I = {
  home: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  bed: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v10M21 11v6M3 12h18v-1a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  bath: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V6a2 2 0 0 1 2-2h1M18 20l1 2M6 20l-1 2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  car: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13 6.5 8h11L19 13M4 17h16v-4H4zM7 17v2M17 17v2" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  area: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z M4 9h16M9 4v16" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  cal: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" strokeLinecap="round" strokeLinejoin="round" /></svg>,
};

/** Extrait l'ID YouTube d'une URL (watch?v=, youtu.be, embed). */
function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
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

  const specs: { icon: React.ReactNode; label: string; value: string }[] = [
    { icon: I.home, label: "Type", value: TYPE_LABEL[l.propertyType] ?? "Bien" },
  ];
  if (l.bedrooms != null) specs.push({ icon: I.bed, label: "Chambres", value: String(l.bedrooms) });
  if (l.bathrooms != null) specs.push({ icon: I.bath, label: "Salles de bain", value: String(l.bathrooms) });
  if (l.garage != null && l.garage > 0) specs.push({ icon: I.car, label: "Garage", value: String(l.garage) });
  if (l.surface != null) specs.push({ icon: I.area, label: "Surface", value: `${l.surface} m²` });
  if (l.yearBuilt != null && l.yearBuilt > 0) specs.push({ icon: I.cal, label: "Année", value: String(l.yearBuilt) });

  const ytId = youtubeId(l.videoUrl);
  const features = l.features ?? [];

  const barPhone = l.agent?.phone || l.contactPhone;
  const barWhatsapp = l.agent?.whatsapp || l.contactPhone;
  const isReservable = l.listingKind === "furnished" || l.listingKind === "event";

  return (
    <div className="container-page py-8 pb-24 lg:pb-8">
      <Link href={`/annonces?transaction=${l.transaction}`} className="text-sm font-semibold text-muted hover:text-ink">
        ← Retour aux annonces
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-ink/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {l.listingKind === "furnished" ? "Meublé" : l.listingKind === "event" ? "Événementiel" : TX_LABEL[l.transaction] ?? l.transaction}
        </span>
        <span className="chip">{TYPE_LABEL[l.propertyType] ?? "Bien"}</span>
      </div>
      <h1 className="mt-2 font-display text-2xl font-extrabold text-ink sm:text-3xl">{l.title}</h1>
      <p className="mt-1 flex items-center gap-1 text-muted">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        {zone}
      </p>

      <div className="mt-6">
        <PhotoGrid photos={l.photos} alt={l.title} />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {/* Caractéristiques */}
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {specs.map((s) => (
              <Spec key={s.label} icon={s.icon} label={s.label} value={s.value} />
            ))}
          </section>

          {l.description ? (
            <section>
              <h2 className="font-display text-lg font-bold text-ink">Description</h2>
              <p className="mt-2 whitespace-pre-line text-slate-600">{l.description}</p>
            </section>
          ) : null}

          {features.length > 0 ? (
            <section>
              <h2 className="font-display text-lg font-bold text-ink">Équipements</h2>
              <div className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                {features.map((f) => (
                  <span key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    <svg className="shrink-0 text-accent-600" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <path d="m5 12 4 4 10-10" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {f}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          {ytId ? (
            <section>
              <h2 className="mb-2 font-display text-lg font-bold text-ink">Vidéo</h2>
              <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-black">
                <iframe
                  title="Vidéo du bien"
                  src={`https://www.youtube.com/embed/${ytId}`}
                  loading="lazy"
                  allowFullScreen
                  className="h-full w-full"
                  style={{ border: 0 }}
                />
              </div>
            </section>
          ) : null}

          {l.latitude != null && l.longitude != null ? (
            <section>
              <h2 className="mb-2 font-display text-lg font-bold text-ink">Localisation</h2>
              <LocationMap lat={l.latitude} lng={l.longitude} label={zone} />
            </section>
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
