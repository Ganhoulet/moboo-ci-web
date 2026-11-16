/** Tarifs dégressifs d'un logement (réglés dans Moboo Resi) : même règle que le moteur de réservation. */
export type PricingRule = { minNights: number; nightlyPrice: number };

/** Prix par nuit pour un séjour de `nights` nuits : palier le plus long atteint, s'il baisse le prix. */
export function nightlyFor(base: number, rules: PricingRule[] | null | undefined, nights: number) {
  let price = base;
  let from: number | null = null;
  for (const r of rules ?? []) {
    if (r.minNights >= 2 && nights >= r.minNights && r.nightlyPrice > 0 && r.nightlyPrice < base && (from == null || r.minNights > from)) {
      price = r.nightlyPrice; from = r.minNights;
    }
  }
  return { price, from };
}

/** « Dès 3 nuits : 13 000 F » pour chaque palier qui baisse le prix. */
export function rulesText(base: number, rules: PricingRule[] | null | undefined, format: (n: number) => string) {
  return (rules ?? []).filter((r) => r.nightlyPrice > 0 && r.nightlyPrice < base).map((r) => `dès ${r.minNights} nuits : ${format(r.nightlyPrice)} / nuit`);
}
