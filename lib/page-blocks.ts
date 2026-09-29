// Catalogue des blocs du constructeur de page d'accueil (module neutre : rendu
// serveur + éditeur du back-office). Inspiré des grands portails immobiliers
// (recherche à onglets, carrousels, quartiers, outils), présentation épurée.

export type FieldType = "text" | "textarea" | "html" | "image" | "url" | "number" | "bool" | "select" | "multi" | "list";

export interface BlockField {
  key: string;
  label: string;
  type: FieldType;
  help?: string;
  /** select / multi : valeurs fixes, ou « types » = types de bien du back-office. */
  options?: { value: string; label: string }[] | "types";
  min?: number;
  max?: number;
  /** list : champs d'un élément et libellé d'un élément. */
  fields?: BlockField[];
  itemLabel?: string;
}

export interface BlockDef {
  type: string;
  label: string;
  icon: string;
  description: string;
  fields: BlockField[];
  defaults: Record<string, unknown>;
}

export interface Section { id: string; type: string; enabled: boolean; props: Record<string, any> }
export interface PageContent { sections: Section[] }

export interface MenuLink { label: string; href: string }
export interface ChromeContent {
  menu: MenuLink[];
  footer: {
    about: string;
    columns: { title: string; links: { label: string; href: string }[] }[];
    showApps: boolean;
    playStoreUrl: string;
    appStoreUrl: string;
    bottomText: string;
  };
}

const HERO_TABS = [
  { value: "rent", label: "Louer" }, { value: "sale", label: "Acheter" }, { value: "furnished", label: "Meublés" },
  { value: "event", label: "Espaces" }, { value: "land", label: "Terrains" }, { value: "commercial", label: "Bureaux & commerces" },
];
const TX = [{ value: "", label: "Toutes" }, { value: "rent", label: "À louer" }, { value: "sale", label: "À vendre" }];
const SORT = [
  { value: "featured", label: "En vedette d’abord" }, { value: "newest", label: "Plus récentes" },
  { value: "price_asc", label: "Prix croissant" }, { value: "price_desc", label: "Prix décroissant" },
];
const LAYOUT = [{ value: "carousel", label: "Carrousel" }, { value: "grid", label: "Grille" }];
const BG = [{ value: "white", label: "Blanc" }, { value: "soft", label: "Gris très clair" }, { value: "brand", label: "Bleu Moboo" }];

const common: BlockField[] = [
  { key: "background", label: "Fond de la section", type: "select", options: BG },
];

