import Link from "next/link";
import { formatXOF } from "@/lib/api";
import { TRANSACTION_BADGE, type Property } from "@/lib/property";

export function PropertyCard({ p }: { p: Property }) {
  return (
    <Link href={p.href} className="group block">
      <article className="overflow-hidden rounded-2xl bg-white shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-hover">
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.image}
              alt={p.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-brand-100 to-slate-100 text-brand-300">
              <svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
                <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}

          {/* Badge de transaction (façon moboo.ci) */}
          <span className="absolute right-3 top-3 rounded-md bg-ink/75 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-white backdrop-blur-sm">
            {TRANSACTION_BADGE[p.transaction]}
          </span>

          {/* Prix en overlay bas-gauche */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/75 via-ink/20 to-transparent p-3">
            <div className="flex items-end justify-between gap-2">
              <span className="text-lg font-extrabold text-white drop-shadow-sm">
                {formatXOF(p.price)}
                {p.priceLabel ? (
                  <span className="ml-0.5 text-sm font-medium text-white/90">{p.priceLabel}</span>
                ) : null}
              </span>
              {p.reservable ? (
                <span className="shrink-0 rounded-full bg-accent-600 px-2.5 py-1 text-[11px] font-bold text-white shadow">
                  Réservable
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="p-4">
          <h3 className="line-clamp-1 font-bold text-ink">{p.title}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {p.zone}
          </p>
          {p.meta ? <span className="chip mt-2">{p.meta}</span> : null}
        </div>
      </article>
    </Link>
  );
}
