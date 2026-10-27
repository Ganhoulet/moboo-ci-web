/**
 * Numéro du client d'une réservation (même règle que le moteur, common/util/phone.util.ts) :
 * 10 chiffres pour la Côte d'Ivoire, avec ou sans 225 ; numéro étranger avec son indicatif.
 */
export function guestPhoneOk(raw: string): boolean {
  const s = raw.trim();
  let d = s.replace(/[^0-9]/g, "");
  const intl = s.startsWith("+") || d.startsWith("00");
  if (d.startsWith("00")) d = d.slice(2);
  if (intl && !d.startsWith("225")) return d.length >= 8 && d.length <= 15;
  if (d.startsWith("225") && d.length === 13) d = d.slice(3);
  return /^(0[157]|2[157])\d{8}$/.test(d);
}

export const GUEST_PHONE_ERROR =
  "Numéro de téléphone invalide : 10 chiffres pour la Côte d’Ivoire (ex. 07 08 09 10 11), ou le numéro complet avec l’indicatif du pays (ex. +33 6 12 34 56 78).";