export const BLOCKS: BlockDef[] = [
  {
    type: "hero", label: "Bandeau de recherche", icon: "🔎",
    description: "Grand titre, image de fond et recherche à onglets (Louer, Acheter, Meublés…).",
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "subtitle", label: "Sous-titre", type: "textarea" },
      { key: "images", label: "Images de fond (diaporama)", type: "list", itemLabel: "Image", fields: [{ key: "url", label: "Image", type: "image" }] },
      { key: "tabs", label: "Onglets de recherche", type: "multi", options: HERO_TABS },
      { key: "placeholder", label: "Texte du champ de recherche", type: "text" },
      { key: "chips", label: "Recherches rapides", type: "list", itemLabel: "Lien", fields: [{ key: "label", label: "Texte", type: "text" }, { key: "href", label: "Lien", type: "url" }] },
      { key: "showStats", label: "Afficher les chiffres (annonces, pros, villes)", type: "bool" },
    ],
    defaults: {
      title: "Trouvez le lieu qui vous ressemble",
      subtitle: "Location, vente, meublés et espaces événementiels partout en Côte d’Ivoire. Réservation en ligne quand c’est possible.",
      images: [], tabs: ["rent", "sale", "furnished", "event", "land", "commercial"],
      placeholder: "Commune, quartier ou ville", showStats: true,
      chips: [
        { label: "Studio à Cocody", href: "/annonces?transaction=rent&propertyType=studio&q=Cocody" },
        { label: "Villa à vendre", href: "/annonces?transaction=sale&propertyType=villa" },
        { label: "Terrain à Bingerville", href: "/annonces?propertyType=terrain&q=Bingerville" },
        { label: "Meublé à Marcory", href: "/annonces?transaction=furnished&q=Marcory" },
      ],
    },
  },
  {
    type: "categories", label: "Barre de catégories", icon: "🏷️",
    description: "Types de bien en pastilles défilantes (style Airbnb), avec le nombre d’annonces.",
    fields: [
      { key: "title", label: "Titre (facultatif)", type: "text" },
      { key: "types", label: "Types affichés (vide : tous)", type: "multi", options: "types" },
    ],
    defaults: { title: "", types: [] },
  },
  {
    type: "quickStart", label: "Par où commencer ?", icon: "🧭",
    description: "Tuiles d’entrée : acheter, louer, investir, publier…",
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "subtitle", label: "Sous-titre", type: "text" },
      { key: "items", label: "Tuiles", type: "list", itemLabel: "Tuile", fields: [
        { key: "icon", label: "Émoji / icône", type: "text" }, { key: "title", label: "Titre", type: "text" },
        { key: "text", label: "Texte", type: "textarea" }, { key: "href", label: "Lien", type: "url" }, { key: "image", label: "Image (facultatif)", type: "image" },
      ] },
      ...common,
    ],
    defaults: {
      title: "Par où commencer ?", subtitle: "Tout ce qu’il faut pour votre projet immobilier", background: "white",
      items: [
        { icon: "🔑", title: "Louer un logement", text: "Appartements, villas, studios : contact direct avec le propriétaire.", href: "/annonces?transaction=rent" },
        { icon: "🏡", title: "Acheter un bien", text: "Maisons, terrains et immeubles vérifiés par des pros.", href: "/annonces?transaction=sale" },
        { icon: "🛏️", title: "Séjourner en meublé", text: "Réservez en ligne, acompte sécurisé.", href: "/annonces?transaction=furnished" },
        { icon: "📣", title: "Publier une annonce", text: "Gratuit et en quelques minutes, visible par des milliers de personnes.", href: "/publier" },
      ],
    },
  },
  {
    type: "listings", label: "Carrousel d’annonces", icon: "🏠",
    description: "Annonces filtrées (vedette, nouveautés, à louer à Cocody…) en carrousel ou en grille.",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "subtitle", label: "Sous-titre", type: "text" },
      { key: "transaction", label: "Transaction", type: "select", options: TX },
      { key: "propertyType", label: "Type de bien", type: "select", options: "types" },
      { key: "q", label: "Lieu (commune, quartier, ville)", type: "text" },
      { key: "featuredOnly", label: "Uniquement les annonces en vedette", type: "bool" },
      { key: "sort", label: "Ordre", type: "select", options: SORT },
      { key: "count", label: "Nombre d’annonces", type: "number", min: 3, max: 24 },
      { key: "layout", label: "Présentation", type: "select", options: LAYOUT },
      ...common,
    ],
    defaults: { title: "Annonces en vedette", subtitle: "Sélectionnées par l’équipe Moboo", transaction: "", propertyType: "", q: "", featuredOnly: true, sort: "featured", count: 12, layout: "carousel", background: "white" },
  },
  {
    type: "reservables", label: "Meublés ou espaces réservables", icon: "🛎️",
    description: "Résidences meublées ou espaces événementiels réservables en ligne.",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "subtitle", label: "Sous-titre", type: "text" },
      { key: "kind", label: "Catalogue", type: "select", options: [{ value: "furnished", label: "Résidences meublées" }, { value: "event", label: "Espaces événementiels" }] },
      { key: "count", label: "Nombre", type: "number", min: 3, max: 24 },
      { key: "layout", label: "Présentation", type: "select", options: LAYOUT },
      ...common,
    ],
    defaults: { title: "Séjours meublés à réserver", subtitle: "Réservation en ligne, acompte sécurisé", kind: "furnished", count: 10, layout: "carousel", background: "soft" },
  },
  {
    type: "localities", label: "Quartiers populaires", icon: "📍",
    description: "Communes et quartiers avec photo et nombre d’annonces.",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "subtitle", label: "Sous-titre", type: "text" },
      { key: "mode", label: "Source", type: "select", options: [{ value: "auto", label: "Automatique (les plus actifs)" }, { value: "manual", label: "Liste choisie" }] },
      { key: "count", label: "Nombre (automatique)", type: "number", min: 3, max: 16 },
      { key: "items", label: "Quartiers (liste choisie)", type: "list", itemLabel: "Quartier", fields: [
        { key: "name", label: "Nom (commune ou quartier)", type: "text" }, { key: "subtitle", label: "Sous-titre (ex. Abidjan)", type: "text" }, { key: "image", label: "Photo", type: "image" },
      ] },
      ...common,
    ],
    defaults: { title: "Quartiers les plus recherchés", subtitle: "Explorez les biens par commune", mode: "auto", count: 8, items: [], background: "white" },
  },
  {
    type: "propertyTypes", label: "Explorer par type de bien", icon: "🏘️",
    description: "Grandes tuiles photo par type (appartement, villa, terrain…).",
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "items", label: "Tuiles", type: "list", itemLabel: "Type", fields: [{ key: "type", label: "Type de bien", type: "select", options: "types" }, { key: "image", label: "Photo", type: "image" }] },
      ...common,
    ],
    defaults: { title: "Explorer par type de bien", items: [{ type: "appartement", image: "" }, { type: "villa", image: "" }, { type: "studio", image: "" }, { type: "terrain", image: "" }], background: "soft" },
  },
  {
    type: "banner", label: "Bannière d’appel à l’action", icon: "📢",
    description: "Grande bannière : publier une annonce, devenir hôte, estimer son bien…",
    fields: [
      { key: "eyebrow", label: "Sur-titre", type: "text" }, { key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" },
      { key: "buttonLabel", label: "Bouton", type: "text" }, { key: "buttonHref", label: "Lien du bouton", type: "url" },
      { key: "image", label: "Image", type: "image" },
      { key: "style", label: "Style", type: "select", options: [{ value: "brand", label: "Bleu Moboo" }, { value: "accent", label: "Orange" }, { value: "light", label: "Clair" }, { value: "image", label: "Image plein fond" }] },
    ],
    defaults: { eyebrow: "Propriétaires & agents", title: "Publiez votre bien gratuitement", text: "Vos annonces vues par des milliers d’acheteurs et de locataires, contact direct, sans commission.", buttonLabel: "Publier une annonce", buttonHref: "/publier", image: "", style: "brand" },
  },
  {
    type: "steps", label: "Étapes (comment ça marche)", icon: "🪜",
    description: "3 ou 4 étapes numérotées avec un bouton.",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "subtitle", label: "Sous-titre", type: "text" },
      { key: "items", label: "Étapes", type: "list", itemLabel: "Étape", fields: [{ key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" }] },
      { key: "buttonLabel", label: "Bouton", type: "text" }, { key: "buttonHref", label: "Lien", type: "url" },
      ...common,
    ],
    defaults: {
      title: "Meublés & espaces : réservez en 3 étapes", subtitle: "Simple, rapide et sécurisé", background: "brand",
      items: [{ title: "Réservez", text: "Choisissez vos dates et envoyez votre demande." }, { title: "L’hôte confirme", text: "Acompte seulement après accord." }, { title: "Code d’arrivée", text: "À présenter sur place." }],
      buttonLabel: "Voir les biens réservables", buttonHref: "/annonces?reservable=1",
    },
  },
  {
    type: "pros", label: "Agents et agences", icon: "🤝",
    description: "Les professionnels les plus actifs (badge Vérifié).",
    fields: [{ key: "title", label: "Titre", type: "text" }, { key: "subtitle", label: "Sous-titre", type: "text" }, { key: "count", label: "Nombre", type: "number", min: 3, max: 12 }, ...common],
    defaults: { title: "Des professionnels de confiance", subtitle: "Agents et agences actifs sur Moboo", count: 8, background: "white" },
  },
  {
    type: "stats", label: "Chiffres clés", icon: "📊",
    description: "Nombre d’annonces, de pros, de villes (automatique) ou chiffres libres.",
    fields: [
      { key: "mode", label: "Source", type: "select", options: [{ value: "auto", label: "Automatique" }, { value: "manual", label: "Chiffres libres" }] },
      { key: "items", label: "Chiffres libres", type: "list", itemLabel: "Chiffre", fields: [{ key: "value", label: "Valeur", type: "text" }, { key: "label", label: "Libellé", type: "text" }] },
      ...common,
    ],
    defaults: { mode: "auto", items: [], background: "soft" },
  },
  {
    type: "calculator", label: "Simulateur de crédit", icon: "🧮",
    description: "Calcul de la mensualité d’un prêt immobilier.",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "subtitle", label: "Sous-titre", type: "textarea" },
      { key: "amount", label: "Montant par défaut (FCFA)", type: "number", min: 1_000_000, max: 2_000_000_000 },
      { key: "rate", label: "Taux annuel par défaut (%)", type: "number", min: 1, max: 25 },
      { key: "years", label: "Durée par défaut (ans)", type: "number", min: 1, max: 30 },
      { key: "ctaLabel", label: "Bouton", type: "text" }, { key: "ctaHref", label: "Lien du bouton", type: "url" },
      ...common,
    ],
    defaults: { title: "Combien pouvez-vous emprunter ?", subtitle: "Estimez votre mensualité en quelques secondes.", amount: 30_000_000, rate: 9, years: 15, ctaLabel: "Voir les biens à vendre", ctaHref: "/annonces?transaction=sale", background: "white" },
  },
  {
    type: "testimonials", label: "Témoignages", icon: "💬",
    description: "Avis de clients (saisis ici ou derniers avis approuvés du site).",
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "items", label: "Témoignages", type: "list", itemLabel: "Témoignage", fields: [
        { key: "name", label: "Nom", type: "text" }, { key: "role", label: "Rôle / ville", type: "text" }, { key: "text", label: "Texte", type: "textarea" },
        { key: "photo", label: "Photo", type: "image" }, { key: "rating", label: "Note (1 à 5)", type: "number", min: 1, max: 5 },
      ] },
      ...common,
    ],
    defaults: {
      title: "Ils ont trouvé grâce à Moboo", background: "soft",
      items: [
        { name: "Awa K.", role: "Locataire à Cocody", text: "J’ai trouvé mon appartement en une semaine, en parlant directement au propriétaire.", rating: 5, photo: "" },
        { name: "Yao K.", role: "Agent immobilier", text: "Mes annonces sont vues et je reçois des demandes sérieuses chaque jour.", rating: 5, photo: "" },
        { name: "Mariam D.", role: "Voyageuse", text: "Réservation d’un meublé à Marcory simple et rassurante.", rating: 4, photo: "" },
      ],
    },
  },
  {
    type: "articles", label: "Conseils & actualités", icon: "📰",
    description: "Articles du blog ou guides (titre, image, lien).",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "seeAllHref", label: "Lien « Tout voir »", type: "url" },
      { key: "items", label: "Articles", type: "list", itemLabel: "Article", fields: [
        { key: "title", label: "Titre", type: "text" }, { key: "tag", label: "Rubrique", type: "text" }, { key: "image", label: "Image", type: "image" }, { key: "href", label: "Lien", type: "url" },
      ] },
      ...common,
    ],
    defaults: {
      title: "Conseils pour votre projet", seeAllHref: "https://moboo.ci/blog", background: "white",
      items: [
        { title: "Louer à Abidjan : les pièges à éviter", tag: "Location", image: "", href: "https://moboo.ci/blog" },
        { title: "Acheter un terrain : ACD, titre foncier, lotissement", tag: "Achat", image: "", href: "https://moboo.ci/blog" },
        { title: "Bien préparer son état des lieux", tag: "Guide", image: "", href: "https://moboo.ci/blog" },
      ],
    },
  },
  {
    type: "partners", label: "Partenaires", icon: "🏦",
    description: "Logos des partenaires (Immobilier → Partenaires).",
    fields: [{ key: "title", label: "Titre", type: "text" }, ...common],
    defaults: { title: "Ils nous font confiance", background: "white" },
  },
  {
    type: "app", label: "Application mobile", icon: "📱",
    description: "Téléchargement de l’application Moboo.ci.",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" }, { key: "image", label: "Visuel (téléphone)", type: "image" },
      { key: "playStoreUrl", label: "Lien Google Play (vide : réglage de l’application)", type: "url" }, { key: "appStoreUrl", label: "Lien App Store", type: "url" },
    ],
    defaults: { title: "Moboo dans votre poche", text: "Alertes sur les nouvelles annonces, messages avec les annonceurs et réservations, où que vous soyez.", image: "", playStoreUrl: "", appStoreUrl: "" },
  },
  {
    type: "faq", label: "Questions fréquentes", icon: "❓",
    description: "Questions / réponses dépliables.",
    fields: [{ key: "title", label: "Titre", type: "text" }, { key: "items", label: "Questions", type: "list", itemLabel: "Question", fields: [{ key: "q", label: "Question", type: "text" }, { key: "a", label: "Réponse", type: "textarea" }] }, ...common],
    defaults: {
      title: "Questions fréquentes", background: "white",
      items: [
        { q: "Publier une annonce est-il payant ?", a: "La publication est gratuite. Des forfaits permettent de publier plus et de mettre vos biens en vedette." },
        { q: "Moboo prend-il une commission ?", a: "Non, pour les ventes et locations classiques : vous êtes en contact direct avec l’annonceur." },
        { q: "Comment réserver un meublé ?", a: "Choisissez vos dates sur la fiche : l’hôte confirme, puis vous réglez l’acompte en ligne." },
      ],
    },
  },
  {
    type: "richText", label: "Texte libre", icon: "✍️",
    description: "Contenu HTML libre (texte, images, liens).",
    fields: [{ key: "html", label: "Contenu", type: "html" }, ...common],
    defaults: { html: "<h2>Titre</h2><p>Votre texte…</p>", background: "white" },
  },
];

