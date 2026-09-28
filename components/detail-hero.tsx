import type { Property } from "@/lib/property";
import { MobileGallery, PhotoGrid } from "@/components/photo-grid";
import { DetailActions } from "@/components/detail-actions";
import { Breadcrumbs, PinIcon } from "@/components/detail";

export type HeroPerson = {
  /** « Hôte », « Agent », « Agence », « Annonceur » */
  role: string;
  name: string;
  photoUrl?: string | null;
  sub?: string | null;
};

/**
 * En-tête des fiches, façon Airbnb :
 * - mobile : galerie plein écran à faire défiler (vidéo en premier), actions
 *   posées sur la photo, puis une fiche arrondie qui remonte sur l'image avec
 *   titre centré, lieu, résumé, prix et l'hôte / l'agent ;
 * - desktop : fil d'Ariane, titre + actions, grille de photos.
 */
export function DetailHero({
  photos,
  videoUrl,
  backHref,
  breadcrumbs,
  badges,
  title,
  zone,
  summary = [],
  price,
  meta,
  person,
  property,
}: {
  photos: string[];
  videoUrl?: string | null;
  backHref: string;
  breadcrumbs: { label: string; href?: string }[];
  badges?: React.ReactNode;
  title: string;
  zone: string;
  summary?: (string | null | undefined | false)[];
  price?: React.ReactNode;
  meta?: React.ReactNode;
  person?: HeroPerson | null;
  property: Property;
}) {
  const facts = summary.filter(Boolean) as string[];

  return (
    // Mobile : pleine largeur, collé sous l'en-tête (annule le padding de la page).
    <div className="-mx-4 -mt-8 flex flex-col sm:-mx-6 lg:mx-0 lg:mt-0">
      <div className="hidden lg:order-1 lg:block">
        <Breadcrumbs items={breadcrumbs} />
      </div>

      {/* Galerie */}
      <div className="order-1 lg:order-3 lg:mt-6">
        <div className="lg:hidden">
          <MobileGallery photos={photos} videoUrl={videoUrl} alt={title} backHref={backHref} property={property} />
        </div>
        <div className="hidden lg:block">
          <PhotoGrid photos={photos} videoUrl={videoUrl} alt={title} />
        </div>
      </div>

      {/* Titre, lieu, résumé, prix — fiche arrondie qui chevauche la photo sur mobile */}
      <div className="relative z-10 order-2 -mt-6 rounded-t-3xl bg-slate-50 px-4 pt-6 sm:px-6 lg:mt-4 lg:rounded-none lg:bg-transparent lg:px-0 lg:pt-0">
        {/* Desktop : titre + localisation seulement ; le résumé passe sous les
            photos (DetailIntro), l'hôte et le prix dans la colonne de droite. */}
        <div className="text-center lg:flex lg:items-end lg:justify-between lg:gap-6 lg:text-left">
          <div className="min-w-0">
            {badges ? <div className="flex flex-wrap items-center justify-center gap-2 lg:hidden">{badges}</div> : null}
            <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight text-ink sm:text-3xl lg:mt-3">{title}</h1>
            <p className="mt-2 flex items-center justify-center gap-1 text-slate-600 lg:justify-start">
              <span className="hidden lg:inline">{PinIcon}</span>
              {zone}
            </p>
            {facts.length ? (
              <p className="mt-1 text-sm text-slate-600 lg:hidden">{facts.join(" · ")}</p>
            ) : null}
            {price ? <div className="mt-2 lg:hidden">{price}</div> : null}
            {meta ? <div className="mt-1 lg:hidden">{meta}</div> : null}
          </div>
          <div className="hidden shrink-0 lg:block">
            <DetailActions property={property} />
          </div>
        </div>

        {person ? <PersonRow person={person} className="mt-5 border-y border-slate-200 py-4 lg:hidden" /> : null}
      </div>
    </div>
  );
}

/** Hôte / agent : photo (ou initiale) + nom + ligne secondaire. */
export function PersonRow({ person, className = "" }: { person: HeroPerson; className?: string }) {
  return (
    <div className={"flex items-center gap-3 " + className}>
      {person.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.photoUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-800 font-display text-lg font-bold text-white">
          {person.name.charAt(0).toUpperCase()}
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate font-semibold text-ink">
          {person.role} : {person.name}
        </p>
        {person.sub ? <p className="truncate text-sm text-muted">{person.sub}</p> : null}
      </div>
    </div>
  );
}

/** Desktop : hôte / agent affiché juste au-dessus de la carte de réservation. */
export function AsidePerson({ person }: { person?: HeroPerson | null }) {
  if (!person) return null;
  return <PersonRow person={person} className="mb-4 hidden rounded-2xl border border-slate-200 bg-white px-4 py-3 lg:flex" />;
}

/**
 * Desktop : première phrase sous les photos (type · capacité · surface…),
 * façon « Logement entier : villa · 6 voyageurs » d'Airbnb, + réf. et date.
 */
export function DetailIntro({ summary = [], meta }: { summary?: (string | null | undefined | false)[]; meta?: React.ReactNode }) {
  const facts = summary.filter(Boolean) as string[];
  if (!facts.length && !meta) return null;
  return (
    <div className="hidden border-b border-slate-200 pb-6 lg:block">
      {facts.length ? <p className="font-display text-xl font-bold text-ink">{facts.join(" · ")}</p> : null}
      {meta ? <div className="mt-1">{meta}</div> : null}
    </div>
  );
}
