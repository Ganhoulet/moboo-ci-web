import { getSiteSettings } from "@/lib/settings";
import { SiteMap } from "./site-map";

/**
 * Carte de localisation d'une fiche (système choisi dans le back-office →
 * Cartes). On montre la zone : réservables = cercle approximatif.
 */
export async function LocationMap({
  lat,
  lng,
  label,
  approximate = false,
  note = "Localisation approximative — l'adresse exacte est communiquée par l'annonceur.",
}: {
  lat: number;
  lng: number;
  label?: string;
  /** Réservables : zone (cercle) sans marqueur précis. */
  approximate?: boolean;
  note?: string;
}) {
  const { maps } = await getSiteSettings();
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <SiteMap settings={maps} markers={[{ id: "here", lat, lng, title: label }]} center={{ lat, lng }} zoom={Math.min(maps.maxZoom, Math.max(maps.defaultZoom, 14))} circle={approximate} className="h-72 w-full" />
      <div className="flex items-center gap-1.5 px-4 py-2 text-xs text-muted">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        {note}
      </div>
    </div>
  );
}
