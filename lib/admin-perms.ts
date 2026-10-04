// Permissions du back-office (miroir de l'API : src/modules/site-admin/permissions.ts).
// L'API reste la seule garde : ce fichier sert à filtrer le menu et à afficher
// « Accès refusé » au lieu d'une page vide.

export type Permission =
  | "users.view" | "users.manage" | "roles" | "audit" | "moderation" | "listings" | "realestate"
  | "verifications" | "billing" | "disputes" | "analytics" | "marketing" | "seo" | "pages" | "app" | "settings";

/** Permission(s) exigée(s) par chaque rubrique (préfixe d'adresse ; la plus précise gagne). */
const RULES: [string, Permission[] | "any" | "super"][] = [
  ["/admin/securite", "any"],
  ["/admin/utilisateurs", ["users.view", "users.manage"]],
  ["/admin/roles", ["roles"]],
  ["/admin/administrateurs", ["roles"]],
  ["/admin/journal", ["audit"]],
  ["/admin/moderation/reglages", ["moderation"]],
  ["/admin/moderation", ["moderation"]],
  ["/admin/immobilier/nouvelle", ["listings"]],
  ["/admin/immobilier/listes", ["realestate"]],
  ["/admin/immobilier/equipe", ["realestate", "users.view"]],
  ["/admin/immobilier/partenaires", ["realestate"]],
  ["/admin/immobilier/avis", ["realestate"]],
  ["/admin/immobilier/forfaits", ["billing"]],
  ["/admin/immobilier/factures", ["billing"]],
  ["/admin/immobilier", ["listings", "moderation"]],
  ["/admin/verifications", ["verifications"]],
  ["/admin/application/reglages", ["app"]],
  ["/admin/application", ["app"]],
  ["/admin/marketing", ["marketing"]],
  ["/admin/seo", ["seo"]],
  ["/admin/accueil", ["pages"]],
  ["/admin/reglages", ["settings"]],
  ["/admin/statistiques", ["analytics"]],
  ["/admin/reservations", ["disputes"]],
  ["/admin/litiges/reglages", ["disputes"]],
  ["/admin/litiges", ["disputes"]],
  ["/admin/sante", ["settings"]],
  ["/admin", "any"],
];

export function requiredFor(path: string): Permission[] | "any" | "super" {
  const clean = path.split("?")[0];
  const rule = RULES.find(([prefix]) => clean === prefix || clean.startsWith(prefix + "/"));
  return rule ? rule[1] : "super";
}

export function canAccess(perms: string[] | undefined, path: string): boolean {
  const need = requiredFor(path);
  if (need === "any") return true;
  const p = perms ?? [];
  if (need === "super") return p.includes("roles") && p.includes("settings");
  return need.some((x) => p.includes(x));
}

export const can = (perms: string[] | undefined, ...need: Permission[]) => need.some((x) => (perms ?? []).includes(x));
