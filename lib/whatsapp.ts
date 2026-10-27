/**
 * Liens WhatsApp du site (fiches, pages pro, annuaire, partenaires).
 * Numéro : le premier d'un champ qui peut en contenir deux (« 05 66 24 00 31 / 07 88 53 83 59 »),
 * au format international sans « + » (wa.me) ; Côte d'Ivoire : 225 + 10 chiffres.
 */
export function waNumber(raw: string | null | undefined): string | null {
  const parts = String(raw ?? "").split(/[\/,;|]|\bou\b|\bet\b/i).map((x) => x.trim()).filter(Boolean);
  for (const p of parts) {
    let d = p.replace(/[^0-9]/g, "");
    const intl = p.startsWith("+") || d.startsWith("00");
    if (d.startsWith("00")) d = d.slice(2);
    if (d.length < 8) continue;
    // Deux numéros ivoiriens collés (20 chiffres) : le premier.
    if (!intl && d.length === 20 && /^(0[157]|2[157])\d{8}/.test(d)) return `225${d.slice(0, 10)}`;
    if (!intl && /^(0[157]|2[157])\d{8}$/.test(d)) return `225${d}`;
    if (d.startsWith("225") && d.length === 13) return d;
    if (intl && d.length <= 15) return d;
    if (d.length === 8) return `225${d}`; // ancien format à 8 chiffres
    if (d.length >= 10 && d.length <= 15) return d;
  }
  return null;
}

/** Lien wa.me avec message prérempli, ou null sans numéro utilisable. */
export function waHref(raw: string | null | undefined, text?: string): string | null {
  const n = waNumber(raw);
  return n ? `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ""}` : null;
}

/** Message du back-office : {titre}, {lien}, {ref}, {prix}, {ville}, {type}, {prenom}, {nom}… (inconnues retirées). */
export function waMessage(template: string, vars: Record<string, string | number | null | undefined>): string {
  return String(template || "")
    .replace(/\{(\w+)\}/g, (_, k: string) => (vars[k] == null ? "" : String(vars[k])))
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+([,.)])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .trim();
}
