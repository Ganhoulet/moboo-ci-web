// Builder de l'application Moboo.ci : valeurs reconnues par l'application (dépôt
// moboo-ci, houzi_package) et libellés du back-office.

export type Cfg = Record<string, any>;

export const HOME_DESIGNS = [
  { v: "home_0", l: "Accueil Moboo (actuel)" },
  { v: "home", l: "Accueil classique" },
  { v: "home_1", l: "Variante 1" },
  { v: "home_2", l: "Variante 2" },
  { v: "home_3", l: "Variante 3" },
  { v: "home_4", l: "Variante 4" },
];

export const NAVBAR_DESIGNS = [
  { v: "design_01", l: "Classique (libellés sous les icônes)" },
  { v: "design_02", l: "Flottante arrondie (5 onglets max.)" },
];

/** Cartes d'annonce de l'application (ArticleBoxDesign, modèles 1 à 13). */
export const CARD_DESIGNS = Array.from({ length: 13 }, (_, i) => {
  const v = `design_${String(i + 1).padStart(2, "0")}`;
  const known: Record<string, string> = { design_01: " (carrousels de l'accueil)", design_06: " (carte Moboo moyenne)", design_12: " (grande carte Moboo, photos en carrousel)" };
  return { v, l: `Modèle ${i + 1}${known[v] ?? ""}` };
});

export const LISTING_VIEWS = [
  { v: "carousel", l: "Carrousel horizontal" },
  { v: "list", l: "Liste verticale" },
  { v: "slider", l: "Diaporama pleine largeur" },
];

export const SORTS = [
  { v: "newest", l: "Plus récentes" }, { v: "oldest", l: "Plus anciennes" },
  { v: "price_min", l: "Prix croissant" }, { v: "price_max", l: "Prix décroissant" },
  { v: "area_min", l: "Surface croissante" }, { v: "area_max", l: "Surface décroissante" },
];

export const FONTS = [
  { v: "", l: "Rubik (par défaut)" },
  { v: "Ubuntu", l: "Ubuntu" },
  { v: "Cairo", l: "Cairo" },
];

/** Icônes Material reconnues par l'application (nom + codePoint Flutter). */
export const ICONS: [string, number][] = [
  ["home_rounded", 63477], ["home", 58136], ["search_rounded", 983357], ["search", 58727], ["favorite_border", 57948], ["favorite", 57947],
  ["person_rounded", 983153], ["account_circle", 57411], ["chat_bubble_outline", 57685], ["chat", 57683], ["forum", 58051],
  ["notifications_none", 58449], ["notifications", 58447], ["bookmark_border", 57588], ["luggage", 58305], ["event_available", 57919],
  ["event", 57918], ["calendar_month", 984763], ["dashboard", 57777], ["apartment", 57481], ["house", 58152], ["villa", 59068],
  ["hotel", 58146], ["bed", 57559], ["meeting_room", 58330], ["business", 57627], ["store", 58890], ["map", 58312],
  ["location_on", 58283], ["explore", 57928], ["near_me", 58399], ["qr_code_scanner", 58615], ["add_circle", 57423],
  ["add_home", 984965], ["sell", 58736], ["key", 984363], ["real_estate_agent", 58635], ["groups", 58094], ["badge", 57544],
  ["settings", 58751], ["menu", 58332], ["info", 58172], ["call", 57638], ["star", 58873], ["workspace_premium", 984494],
  ["campaign", 57656], ["local_offer", 58268], ["article", 57506], ["language", 58214], ["payments", 58498],
  ["celebration", 57673], ["festival", 57955], ["weekend", 59105], ["local_activity", 58249], ["tune", 59011], ["grid_view", 58090],
];
export const iconJson = (name: string) => {
  const cp = ICONS.find(([n]) => n === name)?.[1] ?? 63477;
  return JSON.stringify({ name, fontFamily: "MaterialIcons", codePoint: cp });
};
export const iconName = (json: unknown) => {
  try { return String(JSON.parse(String(json)).name || "home"); } catch { return "home"; }
};
/** Ligature de la police « Material Icons » (aperçu) : « home_rounded » → « home ». */
export const ligature = (name: string) => name.replace(/_(rounded|outlined|sharp)$/, "").replace(/_none$/, "");

