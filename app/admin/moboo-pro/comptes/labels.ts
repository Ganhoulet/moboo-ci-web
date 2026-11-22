export const ROLE_LABEL: Record<string, string> = {
  houzez_agency: "Agence", houzez_agent: "Agent", houzez_owner: "Propriétaire", houzez_buyer: "Locataire / acheteur",
  subscriber: "Abonné", houzez_tenant: "Locataire", administrator: "Administrateur", apporteur_affaires: "Apporteur", moboo_tenant: "Locataire",
};
export const PLAN_LABEL: Record<string, string> = { starter: "Gratuit", pro: "Pro", business: "Business", enterprise: "Entreprise" };

/** Mêmes listes que l'API (SETTABLE_ROLES et PLAN_KEYS de pro-super / pro-plans). */
export const SETTABLE_ROLES = ["houzez_agency", "houzez_agent", "houzez_owner", "houzez_buyer", "subscriber"];
export const PLANS = ["starter", "pro", "business", "enterprise"];
