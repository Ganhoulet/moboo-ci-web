// Éléments de base façon Elementor : titre, paragraphe, image, boutons, colonnes,
// encadré, icône, vidéo YouTube, séparateur, onglets… Disponibles dans tous les
// constructeurs (accueil, pages du site, pages libres) et en modification directe.
import type { BlockDef, BlockField } from "./page-blocks";

const opt = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));

/** Réglages communs à tous les éléments : fond, marges, alignement, largeur. */
export const ELEMENT_STYLE: BlockField[] = [
  { key: "align", label: "Alignement", type: "select", options: opt([["left", "À gauche"], ["center", "Centré"], ["right", "À droite"]]) },
  { key: "width", label: "Largeur du contenu", type: "select", options: opt([["narrow", "Étroite (texte)"], ["normal", "Normale"], ["full", "Toute la largeur"]]) },
  { key: "spacing", label: "Marges haut et bas", type: "select", options: opt([["none", "Aucune"], ["small", "Petites"], ["normal", "Normales"], ["large", "Grandes"]]) },
  { key: "background", label: "Fond", type: "select", options: opt([["white", "Blanc"], ["soft", "Gris très clair"], ["brand", "Bleu Moboo"], ["accent", "Orange clair"], ["dark", "Noir"], ["custom", "Couleur choisie"]]) },
  { key: "bgColor", label: "Couleur de fond (si « Couleur choisie »)", type: "color" },
  { key: "anchor", label: "Ancre (lien #…)", type: "text", help: "Ex. « contact » : un bouton vers #contact descend jusqu’ici." },
];
const style = { align: "left", width: "normal", spacing: "small", background: "white", bgColor: "", anchor: "" };

const SIZE = opt([["small", "Petite"], ["normal", "Normale"], ["large", "Grande"], ["xl", "Très grande"]]);
const BTN_STYLE = opt([["primary", "Orange (principal)"], ["dark", "Noir"], ["brand", "Bleu Moboo"], ["outline", "Contour"], ["light", "Blanc"], ["link", "Simple lien"]]);