/** Onglets de la barre du bas. hook : écran Moboo enregistré dans l'application (hooks_v2.dart). */
export const NAV_TYPES: { type: string; hook?: string; l: string; title: string; icon: string; login?: boolean; d: string }[] = [
  { type: "home", l: "Accueil", title: "Accueil", icon: "home_rounded", d: "Page d'accueil (obligatoire)" },
  { type: "search", l: "Recherche", title: "Recherche", icon: "search_rounded", d: "Carte et résultats" },
  { type: "place_holder", hook: "moboo_reserver", l: "Réserver un meublé", title: "Réserver", icon: "hotel", d: "Résidences meublées, calendrier en direct" },
  { type: "place_holder", hook: "moboo_espaces", l: "Réserver un espace", title: "Espaces", icon: "celebration", d: "Salles et espaces événementiels" },
  { type: "place_holder", hook: "moboo_reservations", l: "Mes réservations", title: "Voyages", icon: "luggage", login: true, d: "Réservations, codes d'arrivée, litiges" },
  { type: "place_holder", hook: "moboo_space", l: "Mon espace", title: "Mon espace", icon: "dashboard", login: true, d: "Onglets de l'espace membre selon le profil" },
  { type: "savedSearches_favourites", l: "Favoris + alertes", title: "Favoris", icon: "favorite_border", login: true, d: "Favoris et recherches enregistrées" },
  { type: "favourites", l: "Favoris", title: "Favoris", icon: "favorite_border", login: true, d: "Biens aimés" },
  { type: "saved_searches", l: "Alertes", title: "Alertes", icon: "notifications_none", login: true, d: "Recherches enregistrées" },
  { type: "messages", l: "Messages", title: "Messages", icon: "chat_bubble_outline", login: true, d: "Messagerie avec les annonceurs" },
  { type: "blogs", l: "Blog", title: "Blog", icon: "article", d: "Articles de moboo.ci" },
  { type: "profile", l: "Profil", title: "Profil", icon: "person_rounded", d: "Compte, connexion, réglages" },
  { type: "web_url", l: "Page web", title: "Moboo.ci", icon: "language", d: "Ouvre une adresse (https://…)" },
];
export const navTypeOf = (item: Cfg) =>
  String(item.url ?? "").startsWith(PAGE_HOOK)
    ? { type: "place_holder", hook: item.url, l: "Page de rangées", title: item.title, icon: "grid_view", d: "Page créée dans « Rangées et pages »" }
    : NAV_TYPES.find((t) => t.type === item.section_type && (t.type !== "place_holder" || t.hook === (item.url || item.title))) ?? null;

export function newNavItem(t: (typeof NAV_TYPES)[number]): Cfg {
  return {
    section_type: t.type, title: t.title, url: t.hook ?? (t.type === "web_url" ? "https://moboo.ci" : null), check_login: !!t.login,
    sub_type_list: null, sub_type_value_list: null, search_api_map: {}, icon_data: iconJson(t.icon),
  };
}

