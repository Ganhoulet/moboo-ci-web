import Link from "next/link";
import { img } from "@/lib/img";
import { nightly, type StayCard } from "@/lib/stays";

/** Carte d'une résidence meublée avec les chiffres du soir (libres, prix, note vérifiée). */
export function StayCardView({ s }: { s: StayCard }) {
  const place = [s.quartier, s.commune].filter((x, i, a) => x && a.indexOf(x) === i).join(", ") || s.city;
  return (
    <Link href={s.href} className="group overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-ink">
      <div className="relative aspect-[4/3] bg-slate-100">
        {s.photo ? <img src={img(s.photo, 480)} alt={s.name} loading="lazy" className="h-full w-full object-cover" /> : null}
        {s.freeTonight ? (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white">
            {s.freeTonight} libre{s.freeTonight > 1 ? "s" : ""} ce soir
          </span>
        ) : null}
        {s.verified || s.generator ? (
          <span className="absolute bottom-3 left-3 flex flex-wrap gap-1.5">
            {s.verified ? <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold text-white">✓ Vérifié sur place</span> : null}
            {s.generator ? <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink">⚡ Groupe électrogène</span> : null}
          </span>
        ) : null}
        {s.distanceKm != null ? (
          <span className="absolute right-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink">à {String(s.distanceKm).replace(".", ",")} km</span>
        ) : null}
      </div>
      <div className="p-4">
        <p className="font-semibold text-ink group-hover:underline">{s.name}</p>
        <p className="mt-0.5 text-sm text-muted">{place}</p>
        {s.travel ? <p className="mt-0.5 text-xs text-muted" title="Estimation selon la distance, pas un itinéraire">≈ {s.travel.normal} min en voiture · {s.travel.rush} min aux heures de pointe</p> : null}
        <div className="mt-2 flex items-center justify-between gap-2 text-sm">
          <span>{s.fromPrice ? <>dès <strong className="text-ink">{nightly(s.fromPrice)}</strong> / nuit</> : <span className="text-muted">Prix sur demande</span>}</span>
          {s.rating && s.reviews ? (
            <span className="text-ink" title="Avis de séjours vérifiés (check-in réel)">★ {String(s.rating).replace(".", ",")} <span className="text-muted">({s.reviews})</span></span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
