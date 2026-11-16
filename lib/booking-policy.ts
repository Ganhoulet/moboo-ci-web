import type { SiteSettings } from "./settings";

type Disputes = SiteSettings["disputes"];

/** Conditions d'annulation et de non-présentation, telles que réglées dans le back-office (affichées avant le paiement). */
export function cancellationPolicy(d: Pick<Disputes, "freeCancelDays" | "noShowRefundPercent">) {
  const days = Math.max(0, Math.round(Number(d.freeCancelDays) || 0));
  const pct = Math.min(100, Math.max(0, Math.round(Number(d.noShowRefundPercent) || 0)));
  return {
    cancel: days > 0
      ? `Annulation gratuite jusqu’à ${days} jour${days > 1 ? "s" : ""} avant l’arrivée : l’acompte vous est remboursé. Ensuite, l’acompte n’est plus remboursé.`
      : "En cas d’annulation après le paiement, l’acompte n’est pas remboursé.",
    noShow: pct > 0
      ? `Si vous ne vous présentez pas, ${pct} % de l’acompte vous sont remboursés.`
      : "Si vous ne vous présentez pas, l’acompte n’est pas remboursé.",
  };
}