/** Sections de l'accueil. */
export const HOME_TYPES: { key: string; l: string; d: string; make: () => Cfg }[] = [
  { key: "property:featured", l: "Carrousel « En vedette »", d: "Annonces mises en avant", make: () => home({ section_type: "property", title: "Propriétés en vedette", layout_design: "design_01", sub_type: "property_feature", sub_type_value: "all", section_listing_view: "carousel", show_featured: true }) },
  { key: "property:recent", l: "Carrousel « Dernières annonces »", d: "Les plus récentes", make: () => home({ section_type: "property", title: "Dernières annonces", layout_design: "design_01", sub_type: "", sub_type_value: "", section_listing_view: "carousel" }) },
  { key: "property:city", l: "Annonces d'une ville", d: "Ex. Abidjan, Bouaké…", make: () => home({ section_type: "property", title: "Logements à Abidjan", layout_design: "design_01", sub_type: "property_city", sub_type_value: "abidjan", section_listing_view: "carousel", search_api_map: { "location[]": "abidjan" }, search_route_map: { property_city_slug: ["abidjan"], property_city: ["Abidjan"] } }) },
  { key: "property:type", l: "Annonces d'un type", d: "Ex. résidences meublées", make: () => home({ section_type: "property", title: "Résidences meublées", layout_design: "design_01", sub_type: "property_type", sub_type_value: "residence-meublee", section_listing_view: "carousel" }) },
  { key: "property:status", l: "Annonces d'un statut", d: "À louer, à vendre…", make: () => home({ section_type: "property", title: "À louer", layout_design: "design_01", sub_type: "property_status", sub_type_value: "a-louer", section_listing_view: "carousel" }) },
  { key: "property:nearby", l: "Autour de moi", d: "Selon la position du téléphone", make: () => home({ section_type: "property", title: "Autour de moi", layout_design: "design_01", sub_type: "", sub_type_value: "", section_listing_view: "carousel", show_nearby: true }) },
  { key: "term:city", l: "Villes en vedette", d: "Explorer par ville", make: () => home({ section_type: "term", title: "Explorer par ville", layout_design: "design_02", sub_type: "property_city", sub_type_value: "all", section_listing_view: "carousel" }) },
  { key: "term:type", l: "Catégories (types de bien)", d: "Explorer par type", make: () => home({ section_type: "term", title: "Explorer par type", layout_design: "design_01", sub_type: "property_type", sub_type_value: "all", section_listing_view: "carousel" }) },
  { key: "term_with_icons", l: "Catégories à icônes", d: "Pastilles cliquables", make: () => home({ section_type: "term_with_icons", title: "Que cherchez-vous ?", sub_type: "property_type", sub_type_value: "all", sub_type_list: ["property_type"], sub_type_value_list: ["all"] }) },
  { key: "agents", l: "Agents immobiliers", d: "Bloc d'agents", make: () => home({ section_type: "agents", title: "Agents immobiliers", layout_design: "design_01", section_listing_view: "carousel" }) },
  { key: "agencies", l: "Agences", d: "Bloc d'agences", make: () => home({ section_type: "agencies", title: "Agences immobilières", layout_design: "design_01", section_listing_view: "carousel" }) },
  { key: "partners", l: "Partenaires", d: "Logos des partenaires", make: () => home({ section_type: "partners", title: "Nos partenaires", section_listing_view: "carousel" }) },
  { key: "blogs", l: "Articles du blog", d: "Derniers articles", make: () => home({ section_type: "blogs", title: "Conseils immobiliers", layout_design: "design_01", section_listing_view: "carousel" }) },
  { key: "recent_search", l: "Recherches récentes", d: "Reprendre une recherche", make: () => home({ section_type: "recent_search", title: "Recherches récentes", section_listing_view: "carousel" }) },
  { key: "ad", l: "Publicité", d: "Emplacement publicitaire", make: () => home({ section_type: "ad", title: "Ad View" }) },
  { key: "hook:moboo_marketing", l: "Bannières Moboo (Marketing)", d: "Bannières du back-office Marketing", make: () => home({ section_type: "place_holder", title: "moboo_marketing" }) },
  { key: "hook:qr_scanner", l: "Scanner un QR code", d: "Bouton de scan des affiches", make: () => home({ section_type: "place_holder", title: "qr_scanner" }) },
  { key: "hook:estimation", l: "Estimation (foncier / loyer)", d: "Outils d'estimation Moboo", make: () => home({ section_type: "place_holder", title: "estimation" }) },
  { key: "hook:nearby", l: "Bannière « Près de chez vous »", d: "Incite à activer la position", make: () => home({ section_type: "place_holder", title: "nearby" }) },
  { key: "hook:infinite_properties", l: "Fil d'annonces infini", d: "À placer en dernier", make: () => home({ section_type: "place_holder", title: "infinite_properties" }) },
  { key: "hook:moboo_meubles", l: "Meublés populaires (par commune)", d: "Rangées façon Airbnb des meublés réservables", make: () => home({ section_type: "place_holder", title: "moboo_meubles" }) },
  { key: "hook:moboo_espaces", l: "Espaces événementiels", d: "Rangée des espaces réservables", make: () => home({ section_type: "place_holder", title: "moboo_espaces" }) },
];