export const blockDef = (type: string) => BLOCKS.find((b) => b.type === type);

let seq = 0;
export const newSection = (type: string): Section => ({
  id: `${type.toLowerCase().slice(0, 12)}-${Date.now().toString(36)}${(seq++).toString(36)}`,
  type, enabled: true, props: structuredClone(blockDef(type)?.defaults ?? {}),
});

const def = (type: string, id: string, props: Record<string, unknown> = {}): Section =>
  ({ id, type, enabled: true, props: { ...structuredClone(blockDef(type)!.defaults), ...props } });

/** Page d'accueil par défaut (tant que rien n'est publié). */
export const DEFAULT_HOME: PageContent = {
  sections: [
    def("hero", "hero-main"),
    def("categories", "categories-main"),
    def("listings", "listings-featured"),
    def("quickStart", "quickstart-main"),
    def("listings", "listings-rent", { title: "Nouveautés à louer", subtitle: "Les dernières annonces publiées", transaction: "rent", featuredOnly: false, sort: "newest", background: "white" }),
    def("localities", "localities-main"),
    def("reservables", "reservables-furnished"),
    def("listings", "listings-sale", { title: "Biens à vendre", subtitle: "Maisons, villas et terrains", transaction: "sale", featuredOnly: false, sort: "newest" }),
    def("propertyTypes", "types-main"),
    def("steps", "steps-booking"),
    def("pros", "pros-main"),
    def("calculator", "calculator-main"),
    def("banner", "banner-publish"),
    def("testimonials", "testimonials-main"),
    def("articles", "articles-main"),
    def("stats", "stats-main"),
    def("partners", "partners-main"),
    def("app", "app-main"),
    def("faq", "faq-main"),
  ],
};

