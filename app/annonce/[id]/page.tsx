import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatXOF, getListing } from "@/lib/api";
import { similarListings } from "@/lib/property";
import { PhotoGrid } from "@/components/photo-grid";
import { LocationMap } from "@/components/location-map";
import { PropertyCard } from "@/components/property-card";

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

  return (
    <div className="container-page py-8">
      <Link href={`/annonces?transaction=${l.transaction}`} className="text-sm font-semibold text-muted hover:text-ink">
        ← Retour aux annonces
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="rounded-md bg-ink/80 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {TX_LABEL[l.transaction] ?? l.transaction}
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
            <Spec
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              label="Type" value={TYPE_LABEL[l.propertyType] ?? "Bien"}
            />
            <Spec
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7v10M21 7v10M3 12h18M7 7v5M17 7v5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              label="Chambres" value={l.bedrooms != null ? String(l.bedrooms) : "—"}
            />
            <Spec
              icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v16H4z M4 9h16M9 4v16" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              label="Surface" value={l.surface != null ? `${l.surface} m²` : "—"}
            />
          </section>

          {l.description ? (
            <section>
              <h2 className="font-display text-lg font-bold text-ink">Description</h2>
              <p className="mt-2 whitespace-pre-line text-slate-600">{l.description}</p>
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
    </div>
  );
}
