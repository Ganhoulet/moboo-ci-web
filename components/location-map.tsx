/**
 * Carte de localisation (approximative) via OpenStreetMap — sans dépendance ni
 * clé API. On montre la zone, pas l'adresse exacte : un léger décalage flou.
 */
export function LocationMap({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label?: string;
}) {
  const d = 0.008; // ~800 m de marge : zone, pas point exact
  const bbox = [lng - d, lat - d, lng + d, lat + d].join(",");
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100">
      <iframe
        title={label ? `Localisation — ${label}` : "Localisation"}
        src={src}
        loading="lazy"
        className="h-64 w-full"
        style={{ border: 0 }}
      />
      <div className="flex items-center gap-1.5 px-4 py-2 text-xs text-muted">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" strokeLinejoin="round" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        Localisation approximative — l'adresse exacte est communiquée par l'annonceur.
      </div>
    </div>
  );
}
