import { formatXOF } from "@/lib/api";

/**
 * Barre « Réserver » collée en bas d'écran sur mobile (fiches réservables,
 * façon Airbnb) : prix + bouton qui descend jusqu'au calendrier (#reserver).
 */
export function MobileBookBar({
  price,
  unit,
  prefix,
  cta = "Réserver",
}: {
  price: number | null;
  unit?: string;
  prefix?: string;
  cta?: string;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden">
      <div
        className="container-page flex items-center gap-3 py-3"
        style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
      >
        <div className="min-w-0 flex-1">
          {price ? (
            <p className="truncate text-base font-extrabold text-ink">
              {prefix ? <span className="text-xs font-medium text-muted">{prefix} </span> : null}
              {formatXOF(price)}
              {unit ? <span className="text-xs font-medium text-muted"> {unit}</span> : null}
            </p>
          ) : (
            <p className="text-sm font-semibold text-ink">Prix sur demande</p>
          )}
          <p className="text-xs text-muted">Aucun débit avant confirmation</p>
        </div>
        <a href="#reserver" className="btn-primary shrink-0 bg-accent-600 px-5 hover:bg-accent-700">
          {cta}
        </a>
      </div>
    </div>
  );
}
