import Link from "next/link";
import type { Espace } from "@/lib/types";
import { formatXOF } from "@/lib/api";

const TYPE_LABEL: Record<string, string> = {
  salle_mariage: "Salle de mariage",
  rooftop: "Rooftop",
  villa: "Villa",
  jardin: "Jardin",
  corporate: "Corporate",
  club: "Club",
  conference: "Conférence",
  culturel: "Culturel",
  maquis: "Maquis",
};

export function EspaceCard({ e }: { e: Espace }) {
  const photo = e.photoPrincipaleUrl;
  const zone = [e.quartier, e.commune].filter(Boolean).join(", ") || "Côte d'Ivoire";
  const prixMin = e.tarifs?.map((t) => t.prix ?? 0).filter((p) => p > 0);
  const aPartir = prixMin && prixMin.length ? Math.min(...prixMin) : null;
  return (
    <Link href={`/espace/${e.slug || e.id}`} className="group block">
      <article className="overflow-hidden rounded-2xl bg-white shadow-card transition duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
        <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-accent-100 to-accent-50">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photo}
              alt={e.nom}
              loading="lazy"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-accent-400">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 20V8l8-4 8 4v12" strokeLinejoin="round" />
                <path d="M4 20h16M9 20v-5h6v5" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-ink shadow-sm">
            {TYPE_LABEL[e.type] ?? "Espace"}
          </span>
        </div>
        <div className="p-4">
          <h3 className="line-clamp-1 font-semibold text-ink">{e.nom}</h3>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="2.5" />
            </svg>
            {zone}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="chip">
              {e.capaciteMin}–{e.capaciteMax} pers.
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            {aPartir ? (
              <>
                <span className="text-sm text-muted">dès</span>
                <span className="text-lg font-bold text-ink">{formatXOF(aPartir)}</span>
              </>
            ) : (
              <span className="text-sm font-medium text-muted">Sur demande</span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
