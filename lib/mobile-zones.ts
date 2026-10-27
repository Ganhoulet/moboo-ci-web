/**
 * Zones du site sur téléphone : le back-office choisit où s'affichent l'en-tête façon
 * application (☰ + recherche) et le menu du bas (En-têtes → Téléphone).
 * Même liste que le moteur (settings.schema.ts, MOBILE_ZONES).
 */
export const MOBILE_ZONES = ["home", "listing", "results", "pros", "account", "publish", "content"] as const;
export type MobileZone = (typeof MOBILE_ZONES)[number];

const RULES: [RegExp, MobileZone][] = [
  [/^\/$/, "home"],
  [/^\/(annonce|residence|espace)\//, "listing"],
  [/^\/(annonces|marketplace|prix-immobilier)(\/|$)/, "results"],
  [/^\/(pro|agent|agents-immobiliers|professionnels|services)(\/|$)/, "pros"],
  [/^\/(mon-espace|compte|connexion|inscription|favoris|reserver)(\/|$)/, "account"],
  [/^\/(publier|confier-mon-bien)(\/|$)/, "publish"],
];

export function zoneOf(path: string): MobileZone {
  for (const [re, z] of RULES) if (re.test(path)) return z;
  return "content";
}

/** Zones cochées (repli : toutes sauf les fiches d'annonce, qui ont leur propre barre). */
export function zonesFrom(v: unknown, fallback: MobileZone[]): MobileZone[] {
  return Array.isArray(v) ? (v.filter((z) => (MOBILE_ZONES as readonly string[]).includes(z)) as MobileZone[]) : fallback;
}
