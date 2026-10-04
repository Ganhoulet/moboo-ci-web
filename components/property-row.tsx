import Link from "next/link";
import { formatXOF } from "@/lib/api";
import { TRANSACTION_BADGE, type Property } from "@/lib/property";
import { FavoriteButton } from "./favorite-button";
import { imgProps } from "@/lib/img";

/** Annonce en ligne (présentation « Liste » de la page des résultats). */
export function PropertyRow({ p }: { p: Property }) {
  return (
    <Link href={p.href} className="group block">
      <article className="flex overflow-hidden rounded-2xl bg-white shadow-card transition hover:shadow-card-hover">
        <div className="relative w-36 shrink-0 overflow-hidden bg-slate-100 sm:w-60">
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img {...imgProps(p.image, { width: 320, sizes: "(min-width: 640px) 16rem, 100vw" })} alt={p.title} loading="lazy" decoding="async" className="h-full min-h-[8.5rem] w-full object-cover transition duration-300 group-hover:scale-105" />
          ) : <div className="h-full min-h-[8.5rem] bg-gradient-to-br from-brand-100 to-slate-100" />}
          <FavoriteButton property={p} className="absolute left-2 top-2" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-ink/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={p.status?.color ? { background: p.status.color } : undefined}>
              {p.status?.label ?? TRANSACTION_BADGE[p.transaction]}
            </span>
            {p.featured ? <span className="rounded-md bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white">★ En vedette</span> : null}
            {p.labels?.slice(0, 2).map((l) => <span key={l.slug} className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase text-white" style={{ background: l.color ?? "#334155" }}>{l.label}</span>)}
          </div>
          <h3 className="mt-1.5 line-clamp-2 font-bold text-ink group-hover:text-brand-800">{p.title}</h3>
          <p className="mt-0.5 truncate text-sm text-muted">{p.zone}</p>
          <div className="mt-auto flex flex-wrap items-end justify-between gap-2 pt-2">
            <p className="text-lg font-extrabold text-brand-800">{formatXOF(p.price)}{p.priceLabel ? <span className="text-sm font-medium text-muted"> {p.priceLabel}</span> : null}</p>
            {p.meta ? <span className="chip">{p.meta}</span> : null}
          </div>
        </div>
      </article>
    </Link>
  );
}
