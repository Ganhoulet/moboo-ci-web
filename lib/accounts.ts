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
export function accountLabel(a: { accountType?: string | null; accountSubtype?: string | null; accountRole?: string | null }, roleNames?: Record<string, string>) {
  const def = accountTypeDef(a.accountType);
  const sub = def.subtypes.find((s) => s.key === a.accountSubtype)?.label;
  const role = def.roles?.find((r) => r.key === a.accountRole)?.label.replace(/^J'en suis (le )?/, "");
  // Nom du rôle renommé dans le back-office (Connexion et inscription → Rôles).
  const main = roleNames?.[def.key] || (def.key === "particulier" ? "Particulier" : def.title);
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

/* ─── Espace compte (/espace) : menu et droits par type de compte ─────── */

export type DashKey =
  | "tableau" | "reservations" | "annonces" | "nouvelle" | "statistiques" | "demandes"
  | "messages" | "favoris" | "recherches" | "profil" | "forfait" | "publicite" | "factures" | "verification" | "api" | "infos" | "avis" | "pagepro" | "equipe" | "realisations";

export interface DashItem {
  key: DashKey;
  href: string;
  label: string;
  /** Types autorisés (reprise des droits du tableau de bord Houzez de moboo.ci). */
  types: AccountType[] | "all";
}

const PUB: AccountType[] = ["proprietaire", "agent", "entreprise"];

export const DASH_MENU: DashItem[] = [
  { key: "tableau", href: "/mon-espace", label: "Tableau de bord", types: "all" },
  { key: "annonces", href: "/mon-espace/annonces", label: "Mes annonces", types: PUB },
  { key: "nouvelle", href: "/mon-espace/annonces/nouvelle", label: "Publier une annonce", types: PUB },
  { key: "statistiques", href: "/mon-espace/statistiques", label: "Statistiques", types: PUB },
  { key: "demandes", href: "/mon-espace/demandes", label: "Demandes", types: PUB },
  { key: "pagepro", href: "/mon-espace/page-pro", label: "Ma page pro", types: PUB },
  { key: "equipe", href: "/mon-espace/equipe", label: "Mon équipe", types: ["entreprise"] },
  { key: "realisations", href: "/mon-espace/realisations", label: "Vendus et loués", types: PUB },
  { key: "avis", href: "/mon-espace/avis", label: "Avis clients", types: ["agent", "entreprise"] },
  { key: "reservations", href: "/mon-espace/reservations", label: "Mes réservations", types: "all" },
  { key: "messages", href: "/mon-espace/messages", label: "Messages", types: "all" },
  { key: "infos", href: "/mon-espace/infos", label: "Infos Moboo", types: "all" },
  { key: "favoris", href: "/mon-espace/favoris", label: "Favoris", types: "all" },
  { key: "recherches", href: "/mon-espace/recherches", label: "Recherches & alertes", types: "all" },
  { key: "forfait", href: "/mon-espace/forfait", label: "Mon forfait", types: PUB },
  { key: "publicite", href: "/mon-espace/publicite", label: "Publicité", types: PUB },
  { key: "factures", href: "/mon-espace/factures", label: "Factures", types: PUB },
  { key: "verification", href: "/mon-espace/verification", label: "Vérification", types: "all" },
  // Agences partenaires seulement (accès accordé par Moboo).
  { key: "api", href: "/mon-espace/api", label: "API & intégrations", types: ["agent", "entreprise"] },
  { key: "profil", href: "/mon-espace/profil", label: "Mon profil", types: "all" },
];

export function canAccess(type: string | null | undefined, key: DashKey): boolean {
  const item = DASH_MENU.find((i) => i.key === key);
  if (!item) return false;
  return item.types === "all" || item.types.includes((type || "particulier") as AccountType);
}

export function menuFor(type: string | null | undefined): DashItem[] {
  return DASH_MENU.filter((i) => canAccess(type, i.key));
}

/** Étapes du suivi des demandes (tableau « Demandes »). */
export const INQUIRY_STEPS = [
  { key: "new", label: "Nouvelles", color: "bg-sky-500" },
  { key: "contacted", label: "Contactées", color: "bg-violet-500" },
  { key: "visit", label: "Visite prévue", color: "bg-amber-500" },
  { key: "negotiation", label: "Négociation", color: "bg-accent-500" },
  { key: "won", label: "Conclues", color: "bg-emerald-500" },
  { key: "lost", label: "Perdues", color: "bg-slate-400" },
] as const;

/** Équipements proposés dans l'éditeur d'annonce (vente / location). */
export const LISTING_FEATURES = [
  "Climatisation", "Cuisine équipée", "Eau chaude", "Groupe électrogène", "Forage / château d'eau",
  "Parking", "Garage", "Gardiennage", "Caméras de surveillance", "Piscine", "Jardin",
  "Balcon / terrasse", "Ascenseur", "Salle de sport", "Wi-Fi / fibre", "Meublé",
  "Titre foncier (ACD)", "Lotissement approuvé", "Viabilisé (eau, électricité)", "Clôturé",
  "Accès goudronné", "Proche école", "Proche marché",
];

export const PROPERTY_TYPES = [
  { key: "appartement", label: "Appartement" },
  { key: "maison", label: "Maison" },
  { key: "villa", label: "Villa" },
  { key: "studio", label: "Studio" },
  { key: "terrain", label: "Terrain" },
  { key: "bureau", label: "Bureau" },
  { key: "magasin", label: "Magasin / local" },
  { key: "autre", label: "Autre" },
];
