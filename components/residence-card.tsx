import Link from "next/link";
import type { Residence } from "@/lib/types";
import { formatXOF } from "@/lib/api";

export function ResidenceCard({ r }: { r: Residence }) {
  const photo = r.photos?.[0];
  const zone = [r.commune, r.city].filter(Boolean).join(", ") || "Côte d'Ivoire";
  return (
    <Link href={`/residence/${r.id}`} className="group block">
      <article className="overflow-hidden rounded-2xl bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand-100 to-brand-50">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={r.name}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-brand-300">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9.5 21v-6h5v6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-ink shadow-sm">
            Meublé
          </span>
        </div>
        <div className="p-4">
          <h3 className="line-clamp-1 font-semibold text-ink">{r.name}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {zone}
          </p>
          {r.amenities?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {r.amenities.slice(0, 3).map((a) => (
                <span key={a} className="chip">
                  {a}
                </span>
              ))}
            </div>
          ) : null}
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-lg font-bold text-ink">{formatXOF(r.minNightlyPrice)}</span>
            <span className="text-sm text-muted">/ nuit</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
