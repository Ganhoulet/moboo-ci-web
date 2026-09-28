/**
 * Types de compte Moboo.ci — reprise des rôles de l'appli (Houzez) :
 * houzez_buyer → particulier, houzez_seller → proprietaire, houzez_agent → agent,
 * houzez_agency → entreprise, houzez_owner (« Établissement ») → etablissement.
 * Partagé par l'inscription par étapes et l'espace compte.
 */
export type AccountType = "particulier" | "proprietaire" | "agent" | "entreprise" | "etablissement";

export interface Choice {
  key: string;
  label: string;
  hint?: string;
}

export interface AccountTypeDef {
  key: AccountType;
  title: string;
  tagline: string;
  /** Question de l'étape « Précisez ». */
  question: string;
  subtypes: Choice[];
  /** Nom d'entreprise / d'établissement demandé à l'étape 2. */
  company?: { label: string; placeholder: string; required: boolean };
  /** Pour les établissements : propriétaire ou gérant. */
  roles?: Choice[];
  emailRequired: boolean;
  color: string; // classes de la pastille d'icône
}

export const ACCOUNT_TYPES: AccountTypeDef[] = [
  {
    key: "particulier",
    title: "Je cherche un bien",
    tagline: "Louer, acheter ou réserver un séjour",
    question: "Que recherchez-vous ?",
    subtypes: [
      { key: "louer", label: "Louer un logement" },
      { key: "acheter", label: "Acheter un bien" },
      { key: "sejour", label: "Réserver un meublé ou un espace" },
    ],
    emailRequired: false,
    color: "from-sky-400 to-brand-600",
  },
  {
    key: "proprietaire",
    title: "Propriétaire",
    tagline: "Je vends ou je loue mon bien",
    question: "Que souhaitez-vous faire de votre bien ?",
    subtypes: [
      { key: "vente", label: "Le vendre" },
      { key: "location", label: "Le mettre en location" },
      { key: "les_deux", label: "Les deux" },
    ],
    emailRequired: false,
    color: "from-emerald-400 to-emerald-600",
  },
  {
    key: "agent",
    title: "Agent immobilier",
    tagline: "Agent indépendant",
    question: "Votre activité",
    subtypes: [],
    company: { label: "Nom commercial (optionnel)", placeholder: "Ex. Koné Immobilier", required: false },
    emailRequired: true,
    color: "from-violet-400 to-violet-600",
  },
  {
    key: "entreprise",
    title: "Entreprise",
    tagline: "Agence immobilière, promoteur…",
    question: "Quel type d'entreprise ?",
    subtypes: [
      { key: "agence", label: "Agence immobilière" },
      { key: "promoteur", label: "Promoteur immobilier" },
      { key: "autre", label: "Autre entreprise", hint: "Syndic, gestionnaire, notaire…" },
    ],
    company: { label: "Raison sociale", placeholder: "Ex. Ivoire Habitat SARL", required: true },
    emailRequired: true,
    color: "from-accent-400 to-accent-600",
  },
  {
    key: "etablissement",
    title: "Hôte / Établissement",
    tagline: "Résidences meublées, salles et espaces événementiels",
    question: "Que proposez-vous ?",
    subtypes: [
      { key: "residences", label: "Résidences meublées" },
      { key: "espaces", label: "Salles & espaces événementiels" },
      { key: "les_deux", label: "Les deux" },
    ],
    roles: [
      { key: "proprietaire", label: "J'en suis propriétaire" },
      { key: "gerant", label: "J'en suis le gérant" },
    ],
    company: { label: "Nom de l'établissement (optionnel)", placeholder: "Ex. Résidence Les Palmiers", required: false },
    emailRequired: false,
    color: "from-rose-400 to-rose-600",
  },
];

export function accountTypeDef(key?: string | null): AccountTypeDef {
  return ACCOUNT_TYPES.find((t) => t.key === key) ?? ACCOUNT_TYPES[0];
}

/** « Entreprise · Promoteur immobilier » */
export function accountLabel(a: { accountType?: string | null; accountSubtype?: string | null; accountRole?: string | null }) {
  const def = accountTypeDef(a.accountType);
  const sub = def.subtypes.find((s) => s.key === a.accountSubtype)?.label;
  const role = def.roles?.find((r) => r.key === a.accountRole)?.label.replace(/^J'en suis (le )?/, "");
  const main = def.key === "particulier" ? "Particulier" : def.title;
  return [main, sub, role].filter(Boolean).join(" · ");
}

/** Comptes qui publient des annonces « contact direct » (vente / location). */
export function isPublisher(type?: string | null) {
  return type === "proprietaire" || type === "agent" || type === "entreprise";
}

export const COMMUNES = [
  "Cocody", "Marcory", "Plateau", "Yopougon", "Koumassi", "Treichville", "Port-Bouët",
  "Abobo", "Adjamé", "Attécoubé", "Bingerville", "Anyama", "Songon", "Grand-Bassam",
  "Assinie", "Yamoussoukro", "Bouaké", "San-Pédro",
];

/** Applis métier gratuites : les réservables se publient depuis elles (feuille de route §4). */
export const MOBOO_APPS = {
  resi: {
    name: "Moboo Resi",
    what: "résidences meublées",
    play: "https://play.google.com/store/apps/details?id=ci.moboo.moboo_resi_manager",
    page: "https://resi.moboo.ci/telecharger",
  },
  event: {
    name: "Moboo Event",
    what: "espaces événementiels et coworkings",
    play: "https://play.google.com/store/apps/details?id=ci.moboo.moboo_event_manager",
    page: "https://event.moboo.ci/telecharger",
  },
};

/** Carte de bienvenue affichée sur l'espace compte juste après l'inscription. */
export const WELCOME_NEXT: Record<AccountType, { text: string; cta?: { href: string; label: string } }> = {
  particulier: {
    text: "Enregistrez vos biens favoris et créez des alertes : on vous prévient dès qu'un bien vous correspond.",
    cta: { href: "/annonces", label: "Explorer les annonces" },
  },
  proprietaire: {
    text: "Publiez votre premier bien en quelques minutes : les intéressés vous contactent directement, sans commission.",
    cta: { href: "/publier", label: "Publier mon bien" },
  },
  agent: {
    text: "Publiez vos mandats et suivez vues et demandes de vos clients depuis votre espace agent.",
    cta: { href: "/publier", label: "Publier une annonce" },
  },
  entreprise: {
    text: "Publiez vos biens et programmes, suivez vues et demandes depuis votre espace entreprise.",
    cta: { href: "/publier", label: "Publier une annonce" },
  },
  etablissement: {
    text: "Téléchargez Moboo Resi ou Moboo Event ci-dessous pour publier vos logements et espaces : ils apparaîtront sur Moboo.ci.",
  },
};