// ───────────── Rangées « façon Airbnb » et pages d'onglet (moboo_rows / moboo_pages) ─────────────
// Lues par le serveur (moboo/v1/rows/…) : créer, modifier ou retirer une rangée ne demande aucune
// mise à jour de l'application. Accueil : « moboo_row:<id> » ; onglet : url « moboo_page:<id> ».
export const ROW_HOOK = "moboo_row:";
export const PAGE_HOOK = "moboo_page:";
export const ROW_SOURCES = [
  { v: "annonces", l: "Annonces (maisons, terrains, appartements…)" },
  { v: "meubles", l: "Meublés réservables (Moboo Resi)" },
  { v: "espaces", l: "Espaces événementiels (Moboo Event)" },
];
export const ROW_TYPES = [
  { v: "appartement", l: "Appartement" }, { v: "studio", l: "Studio" }, { v: "maison", l: "Maison" }, { v: "villa", l: "Villa" },
  { v: "terrain", l: "Terrain" }, { v: "bureau", l: "Bureau" }, { v: "magasin", l: "Magasin" }, { v: "autre", l: "Autre" },
];
/** Types d'espace de Moboo Event (champ « type » de l'espace). */
export const ESPACE_TYPES = [
  { v: "salle_mariage", l: "Salle de fête / mariage" }, { v: "conference", l: "Salle de conférence" }, { v: "coworking", l: "Coworking" },
  { v: "corporate", l: "Espace pro" }, { v: "rooftop", l: "Rooftop" }, { v: "jardin", l: "Jardin" }, { v: "villa", l: "Villa" },
  { v: "club", l: "Club" }, { v: "culturel", l: "Espace culturel" }, { v: "maquis", l: "Maquis" },
];
/** Icônes des catégories de l'onglet « Réserver » (connues de l'application). */
export const TAB_ICONS = [
  { v: "king_bed", l: "Lit" }, { v: "celebration", l: "Fête" }, { v: "meeting_room", l: "Salle" }, { v: "work", l: "Bureau / coworking" },
  { v: "apartment", l: "Immeuble" }, { v: "villa", l: "Villa" }, { v: "deck", l: "Terrasse" }, { v: "park", l: "Jardin" },
  { v: "nightlife", l: "Soirée" }, { v: "restaurant", l: "Restaurant" }, { v: "theater", l: "Culture" }, { v: "business", l: "Entreprise" },
  { v: "pool", l: "Piscine" }, { v: "hotel", l: "Hôtel" },
];
export const TAB_KINDS = [{ v: "furnished", l: "Meublés (séjour à la nuit)" }, { v: "event", l: "Espaces (à la journée)" }];
export const DEFAULT_RESERVER_TABS = [
  { id: "meubles", label: "Meublés", icon: "king_bed", kind: "furnished" },
  { id: "espaces", label: "Espaces événementiels", icon: "celebration", kind: "event" },
  { id: "salles", label: "Salles & conférences", icon: "meeting_room", kind: "event", types: ["salle_mariage", "conference"] },
];

export const ROW_DESIGNS = [
  { v: "grande", l: "Grande carte (façon Airbnb)", d: "Photo carrée 270 px, badge" },
  { v: "compacte", l: "Petite carte carrée", d: "Comme « Meublés populaires »" },
  { v: "paysage", l: "Carte paysage", d: "Photo large 16:10" },
  { v: "liste", l: "Liste verticale", d: "5 lignes : photo à gauche, texte à droite" },
];
export const ROW_TRANSACTIONS = [{ v: "", l: "Location et vente" }, { v: "rent", l: "À louer" }, { v: "sale", l: "À vendre" }];

export const slugify = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "rangee";
export function uniqueId(base: string, taken: string[]) {
  let id = slugify(base);
  for (let i = 2; taken.includes(id); i++) id = `${slugify(base).slice(0, 36)}-${i}`;
  return id;
}

