// Éléments avancés « Immobilier & PropTech » du constructeur : recherche d'annonces,
// calculateurs, prix du marché, fiche quartier, visite virtuelle, lots d'un programme…
import type { BlockDef } from "./page-blocks";
import { ELEMENT_STYLE } from "./base-blocks";

const opt = (pairs: [string, string][]) => pairs.map(([value, label]) => ({ value, label }));
const style = { align: "left", width: "normal", spacing: "normal", background: "white", bgColor: "", anchor: "" };
const TX = opt([["rent", "Louer"], ["sale", "Acheter"], ["furnished", "Meublés"], ["event", "Espaces"]]);

export const IMMO_BLOCKS: BlockDef[] = [
  {
    type: "searchBar", label: "Barre de recherche d’annonces", icon: "🔍", group: "immo",
    description: "Recherche compacte : louer / acheter, quartier, budget max → page des annonces.",
    fields: [
      { key: "title", label: "Titre (facultatif)", type: "text" },
      { key: "transactions", label: "Onglets proposés", type: "multi", options: TX },
      { key: "placeholder", label: "Texte du champ « Où ? »", type: "text" },
      { key: "showBudget", label: "Afficher le budget maximum", type: "bool" },
      { key: "button", label: "Texte du bouton", type: "text" },
      ...ELEMENT_STYLE,
    ],
    defaults: { title: "Trouvez votre prochain logement", transactions: ["rent", "sale", "furnished"], placeholder: "Commune, quartier ou ville", showBudget: true, button: "Rechercher", ...style, width: "narrow", align: "center", background: "soft" },
  },
  {
    type: "rentBudget", label: "Calculateur de budget loyer", icon: "🧮", group: "immo",
    description: "Le visiteur saisit ses revenus : loyer conseillé (règle du tiers) et lien vers les annonces à ce prix.",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" },
      { key: "ratio", label: "Part des revenus conseillée (%)", type: "number", min: 10, max: 60 },
      ...ELEMENT_STYLE,
    ],
    defaults: { title: "Quel loyer pouvez-vous payer ?", text: "Les bailleurs demandent souvent des revenus d’au moins 3 fois le loyer.", ratio: 33, ...style, width: "narrow" },
  },
  {
    type: "rentalYield", label: "Calculateur de rentabilité locative", icon: "📈", group: "immo",
    description: "Prix d’achat, loyer, charges : rendement brut et net, retour sur investissement en années.",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" },
      { key: "price", label: "Prix d’achat proposé par défaut (FCFA)", type: "number" },
      { key: "rent", label: "Loyer mensuel par défaut (FCFA)", type: "number" },
      { key: "charges", label: "Charges annuelles par défaut (%)", type: "number", min: 0, max: 50 },
      ...ELEMENT_STYLE,
    ],
    defaults: { title: "Votre investissement est-il rentable ?", text: "Calculez le rendement d’un bien mis en location.", price: 40_000_000, rent: 350_000, charges: 15, ...style },
  },
  {
    type: "marketPrices", label: "Prix du marché par commune", icon: "📊", group: "immo",
    description: "Loyers et prix de vente médians des communes, tirés des annonces Moboo (mis à jour automatiquement).",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "subtitle", label: "Sous-titre", type: "text" },
      { key: "communes", label: "Communes à afficher (séparées par des virgules ; vide : les plus fournies)", type: "text" },
      { key: "limit", label: "Nombre de communes", type: "number", min: 3, max: 30 },
      { key: "show", label: "Colonnes", type: "select", options: opt([["both", "Loyer et vente"], ["rent", "Loyer seulement"], ["sale", "Vente seulement"]]) },
      ...ELEMENT_STYLE,
    ],
    defaults: { title: "Prix de l’immobilier par commune", subtitle: "Médianes des annonces publiées sur Moboo", communes: "", limit: 8, show: "both", ...style },
  },
  {
    type: "neighborhood", label: "Fiche quartier", icon: "🏘️", group: "immo",
    description: "Présentation d’un quartier : photo, points forts, prix indicatifs, lien vers ses annonces.",
    fields: [
      { key: "name", label: "Quartier / commune", type: "text" }, { key: "image", label: "Photo", type: "image" },
      { key: "text", label: "Présentation", type: "textarea" },
      { key: "rent", label: "Loyer indicatif (texte libre)", type: "text" }, { key: "sale", label: "Prix de vente indicatif (texte libre)", type: "text" },
      { key: "items", label: "Points forts", type: "list", itemLabel: "Point fort", fields: [{ key: "icon", label: "Icône", type: "icon" }, { key: "text", label: "Texte", type: "text" }] },
      { key: "searchQuery", label: "Recherche des annonces (ex. Cocody)", type: "text" },
      ...ELEMENT_STYLE,
    ],
    defaults: {
      name: "Cocody Angré", image: "", text: "Quartier résidentiel calme, prisé des familles, proche des écoles et des commerces.", rent: "à partir de 250 000 FCFA / mois", sale: "à partir de 60 000 000 FCFA",
      items: [{ icon: "ampoule", text: "Électricité stable" }, { icon: "livre", text: "Écoles à proximité" }, { icon: "magasin", text: "Supermarchés" }], searchQuery: "Angré", ...style,
    },
  },
  {
    type: "pricingTable", label: "Tableau de prix / forfaits", icon: "💳", group: "immo",
    description: "Offres côte à côte (prix, avantages, bouton), une offre mise en avant.",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "subtitle", label: "Sous-titre", type: "text" },
      { key: "items", label: "Offres", type: "list", itemLabel: "Offre", fields: [
        { key: "name", label: "Nom", type: "text" }, { key: "price", label: "Prix", type: "text" }, { key: "period", label: "Période (ex. / mois)", type: "text" },
        { key: "features", label: "Avantages (un par ligne)", type: "textarea" }, { key: "buttonLabel", label: "Bouton", type: "text" }, { key: "buttonHref", label: "Lien", type: "url" },
        { key: "featured", label: "Mettre en avant", type: "bool" },
      ] },
      ...ELEMENT_STYLE,
    ],
    defaults: {
      title: "Choisissez votre formule", subtitle: "", ...style, align: "center",
      items: [
        { name: "Particulier", price: "Gratuit", period: "", features: "1 annonce\nContact direct\nPhotos illimitées", buttonLabel: "Publier", buttonHref: "/publier", featured: false },
        { name: "Agent", price: "15 000 FCFA", period: "/ mois", features: "Annonces illimitées\nBadge vérifié\nMise en avant", buttonLabel: "Choisir", buttonHref: "/forfaits", featured: true },
        { name: "Agence", price: "45 000 FCFA", period: "/ mois", features: "Équipe d’agents\nPage agence\nStatistiques", buttonLabel: "Choisir", buttonHref: "/forfaits", featured: false },
      ],
    },
  },
  {
    type: "lotsTable", label: "Lots d’un programme / lotissement", icon: "🏗️", group: "immo",
    description: "Tableau des lots ou logements d’un programme neuf : type, surface, prix, disponibilité.",
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "items", label: "Lots", type: "list", itemLabel: "Lot", fields: [
        { key: "lot", label: "Lot", type: "text" }, { key: "type", label: "Type", type: "text" }, { key: "surface", label: "Surface", type: "text" },
        { key: "price", label: "Prix", type: "text" },
        { key: "status", label: "Disponibilité", type: "select", options: opt([["available", "Disponible"], ["reserved", "Réservé"], ["sold", "Vendu"]]) },
      ] },
      { key: "buttonLabel", label: "Bouton (ex. Réserver un lot)", type: "text" }, { key: "buttonHref", label: "Lien du bouton", type: "url" },
      ...ELEMENT_STYLE,
    ],
    defaults: {
      title: "Lots disponibles", buttonLabel: "Être rappelé", buttonHref: "/aide", ...style,
      items: [
        { lot: "A-01", type: "Terrain 500 m²", surface: "500 m²", price: "12 500 000 FCFA", status: "available" },
        { lot: "A-02", type: "Terrain 600 m²", surface: "600 m²", price: "15 000 000 FCFA", status: "reserved" },
        { lot: "A-03", type: "Villa F4", surface: "180 m²", price: "65 000 000 FCFA", status: "sold" },
      ],
    },
  },
  {
    type: "virtualTour", label: "Visite virtuelle 360°", icon: "🥽", group: "immo",
    description: "Visite 3D / 360° (Matterport, Kuula, CloudPano, Momento360, YouTube 360…).",
    fields: [
      { key: "url", label: "Lien de la visite", type: "url" }, { key: "title", label: "Titre", type: "text" },
      { key: "height", label: "Hauteur (pixels)", type: "number", min: 300, max: 900 },
      ...ELEMENT_STYLE,
    ],
    defaults: { url: "", title: "Visitez le bien comme si vous y étiez", height: 520, ...style },
  },
  {
    type: "whatsappCta", label: "Contact WhatsApp", icon: "💬", group: "immo",
    description: "Bouton qui ouvre WhatsApp avec un message déjà écrit (agent, agence, service client).",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" },
      { key: "phone", label: "Numéro WhatsApp (ex. +225 07 00 00 00 00)", type: "text" },
      { key: "message", label: "Message pré-rempli", type: "textarea" }, { key: "button", label: "Texte du bouton", type: "text" },
      ...ELEMENT_STYLE,
    ],
    defaults: { title: "Une question sur un bien ?", text: "Un conseiller Moboo vous répond rapidement.", phone: "", message: "Bonjour, je vous contacte depuis Moboo.ci.", button: "Écrire sur WhatsApp", ...style, align: "center", width: "narrow", background: "soft" },
  },
  {
    type: "countdown", label: "Compte à rebours (lancement)", icon: "⏳", group: "immo",
    description: "Ouverture des réservations d’un programme, fin d’une offre, journée portes ouvertes…",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "date", label: "Date et heure (AAAA-MM-JJ HH:MM)", type: "text" },
      { key: "ended", label: "Texte une fois la date passée", type: "text" },
      { key: "buttonLabel", label: "Bouton", type: "text" }, { key: "buttonHref", label: "Lien", type: "url" },
      ...ELEMENT_STYLE,
    ],
    defaults: { title: "Ouverture des réservations dans", date: "2027-01-15 09:00", ended: "Les réservations sont ouvertes !", buttonLabel: "Je suis intéressé", buttonHref: "/aide", ...style, align: "center", background: "brand" },
  },
  {
    type: "trustBadges", label: "Badges de confiance", icon: "🛡️", group: "immo",
    description: "Garanties en ligne : annonces vérifiées, paiement sécurisé, mobile money, assistance…",
    fields: [
      { key: "items", label: "Badges", type: "list", itemLabel: "Badge", fields: [{ key: "icon", label: "Icône", type: "icon" }, { key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "text" }] },
      ...ELEMENT_STYLE,
    ],
    defaults: {
      ...style, spacing: "small", align: "center",
      items: [
        { icon: "bouclier", title: "Annonces vérifiées", text: "Contrôlées par l’équipe Moboo" },
        { icon: "cadenas", title: "Paiement sécurisé", text: "Acompte protégé jusqu’à l’arrivée" },
        { icon: "mobile", title: "Mobile money", text: "Orange, MTN, Moov, Wave" },
        { icon: "message", title: "Assistance", text: "Réponse rapide sur WhatsApp" },
      ],
    },
  },
];
