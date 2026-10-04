import Link from "next/link";
import { formatXOF } from "@/lib/api";
import { TRANSACTION_BADGE, type Property } from "@/lib/property";
import { FavoriteButton } from "../favorite-button";
import { imgProps } from "@/lib/img";

/** Carte d'annonce épurée (style Airbnb) : photo arrondie, cœur, texte dessous. */
export function PropertyTile({ p, className = "" }: { p: Property; className?: string }) {
  return (
    <div className={"group relative " + className}>
      <Link href={p.href} className="block">
        <div className="relative aspect-[20/19] overflow-hidden rounded-2xl bg-slate-100">
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img {...imgProps(p.image, { width: 480, sizes: "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 85vw" })} alt={p.title} loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <div className="grid h-full place-items-center bg-gradient-to-br from-brand-50 to-slate-100 text-brand-300">
              <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </div>
          )}
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {p.featured ? <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold text-ink shadow-sm">★ Coup de cœur</span> : null}
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-ink shadow-sm">{p.status?.label ?? TRANSACTION_BADGE[p.transaction]}</span>
          </div>
        </div>
        <div className="mt-2.5 space-y-0.5">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-1 font-semibold text-ink">{p.zone}</p>
            {p.reservable ? <span className="shrink-0 text-xs font-semibold text-accent-700">Réservable</span> : null}
          </div>
          <p className="line-clamp-1 text-sm text-muted">{p.title}</p>
          {p.meta ? <p className="text-sm text-muted">{p.meta}</p> : null}
          <p className="pt-0.5 text-[15px] text-ink"><span className="font-semibold">{formatXOF(p.price)}</span>{p.priceLabel ? <span className="text-muted"> {p.priceLabel}</span> : null}</p>
        </div>
      </Link>
      <FavoriteButton property={p} className="absolute right-3 top-3" />
    </div>
  );
}
