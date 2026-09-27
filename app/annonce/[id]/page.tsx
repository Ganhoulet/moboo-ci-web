import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatXOF, getListing } from "@/lib/api";
import { PhotoGrid } from "@/components/photo-grid";

export const revalidate = 60;

const TX_LABEL: Record<string, string> = { rent: "À louer", sale: "À vendre" };
const TYPE_LABEL: Record<string, string> = {
  appartement: "Appartement", maison: "Maison", villa: "Villa", studio: "Studio",
  terrain: "Terrain", bureau: "Bureau", magasin: "Magasin", autre: "Bien",
};

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const l = await getListing(params.id);
  return { title: l ? l.title : "Annonce" };
}

export default async function AnnoncePage({ params }: { params: { id: string } }) {
  const l = await getListing(params.id);
  if (!l) notFound();

  const zone = [l.quartier, l.commune, l.city].filter(Boolean).join(", ") || "Côte d'Ivoire";
  const specs: string[] = [];
  if (l.bedrooms) specs.push(`${l.bedrooms} chambre(s)`);
  if (l.surface) specs.push(`${l.surface} m²`);
  specs.push(TYPE_LABEL[l.propertyType] ?? "Bien");
  const phoneDigits = (l.contactPhone ?? "").replace(/[^0-9]/g, "");

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
          <section>
            <div className="flex flex-wrap gap-2">
              {specs.map((s) => (
                <span key={s} className="chip">{s}</span>
              ))}
            </div>
          </section>
          {l.description ? (
            <section>
              <h2 className="font-display text-lg font-bold text-ink">Description</h2>
              <p className="mt-2 whitespace-pre-line text-slate-600">{l.description}</p>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-extrabold text-ink">{formatXOF(l.price)}</span>
              {l.transaction === "rent" ? (
                <span className="text-sm text-muted">/ mois</span>
              ) : null}
            </div>
            {l.contactName ? (
              <p className="mt-3 text-sm text-slate-600">
                Contact : <span className="font-semibold text-ink">{l.contactName}</span>
              </p>
            ) : null}
            {phoneDigits ? (
              <div className="mt-3 grid gap-2">
                <a href={`tel:${l.contactPhone}`} className="btn-primary w-full bg-brand-800 hover:bg-brand-900">
                  Appeler
                </a>
                <a
                  href={`https://wa.me/${phoneDigits}`}
                  className="btn-ghost w-full"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp
                </a>
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
    </div>
  );
}