export const ROW_PRESETS: { l: string; d: string; row: Cfg }[] = [
  { l: "Terrains à vendre", d: "Une rangée par commune", row: { title: "Terrains à vendre", source: "annonces", types: ["terrain"], transaction: "sale", by_zone: true, zones: 3, design: "grande", limit: 10 } },
  { l: "Maisons et villas à louer", d: "Une rangée par commune", row: { title: "Maisons et villas à louer", source: "annonces", types: ["maison", "villa"], transaction: "rent", by_zone: true, zones: 3, design: "compacte", limit: 10 } },
  { l: "Villas à vendre", d: "Toutes communes", row: { title: "Villas à vendre", source: "annonces", types: ["villa"], transaction: "sale", design: "grande", limit: 10 } },
  { l: "Appartements à louer", d: "Toutes communes", row: { title: "Appartements à louer", source: "annonces", types: ["appartement", "studio"], transaction: "rent", design: "paysage", limit: 10 } },
  { l: "Bureaux et magasins", d: "Location et vente", row: { title: "Bureaux et commerces", source: "annonces", types: ["bureau", "magasin"], design: "liste", limit: 5 } },
  { l: "Biens en vedette", d: "Annonces mises en avant", row: { title: "En vedette", source: "annonces", featured: true, design: "grande", limit: 10 } },
  { l: "Meublés par commune", d: "Réservables en ligne", row: { title: "Meublés populaires", source: "meubles", by_zone: true, zones: 3, design: "compacte", limit: 10 } },
  { l: "Espaces événementiels", d: "Une rangée par commune", row: { title: "Espaces événementiels", source: "espaces", by_zone: true, zones: 3, design: "grande", limit: 10 } },
  { l: "Salles de fête", d: "Mariages, anniversaires", row: { title: "Salles de mariage et de fête", source: "espaces", types: ["salle_mariage", "jardin", "rooftop"], design: "paysage", limit: 10 } },
  { l: "Conférence et coworking", d: "Séminaires, travail", row: { title: "Salles de conférence et coworking", source: "espaces", types: ["conference", "coworking", "corporate"], design: "compacte", limit: 10 } },
  { l: "Rangée vide", d: "À régler soi-même", row: { title: "Nouvelle rangée", source: "annonces", design: "compacte", limit: 10 } },
];
function home(p: Cfg): Cfg {
  return {
    section_type: "", title: "", layout_design: "", sub_type: "", sub_type_value: "", section_listing_view: "", show_featured: false, show_nearby: false,
    sub_type_list: [], sub_type_value_list: [], search_api_map: {}, search_route_map: {}, terms_with_icon_layout: [], ...p,
  };
}
export const HOOK_LABEL: Record<string, string> = {
  moboo_marketing: "Bannières Moboo", qr_scanner: "Scanner un QR code", estimation: "Estimation", nearby: "Près de chez vous", infinite_properties: "Fil d'annonces infini",
  moboo_meubles: "Meublés populaires", moboo_espaces: "Espaces événementiels",
};
export function homeLabel(s: Cfg, cfg?: Cfg): string {
  if (s.section_type === "place_holder" && String(s.title).startsWith(ROW_HOOK)) {
    const id = String(s.title).slice(ROW_HOOK.length);
    const row = (Array.isArray(cfg?.moboo_rows) ? cfg!.moboo_rows : []).find((r: Cfg) => r.id === id);
    return row ? `Rangée « ${row.title} »` : `Rangée supprimée (${id})`;
  }
  if (s.section_type === "place_holder") return HOOK_LABEL[s.title] ?? `Écran « ${s.title} »`;
  const m: Record<string, string> = {
    property: "Annonces", term: "Explorer par terme", term_with_icons: "Catégories à icônes", agents: "Agents", agencies: "Agences",
    partners: "Partenaires", blogs: "Blog", recent_search: "Recherches récentes", ad: "Publicité",
  };
  return m[s.section_type] ?? s.section_type;
}
export const SUB_TYPES = [
  { v: "", l: "Toutes les annonces" }, { v: "property_feature", l: "En vedette" }, { v: "property_city", l: "Ville" },
  { v: "property_type", l: "Type de bien" }, { v: "property_status", l: "Statut (à louer, à vendre…)" }, { v: "property_label", l: "Étiquette" },
  { v: "property_area", l: "Quartier" }, { v: "property_state", l: "Région" },
];

/** Menu latéral. */
export const DRAWER_LABEL: Record<string, string> = {
  home: "Accueil", moboo_space: "Mon espace", add_property: "Publier une annonce", quick_add_property: "Publication rapide",
  moboo_reserver: "Réserver un meublé ou un espace", properties: "Mes annonces", my_agents: "Mon équipe", agents: "Agents immobiliers",
  agencies: "Agences", request_property: "Faire une demande", moboo_reservations: "Mes réservations", favorites: "Favoris",
  saved_searches: "Alertes", messages: "Messages", blogs: "Blog", crm_dashboard: "Tableau de bord CRM", settings: "Réglages",
  request_demo: "Contactez-nous", login: "Connexion", logout: "Déconnexion",
};