export const BASE_BLOCKS: BlockDef[] = [
  {
    type: "heading", label: "Titre", icon: "🅷", group: "base",
    description: "Un titre (H1 à H4), sa taille et sa couleur.",
    fields: [
      { key: "text", label: "Texte du titre", type: "text" },
      { key: "level", label: "Niveau", type: "select", options: opt([["h1", "H1 (titre de page)"], ["h2", "H2"], ["h3", "H3"], ["h4", "H4"]]) },
      { key: "size", label: "Taille", type: "select", options: SIZE },
      { key: "color", label: "Couleur du texte", type: "color" },
      { key: "eyebrow", label: "Petit texte au-dessus (facultatif)", type: "text" },
      ...ELEMENT_STYLE,
    ],
    defaults: { text: "Votre titre ici", level: "h2", size: "large", color: "", eyebrow: "", ...style },
  },
  {
    type: "paragraph", label: "Paragraphe", icon: "¶", group: "base",
    description: "Du texte simple (les retours à la ligne sont gardés).",
    fields: [
      { key: "text", label: "Texte", type: "textarea" },
      { key: "size", label: "Taille du texte", type: "select", options: SIZE },
      { key: "color", label: "Couleur du texte", type: "color" },
      ...ELEMENT_STYLE,
    ],
    defaults: { text: "Écrivez votre texte ici. Présentez votre offre, vos avantages, vos conditions…", size: "normal", color: "", ...style, width: "narrow" },
  },
  {
    type: "image", label: "Image", icon: "🖼️", group: "base",
    description: "Une image téléversée, avec légende et lien.",
    fields: [
      { key: "image", label: "Image", type: "image" },
      { key: "alt", label: "Description de l’image (pour Google et l’accessibilité)", type: "text" },
      { key: "size", label: "Taille", type: "select", options: opt([["small", "Petite"], ["medium", "Moyenne"], ["large", "Grande"], ["full", "Toute la largeur"]]) },
      { key: "ratio", label: "Format", type: "select", options: opt([["auto", "Original"], ["16/9", "Paysage 16:9"], ["4/3", "4:3"], ["1/1", "Carré"], ["3/4", "Portrait"]]) },
      { key: "rounded", label: "Coins arrondis", type: "bool" },
      { key: "shadow", label: "Ombre", type: "bool" },
      { key: "caption", label: "Légende (facultatif)", type: "text" },
      { key: "href", label: "Lien au clic (facultatif)", type: "url" },
      ...ELEMENT_STYLE,
    ],
    defaults: { image: "", alt: "", size: "large", ratio: "auto", rounded: true, shadow: false, caption: "", href: "", ...style, align: "center" },
  },
  {
    type: "buttons", label: "Bouton(s)", icon: "🔘", group: "base",
    description: "Un ou plusieurs boutons côte à côte.",
    fields: [
      { key: "items", label: "Boutons", type: "list", itemLabel: "Bouton", fields: [
        { key: "label", label: "Texte", type: "text" }, { key: "href", label: "Lien", type: "url" },
        { key: "style", label: "Style", type: "select", options: BTN_STYLE }, { key: "newTab", label: "Ouvrir dans un nouvel onglet", type: "bool" },
      ] },
      { key: "size", label: "Taille", type: "select", options: opt([["small", "Petite"], ["normal", "Normale"], ["large", "Grande"]]) },
      ...ELEMENT_STYLE,
    ],
    defaults: { items: [{ label: "Commencer", href: "/publier", style: "primary", newTab: false }], size: "normal", ...style },
  },
  {
    type: "columns", label: "Colonnes (Flexbox)", icon: "▦", group: "base",
    description: "2 à 4 colonnes côte à côte : icône ou image, titre, texte, bouton. Une colonne sous l’autre sur téléphone.",
    fields: [
      { key: "columns", label: "Colonnes sur ordinateur", type: "select", options: opt([["2", "2"], ["3", "3"], ["4", "4"]]) },
      { key: "card", label: "Présentation", type: "select", options: opt([["none", "Sans cadre"], ["border", "Cadre fin"], ["shadow", "Carte avec ombre"], ["soft", "Fond gris clair"]]) },
      { key: "items", label: "Colonnes", type: "list", itemLabel: "Colonne", fields: [
        { key: "icon", label: "Icône (facultatif)", type: "icon" }, { key: "image", label: "Image (facultatif)", type: "image" },
        { key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" },
        { key: "buttonLabel", label: "Bouton", type: "text" }, { key: "buttonHref", label: "Lien du bouton", type: "url" },
      ] },
      ...ELEMENT_STYLE,
    ],
    defaults: {
      columns: "3", card: "border", ...style, spacing: "normal",
      items: [
        { icon: "cle", image: "", title: "Louer", text: "Des logements vérifiés, contact direct avec le propriétaire.", buttonLabel: "", buttonHref: "" },
        { icon: "maison", image: "", title: "Acheter", text: "Maisons, terrains et immeubles partout en Côte d’Ivoire.", buttonLabel: "", buttonHref: "" },
        { icon: "calendrier", image: "", title: "Réserver", text: "Meublés et espaces à réserver en ligne, acompte sécurisé.", buttonLabel: "", buttonHref: "" },
      ],
    },
  },
  {
    type: "box", label: "Encadré (Div Block)", icon: "▢", group: "base",
    description: "Un bloc coloré avec titre, texte, image et bouton : mise en avant, offre, contact.",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" },
      { key: "image", label: "Image (facultatif)", type: "image" },
      { key: "imagePosition", label: "Position de l’image", type: "select", options: opt([["left", "À gauche"], ["right", "À droite"], ["top", "Au-dessus"]]) },
      { key: "buttonLabel", label: "Bouton", type: "text" }, { key: "buttonHref", label: "Lien du bouton", type: "url" },
      { key: "boxColor", label: "Couleur de l’encadré", type: "color" },
      { key: "textColor", label: "Couleur du texte", type: "color" },
      { key: "border", label: "Bordure", type: "bool" },
      ...ELEMENT_STYLE,
    ],
    defaults: { title: "Besoin d’aide ?", text: "Notre équipe vous répond sur WhatsApp du lundi au samedi.", image: "", imagePosition: "right", buttonLabel: "Nous écrire", buttonHref: "/aide", boxColor: "#eef4ff", textColor: "", border: false, ...style, spacing: "normal" },
  },
  {
    type: "icon", label: "Icône / SVG", icon: "◇", group: "base",
    description: "Une icône Moboo ou une image SVG, avec un titre et un texte dessous.",
    fields: [
      { key: "icon", label: "Icône", type: "icon" },
      { key: "svg", label: "Ou image SVG / PNG à la place", type: "image" },
      { key: "iconSize", label: "Taille (pixels)", type: "number", min: 16, max: 160 },
      { key: "color", label: "Couleur de l’icône", type: "color" },
      { key: "title", label: "Titre (facultatif)", type: "text" }, { key: "text", label: "Texte (facultatif)", type: "textarea" },
      ...ELEMENT_STYLE,
    ],
    defaults: { icon: "bouclier", svg: "", iconSize: 48, color: "", title: "Paiement sécurisé", text: "Votre acompte est protégé jusqu’à votre arrivée.", ...style, align: "center" },
  },
  {
    type: "youtube", label: "Vidéo YouTube", icon: "▶️", group: "base",
    description: "Collez le lien d’une vidéo YouTube (ou Shorts).",
    fields: [
      { key: "url", label: "Lien YouTube", type: "url" },
      { key: "title", label: "Titre (facultatif)", type: "text" },
      { key: "ratio", label: "Format", type: "select", options: opt([["16/9", "Paysage 16:9"], ["9/16", "Vertical (Shorts)"], ["4/3", "4:3"]]) },
      ...ELEMENT_STYLE,
    ],
    defaults: { url: "", title: "", ratio: "16/9", ...style, align: "center" },
  },
  {
    type: "divider", label: "Séparateur / espace", icon: "➖", group: "base",
    description: "Une ligne ou un espace vide entre deux blocs.",
    fields: [
      { key: "kind", label: "Type", type: "select", options: opt([["line", "Ligne"], ["dashed", "Tirets"], ["dotted", "Pointillés"], ["space", "Espace vide"]]) },
      { key: "height", label: "Hauteur de l’espace (pixels)", type: "number", min: 0, max: 200 },
      { key: "color", label: "Couleur de la ligne", type: "color" },
      ...ELEMENT_STYLE,
    ],
    defaults: { kind: "line", height: 24, color: "", ...style },
  },
  {
    type: "tabs", label: "Onglets / accordéon", icon: "🗂️", group: "base",
    description: "Contenus rangés dans des onglets, ou en questions qui se déplient.",
    fields: [
      { key: "mode", label: "Présentation", type: "select", options: opt([["tabs", "Onglets"], ["accordion", "Accordéon"]]) },
      { key: "items", label: "Onglets", type: "list", itemLabel: "Onglet", fields: [
        { key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" }, { key: "image", label: "Image (facultatif)", type: "image" },
      ] },
      ...ELEMENT_STYLE,
    ],
    defaults: {
      mode: "tabs", ...style, spacing: "normal",
      items: [
        { title: "Locataires", text: "Trouvez un logement vérifié et contactez directement le propriétaire.", image: "" },
        { title: "Propriétaires", text: "Publiez gratuitement et recevez des demandes qualifiées.", image: "" },
        { title: "Agents", text: "Gérez vos mandats, vos visites et vos clients avec Moboo Pro.", image: "" },
      ],
    },
  },
  // ─── Éléments en plus (enrichis) ─────────────────────────────────────────
  {
    type: "checklist", label: "Liste à coches", icon: "✅", group: "base",
    description: "Avantages ou étapes avec une coche devant chaque ligne.",
    fields: [
      { key: "title", label: "Titre (facultatif)", type: "text" },
      { key: "items", label: "Lignes", type: "list", itemLabel: "Ligne", fields: [{ key: "text", label: "Texte", type: "text" }] },
      { key: "columns", label: "Colonnes", type: "select", options: opt([["1", "1"], ["2", "2"]]) },
      ...ELEMENT_STYLE,
    ],
    defaults: { title: "", columns: "1", items: [{ text: "Annonces vérifiées" }, { text: "Contact direct, sans commission" }, { text: "Paiement sécurisé" }], ...style, width: "narrow" },
  },
  {
    type: "quote", label: "Citation / témoignage", icon: "❝", group: "base",
    description: "Une phrase mise en avant avec son auteur et sa photo.",
    fields: [
      { key: "text", label: "Citation", type: "textarea" }, { key: "author", label: "Auteur", type: "text" },
      { key: "role", label: "Fonction / ville", type: "text" }, { key: "photo", label: "Photo", type: "image" },
      ...ELEMENT_STYLE,
    ],
    defaults: { text: "J’ai trouvé mon appartement en une semaine, sans payer de commission.", author: "Awa K.", role: "Locataire à Cocody", photo: "", ...style, align: "center", width: "narrow", spacing: "normal" },
  },
  {
    type: "numbers", label: "Chiffres", icon: "🔢", group: "base",
    description: "Des chiffres mis en avant (ex. 10 000 annonces, 24 h…).",
    fields: [
      { key: "items", label: "Chiffres", type: "list", itemLabel: "Chiffre", fields: [{ key: "value", label: "Chiffre", type: "text" }, { key: "label", label: "Texte", type: "text" }] },
      { key: "color", label: "Couleur des chiffres", type: "color" },
      ...ELEMENT_STYLE,
    ],
    defaults: { items: [{ value: "10 000+", label: "annonces" }, { value: "24 h", label: "pour une réponse" }, { value: "0 %", label: "de commission" }], color: "", ...style, align: "center", spacing: "normal" },
  },
  {
    type: "gallery", label: "Galerie d’images", icon: "🖼", group: "base",
    description: "Plusieurs images en grille.",
    fields: [
      { key: "items", label: "Images", type: "list", itemLabel: "Image", fields: [{ key: "image", label: "Image", type: "image" }, { key: "caption", label: "Légende", type: "text" }] },
      { key: "columns", label: "Colonnes", type: "select", options: opt([["2", "2"], ["3", "3"], ["4", "4"]]) },
      { key: "ratio", label: "Format", type: "select", options: opt([["4/3", "4:3"], ["1/1", "Carré"], ["16/9", "16:9"], ["3/4", "Portrait"]]) },
      ...ELEMENT_STYLE,
    ],
    defaults: { items: [], columns: "3", ratio: "4/3", ...style, spacing: "normal" },
  },
  {
    type: "map", label: "Carte (adresse)", icon: "📍", group: "base",
    description: "Une carte Google Maps à partir d’une adresse ou d’un quartier.",
    fields: [
      { key: "address", label: "Adresse ou lieu", type: "text" },
      { key: "zoom", label: "Zoom (1 à 20)", type: "number", min: 1, max: 20 },
      { key: "height", label: "Hauteur (pixels)", type: "number", min: 200, max: 700 },
      ...ELEMENT_STYLE,
    ],
    defaults: { address: "Cocody, Abidjan", zoom: 14, height: 360, ...style, spacing: "normal" },
  },
];