export const DEFAULT_CHROME: ChromeContent = {
  menu: [
    { label: "Louer", href: "/annonces?transaction=rent" },
    { label: "Acheter", href: "/annonces?transaction=sale" },
    { label: "Meublés", href: "/annonces?transaction=furnished" },
    { label: "Espaces", href: "/annonces?transaction=event" },
  ],
  footer: {
    about: "Louer, acheter, réserver — l’immobilier en Côte d’Ivoire, en contact direct.",
    columns: [
      { title: "Rechercher", links: [
        { label: "Appartements à louer", href: "/annonces?transaction=rent&propertyType=appartement" },
        { label: "Villas à vendre", href: "/annonces?transaction=sale&propertyType=villa" },
        { label: "Terrains", href: "/annonces?propertyType=terrain" },
        { label: "Meublés", href: "/annonces?transaction=furnished" },
        { label: "Espaces événementiels", href: "/annonces?transaction=event" },
      ] },
      { title: "Villes", links: [
        { label: "Abidjan", href: "/annonces?q=Abidjan" }, { label: "Cocody", href: "/annonces?q=Cocody" },
        { label: "Bingerville", href: "/annonces?q=Bingerville" }, { label: "Yamoussoukro", href: "/annonces?q=Yamoussoukro" },
        { label: "Grand-Bassam", href: "/annonces?q=Grand-Bassam" },
      ] },
      { title: "Professionnels", links: [
        { label: "Publier une annonce", href: "/publier" }, { label: "Forfaits", href: "/forfaits" },
        { label: "Espace pro", href: "/compte?mode=identifiant" }, { label: "Devenir hôte", href: "https://resi.moboo.ci" },
      ] },
      { title: "Moboo", links: [
        { label: "Blog", href: "https://moboo.ci/blog" }, { label: "Réserver", href: "/reserver" }, { label: "Mon espace", href: "/mon-espace" },
      ] },
    ],
    showApps: true, playStoreUrl: "", appStoreUrl: "",
    bottomText: "© {year} Moboo — Tous droits réservés.",
  },
};

/** Complète une page enregistrée avec les valeurs par défaut des blocs (nouveaux champs). */
export function normalizeHome(c: PageContent | null | undefined): PageContent {
  if (!c?.sections?.length) return DEFAULT_HOME;
  return {
    sections: c.sections.filter((s) => blockDef(s.type)).map((s) => ({ ...s, props: { ...structuredClone(blockDef(s.type)!.defaults), ...(s.props ?? {}) } })),
  };
}

export function normalizeChrome(c: Partial<ChromeContent> | null | undefined): ChromeContent {
  return {
    menu: Array.isArray(c?.menu) && c!.menu.length ? c!.menu : DEFAULT_CHROME.menu,
    footer: { ...DEFAULT_CHROME.footer, ...(c?.footer ?? {}) },
  };
}