/** Blocs de la fiche d'un bien. */
export const DETAIL_LABEL: Record<string, string> = {
  article_images: "Galerie photos", article_title: "Titre", article_address: "Adresse courte", article_status_price: "Statut et prix",
  ad: "Publicité", valued_features: "Caractéristiques clés", article_features_details: "Détails (surface, pièces…)",
  article_features: "Équipements", article_description: "Description", article_attachments: "Documents joints",
  article_address_info: "Adresse détaillée", article_map: "Carte", article_floor_plans: "Plans d'étage",
  article_multi_units: "Lots / unités", article_contact_information: "Agent / annonceur", button_grid: "Boutons d'action",
  enquire_info: "Formulaire de contact", setup_tour: "Planifier une visite", watch_video: "Vidéo",
  virtual_tour: "Visite virtuelle 3D", article_reviews: "Avis", article_related_posts: "Biens similaires",
};
export const DETAIL_TYPES = Object.keys(DETAIL_LABEL);

/** Filtres de recherche. */
export const FILTER_TYPES: { key: string; l: string; make: () => Cfg }[] = [
  { key: "status", l: "Statut (à louer, à vendre…)", make: () => filter({ section_type: "term_picker", title: "Je désire", data_type: "property_status", api_value: "status[]", picker_type: "tabs and chips" }) },
  { key: "type", l: "Type de bien", make: () => filter({ section_type: "term_picker", title: "Types de biens", data_type: "property_type", api_value: "type[]", picker_type: "tabs and chips", query_type: "OR" }) },
  { key: "label", l: "Étiquette", make: () => filter({ section_type: "term_picker", title: "Étiquettes", data_type: "property_label", api_value: "label[]", picker_type: "dropdown" }) },
  { key: "feature", l: "Équipements", make: () => filter({ section_type: "term_picker", title: "Équipements", data_type: "property_feature", api_value: "features[]", picker_type: "dropdown" }) },
  { key: "city", l: "Ville + rayon", make: () => filter({ section_type: "location_picker", title: "Ville", data_type: "property_city", api_value: "location[]", picker_type: "full_screen", default_radius: "50" }) },
  { key: "price", l: "Prix", make: () => filter({ section_type: "range_picker", title: "Prix", data_type: "price", api_value: "max-price", picker_type: "range slider", max_range_value: "10000000000" }) },
  { key: "area", l: "Superficie", make: () => filter({ section_type: "range_picker", title: "Superficie", data_type: "area", api_value: "max-area", picker_type: "range slider", max_range_value: "1000000" }) },
  { key: "bedrooms", l: "Chambres", make: () => filter({ section_type: "string_picker", title: "Chambres", data_type: "bedrooms", api_value: "bedrooms", picker_type: "chips" }) },
  { key: "bathrooms", l: "Salles de bain", make: () => filter({ section_type: "string_picker", title: "Salles de bain", data_type: "bathrooms", api_value: "bathrooms", picker_type: "chips" }) },
  { key: "keyword", l: "Mot-clé", make: () => filter({ section_type: "keyword_picker", title: "Mot-clé", data_type: "keyword", api_value: "keyword", picker_type: "" }) },
];
function filter(p: Cfg): Cfg {
  return {
    picker_sub_type: null, show_search_by_city: true, show_search_by_location: true, min_range_value: "0", max_range_value: "0",
    div_range_value: "1000", options: null, unique_key: null, query_type: null, default_radius: null, location_hierarchy_list: [], ...p,
  };
}
export const PICKER_TYPES: Record<string, { v: string; l: string }[]> = {
  term_picker: [{ v: "tabs and chips", l: "Onglets + pastilles" }, { v: "dropdown", l: "Liste déroulante" }, { v: "chips", l: "Pastilles" }],
  string_picker: [{ v: "chips", l: "Pastilles" }, { v: "tabs", l: "Onglets" }],
  range_picker: [{ v: "range slider", l: "Curseur double" }],
  location_picker: [{ v: "full_screen", l: "Plein écran" }],
};
export const FILTER_KIND: Record<string, string> = {
  term_picker: "Liste de termes", location_picker: "Lieu", range_picker: "Intervalle", string_picker: "Nombre", keyword_picker: "Mot-clé",
};

