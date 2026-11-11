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
  color,
}: {
  price: number | null;
  unit?: string;
  prefix?: string;
  cta?: string;
  /** Couleur du bouton (back-office → Formulaire de réservation). */
  color?: string;
}) {
  return (
    <>
    {/* La barre ne cache pas le bas de page (pied de page, mentions). */}
    <style>{`@media (max-width: 1023px) { body { padding-bottom: 5.5rem; } }`}</style>
    <div className="fixed inset-x-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur lg:hidden" style={{ bottom: "var(--mobile-tabbar-h, 0px)" }}>
      <div
        className="container-page flex items-center gap-3 py-4"
        style={{ paddingBottom: "calc(1rem + var(--mobile-bar-safe, env(safe-area-inset-bottom)))" }}
      >
        <div className="min-w-0 flex-1">
          {price ? (
            <p className="truncate text-lg font-extrabold text-ink">
              {prefix ? <span className="text-xs font-medium text-muted">{prefix} </span> : null}
              {formatXOF(price)}
              {unit ? <span className="text-xs font-medium text-muted"> {unit}</span> : null}
            </p>
          ) : (
            <p className="text-sm font-semibold text-ink">Prix sur demande</p>
          )}
          <p className="text-[13px] text-muted">Aucun débit avant confirmation</p>
        </div>
        <a href="#reserver" style={color && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(color) ? { backgroundColor: color } : undefined} className="btn-primary h-12 shrink-0 rounded-xl bg-accent-600 px-7 text-base hover:bg-accent-700">
          {cta}
        </a>
      </div>
    </div>
    </>
  );
}
