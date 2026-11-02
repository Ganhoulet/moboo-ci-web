"use client";

import Link from "next/link";
import type { ServiceAdCardData } from "@/lib/service-ads";

/**
 * Carte « Sponsorisé » d'un prestataire (déménagement, nettoyage…) glissée entre les
 * annonces. Même gabarit qu'une carte d'annonce ; le clic est compté en arrière-plan.
 */
export function ServiceAdCard({ ad, row = false }: { ad: ServiceAdCardData; row?: boolean }) {
  const href = `/prestataires/${ad.provider.slug}?ad=${ad.id}`;
  const track = () => {
    try {
      const body = JSON.stringify({ id: ad.id });
      if (!navigator.sendBeacon?.("/api/service-ads/click", new Blob([body], { type: "application/json" }))) {
        void fetch("/api/service-ads/click", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
      }
    } catch { /* suivi facultatif */ }
  };
  return (
    <Link href={href} onClick={track} aria-label={`${ad.title} — ${ad.provider.name} (sponsorisé)`}
      className={"group block overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-amber-200 transition hover:shadow-lg " + (row ? "sm:flex" : "")}>
      <div className={"relative bg-slate-100 " + (row ? "aspect-[16/10] sm:aspect-auto sm:w-72 sm:shrink-0" : "aspect-[16/10]")}>
        {ad.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={ad.imageUrl} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-[1.02]" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-50 to-amber-50 text-4xl" aria-hidden="true">🛠️</div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-800 shadow">Sponsorisé</span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center gap-2">
          {ad.provider.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ad.provider.logoUrl} alt="" className="h-8 w-8 rounded-full object-cover ring-1 ring-slate-200" />
          ) : (
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand-800 text-xs font-bold text-white">{ad.provider.name.charAt(0)}</span>
          )}
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-sm font-bold text-ink">{ad.provider.name}</span>
            <span className="block truncate text-xs text-muted">{ad.provider.category}</span>
          </span>
        </div>
        <p className="mt-3 font-display text-base font-extrabold leading-snug text-ink">{ad.title}</p>
        {ad.text ? <p className="mt-1 line-clamp-2 text-sm text-muted">{ad.text}</p> : null}
        <span className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-brand-800 px-4 py-2.5 text-sm font-bold text-white group-hover:bg-brand-900">{ad.ctaLabel}</span>
      </div>
    </Link>
  );
}