/** Interrupteurs. */
export const TOGGLES: { group: string; items: { k: string; l: string }[] }[] = [
  { group: "Connexion", items: [
    { k: "show_login_with_phone", l: "Connexion par téléphone (OTP)" }, { k: "show_login_with_google", l: "Connexion Google" },
    { k: "show_login_with_apple", l: "Connexion Apple" }, { k: "show_login_with_facebook", l: "Connexion Facebook" },
  ] },
  { group: "Fiche du bien : boutons", items: [
    { k: "show_call_button", l: "Appeler" }, { k: "show_whatsapp_button", l: "WhatsApp" }, { k: "show_email_button", l: "E-mail" },
    { k: "show_message_button", l: "Message (messagerie)" }, { k: "show_telegram_button", l: "Telegram" }, { k: "show_line_app_button", l: "Line" },
    { k: "show_print_property_button", l: "Imprimer / PDF" }, { k: "show_download_image_button", l: "Télécharger les photos" },
    { k: "show_rooms_for_property_details", l: "Pièces dans la fiche" },
  ] },
  { group: "Recherche et résultats", items: [
    { k: "show_grid_view_button", l: "Bouton grille / liste" }, { k: "show_map_instead_filter", l: "Carte à la place des filtres" },
    { k: "show_search_by_city", l: "Recherche par ville" }, { k: "show_search_by_location", l: "Recherche par position (rayon)" },
    { k: "show_rooms_for_property_box", l: "Pièces sur les cartes" }, { k: "lock_places_api", l: "Adresses limitées au pays" },
  ] },
  { group: "Fonctions", items: [
    { k: "show_add_property", l: "Publier une annonce" }, { k: "show_bottom_navbar_add_button", l: "Bouton « + » au centre de la barre" },
    { k: "messages", l: "Messagerie" }, { k: "notification", l: "Notifications" }, { k: "show_request_demo", l: "Contactez-nous" },
    { k: "show_theme_related_settings", l: "Choix du thème par l'utilisateur" }, { k: "enable_html_in_description", l: "Mise en forme des descriptions" },
  ] },
  { group: "Publicité", items: [
    { k: "show_ads", l: "Publicités (AdMob)" }, { k: "show_android_ads", l: "Sur Android" }, { k: "show_ios_ads", l: "Sur iPhone" },
  ] },
];

/** Couleurs éditables (clé, libellé), par mode. */
export const COLORS_MAIN: [string, string][] = [
  ["primary_color", "Couleur principale"], ["secondary_color", "Couleur secondaire"], ["slider_tint_color", "Accent (curseurs, liens)"],
  ["action_button_background_color", "Boutons d'action"], ["favourite_icon_tint_color", "Cœur des favoris"],
];
export const COLORS_BUTTONS: [string, string][] = [
  ["property_details_call_button_bg_color", "Bouton Appeler"], ["property_details_whatsapp_button_bg_color", "Bouton WhatsApp"],
  ["property_details_email_button_bg_color", "Bouton E-mail"], ["message_button_bg_color", "Bouton Message"],
  ["telegram_button_bg_color", "Bouton Telegram"], ["line_app_button_bg_color", "Bouton Line"],
];
export const COLORS_LIGHT: [string, string][] = [
  ["app_background_color_light_mode", "Fond de l'application"], ["headings_color_light_mode", "Titres"], ["icon_tint_color", "Icônes"],
  ["bottom_tab_bar_background_color_light", "Fond de la barre du bas"], ["bottom_tab_bar_tint_color", "Onglet actif"],
  ["un_selected_bottom_tab_bar_tint_color", "Onglets inactifs"], ["property_item_design_container_bg_color_light_mode", "Fond des cartes"],
  ["selected_item_background_color", "Choix sélectionné (filtres)"], ["featured_label_background_color", "Étiquette « Vedette »"],
  ["tag_background_color", "Fond des étiquettes"], ["divider_color_light_mode", "Séparateurs"],
  ["filter_page_headings_color_light_mode", "Titres des filtres"], ["filter_page_icon_tint_color_light_mode", "Icônes des filtres"],
];
export const COLORS_DARK: [string, string][] = [
  ["app_background_color_dark_mode", "Fond de l'application"], ["headings_color_dark_mode", "Titres"], ["icon_tint_color_dark_mode", "Icônes"],
  ["bottom_tab_bar_background_color_dark", "Fond de la barre du bas"], ["property_item_design_container_bg_color_dark_mode", "Fond des cartes"],
  ["selected_item_background_color_dark_mode", "Choix sélectionné (filtres)"], ["featured_tag_background_color_dark_mode", "Étiquette « Vedette »"],
  ["tag_background_color_dark_mode", "Fond des étiquettes"], ["divider_color_dark_mode", "Séparateurs"],
  ["segment_thumb_color_dark", "Sélecteur à onglets"], ["filter_page_icon_tint_color_dark_mode", "Icônes des filtres"],
];

/** Thèmes prêts à appliquer (couleurs claires et sombres cohérentes). */
export const PRESETS: { id: string; l: string; primary: string; secondary: string; accent: string; dark: string; card: string }[] = [
  { id: "moboo", l: "Moboo (bleu + orange)", primary: "0555CC", secondary: "FE6600", accent: "00AEFF", dark: "18191B", card: "242527" },
  { id: "orange", l: "Orange Moboo", primary: "FE6600", secondary: "0F172A", accent: "FB923C", dark: "1A1410", card: "2A211A" },
  { id: "nuit", l: "Nuit (marine + or)", primary: "0F2A4A", secondary: "D4A017", accent: "3B82F6", dark: "0B1220", card: "15203A" },
  { id: "emeraude", l: "Émeraude", primary: "047857", secondary: "F59E0B", accent: "10B981", dark: "0F1A16", card: "1A2A24" },
  { id: "bordeaux", l: "Bordeaux", primary: "8E1B3A", secondary: "E2A13B", accent: "D9466F", dark: "1B1114", card: "2A1A1F" },
  { id: "lagune", l: "Lagune (turquoise)", primary: "0E7490", secondary: "F97316", accent: "22D3EE", dark: "0E181B", card: "17272B" },
  { id: "graphite", l: "Graphite (sobre)", primary: "1F2937", secondary: "FE6600", accent: "6B7280", dark: "111111", card: "1E1E1E" },
];
export function applyPreset(cfg: Cfg, p: (typeof PRESETS)[number]): Cfg {
  const c = (hex: string, a = "FF") => `#${a}${hex}`.toUpperCase();
  return {
    ...cfg,
    primary_color: c(p.primary), secondary_color: c(p.secondary), slider_tint_color: c(p.accent),
    action_button_background_color: c(p.secondary), bottom_tab_bar_tint_color: c(p.primary), icon_tint_color: c(p.primary),
    property_details_email_button_bg_color: c(p.primary), property_details_call_button_bg_color: c(p.secondary),
    message_button_bg_color: c(p.primary), selected_item_background_color: c(p.accent), featured_label_background_color: c(p.accent),
    featured_tag_border_color_light_mode: c(p.accent), filter_page_icon_tint_color_light_mode: c(p.accent),
    app_background_color_dark_mode: c(p.dark), property_item_design_container_bg_color_dark_mode: c(p.card),
    segment_thumb_color_dark: c(p.accent),
  };
}

/** #AARRGGBB ⇄ #RRGGBB (champ couleur du navigateur). */
export const toCss = (v: unknown, fallback = "#000000") => {
  const s = String(v ?? "");
  if (/^#[0-9a-f]{8}$/i.test(s)) {
    const a = parseInt(s.slice(1, 3), 16) / 255;
    const rgb = s.slice(3);
    return a >= 0.999 ? `#${rgb}` : `rgba(${parseInt(rgb.slice(0, 2), 16)},${parseInt(rgb.slice(2, 4), 16)},${parseInt(rgb.slice(4, 6), 16)},${a.toFixed(2)})`;
  }
  return /^#[0-9a-f]{6}$/i.test(s) ? s : fallback;
};
export const toHex6 = (v: unknown) => {
  const s = String(v ?? "");
  return /^#[0-9a-f]{8}$/i.test(s) ? `#${s.slice(3)}` : /^#[0-9a-f]{6}$/i.test(s) ? s : "#000000";
};
export const alphaOf = (v: unknown) => (/^#[0-9a-f]{8}$/i.test(String(v ?? "")) ? String(v).slice(1, 3) : "FF");
