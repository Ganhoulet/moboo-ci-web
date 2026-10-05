// Espace « Moboo.ci pour les professionnels » (façon Zillow Partners) : catalogue
// des blocs (rendu + éditeur du back-office) et contenu par défaut des 6 pages.
import type { BlockDef, BlockField, Section } from "./page-blocks";

export const PRO_PAGES = [
  { slug: "pros", path: "/professionnels", label: "Accueil professionnels", short: "Tous les pros" },
  { slug: "pros-agents", path: "/professionnels/agents", label: "Agents immobiliers", short: "Agents" },
  { slug: "pros-agences", path: "/professionnels/agences", label: "Agences et promoteurs", short: "Agences & promoteurs" },
  { slug: "pros-proprietaires", path: "/professionnels/proprietaires", label: "Propriétaires", short: "Propriétaires" },
  { slug: "pros-residences", path: "/professionnels/residences", label: "Résidences meublées", short: "Résidences meublées" },
  { slug: "pros-espaces", path: "/professionnels/espaces", label: "Espaces événementiels", short: "Espaces événementiels" },
] as const;
export type ProSlug = (typeof PRO_PAGES)[number]["slug"];
export const proPage = (slug: string) => PRO_PAGES.find((p) => p.slug === slug);

export interface ProMeta { title: string; description: string }
export interface ProContent { sections: Section[]; meta: ProMeta }

const BG = [{ value: "white", label: "Blanc" }, { value: "soft", label: "Gris très clair" }, { value: "brand", label: "Bleu Moboo" }, { value: "dark", label: "Nuit" }];
const bg: BlockField = { key: "background", label: "Fond de la section", type: "select", options: BG };
const cta = (k: string, l: string): BlockField[] => [{ key: `${k}Label`, label: `${l} : texte`, type: "text" }, { key: `${k}Href`, label: `${l} : lien`, type: "url" }];
const STATS = [
  { value: "listings", label: "Annonces en ligne (réel)" }, { value: "pros", label: "Professionnels inscrits (réel)" },
  { value: "searches30", label: "Recherches sur 30 jours (réel)" }, { value: "inquiries30", label: "Demandes de clients sur 30 jours (réel)" },
  { value: "views30", label: "Vues d’annonces sur 30 jours (réel)" }, { value: "cities", label: "Villes couvertes (réel)" }, { value: "text", label: "Texte libre" },
];
const HELP = [
  { value: "", label: "Aucun" }, { value: "agents", label: "Agents immobiliers" }, { value: "agences", label: "Agences et promoteurs" },
  { value: "proprietaires", label: "Propriétaires" }, { value: "residences", label: "Hôtes de résidences" }, { value: "espaces", label: "Espaces événementiels" },
];
const AUD = [{ value: "agents", label: "Agent immobilier" }, { value: "agences", label: "Agence / promoteur" }, { value: "proprietaires", label: "Propriétaire" }, { value: "residences", label: "Résidences meublées" }, { value: "espaces", label: "Espace événementiel" }];

export const PRO_BLOCKS: BlockDef[] = [
  {
    type: "proHero", label: "Grand bandeau", icon: "🚀", description: "Titre d’accroche, texte, boutons, image ou capture, liens vers les autres profils.",
    fields: [
      { key: "eyebrow", label: "Petit titre au-dessus", type: "text" }, { key: "title", label: "Titre", type: "text" },
      { key: "subtitle", label: "Texte", type: "textarea" }, ...cta("primary", "Bouton principal"), ...cta("secondary", "Bouton secondaire"),
      { key: "image", label: "Image ou capture d’écran", type: "image" },
      { key: "showTabs", label: "Afficher les onglets des profils (Agents, Agences…)", type: "bool" },
    ],
    defaults: { eyebrow: "Moboo.ci pour les professionnels", title: "", subtitle: "", primaryLabel: "Créer mon compte pro", primaryHref: "/inscription", secondaryLabel: "Être rappelé", secondaryHref: "#contact", image: "", showTabs: true },
  },
  {
    type: "proStats", label: "Chiffres clés", icon: "📈", description: "Chiffres réels de la plateforme (calculés automatiquement) ou texte libre.",
    fields: [
      { key: "title", label: "Titre", type: "text" },
      { key: "items", label: "Chiffres", type: "list", itemLabel: "Chiffre", fields: [{ key: "source", label: "Valeur", type: "select", options: STATS }, { key: "value", label: "Valeur (texte libre)", type: "text" }, { key: "label", label: "Libellé", type: "text" }] },
      { key: "note", label: "Note sous les chiffres", type: "text" }, bg,
    ],
    defaults: { title: "", background: "white", note: "Chiffres réels de Moboo.ci, mis à jour automatiquement.", items: [] },
  },
  {
    type: "proFeatures", label: "Avantages (cartes)", icon: "✨", description: "Grille de cartes : icône, titre, texte, lien.",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "subtitle", label: "Texte", type: "textarea" },
      { key: "items", label: "Cartes", type: "list", itemLabel: "Carte", fields: [{ key: "icon", label: "Icône (emoji)", type: "text" }, { key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" }, { key: "href", label: "Lien (facultatif)", type: "url" }] },
      { key: "columns", label: "Colonnes", type: "select", options: [{ value: "3", label: "3" }, { value: "4", label: "4" }, { value: "2", label: "2" }] }, bg,
    ],
    defaults: { title: "", subtitle: "", columns: "3", background: "soft", items: [] },
  },
  {
    type: "proSplit", label: "Texte + capture", icon: "🖼", description: "Une fonctionnalité expliquée : texte, points clés, bouton et capture d’écran à côté.",
    fields: [
      { key: "eyebrow", label: "Petit titre", type: "text" }, { key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" },
      { key: "bullets", label: "Points clés", type: "list", itemLabel: "Point", fields: [{ key: "text", label: "Texte", type: "text" }] },
      ...cta("cta", "Bouton"), { key: "image", label: "Capture d’écran / image", type: "image" },
      { key: "imageSide", label: "Image à", type: "select", options: [{ value: "right", label: "Droite" }, { value: "left", label: "Gauche" }] }, bg,
    ],
    defaults: { eyebrow: "", title: "", text: "", bullets: [], ctaLabel: "", ctaHref: "", image: "", imageSide: "right", background: "white" },
  },
  {
    type: "proProducts", label: "Solutions / offres", icon: "🧰", description: "Les produits à mettre en avant (boost, vitrine, partenaire de zone…), avec badge et bouton.",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "subtitle", label: "Texte", type: "textarea" },
      { key: "items", label: "Solutions", type: "list", itemLabel: "Solution", fields: [{ key: "badge", label: "Badge (ex. Le plus choisi)", type: "text" }, { key: "icon", label: "Icône (emoji)", type: "text" }, { key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" }, { key: "price", label: "Prix / mention (facultatif)", type: "text" }, { key: "ctaLabel", label: "Bouton : texte", type: "text" }, { key: "href", label: "Bouton : lien", type: "url" }] }, bg,
    ],
    defaults: { title: "", subtitle: "", background: "white", items: [] },
  },
  {
    type: "proSteps", label: "Étapes", icon: "🪜", description: "Comment démarrer, en 3 ou 4 étapes numérotées.",
    fields: [{ key: "title", label: "Titre", type: "text" }, { key: "items", label: "Étapes", type: "list", itemLabel: "Étape", fields: [{ key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" }] }, ...cta("cta", "Bouton"), bg],
    defaults: { title: "Démarrer en quelques minutes", ctaLabel: "", ctaHref: "", background: "soft", items: [] },
  },
  {
    type: "proTestimonials", label: "Témoignages", icon: "💬", description: "Avis de vrais professionnels (avec leur accord). N’inventez jamais de témoignage.",
    fields: [{ key: "title", label: "Titre", type: "text" }, { key: "items", label: "Témoignages", type: "list", itemLabel: "Témoignage", fields: [{ key: "quote", label: "Citation", type: "textarea" }, { key: "name", label: "Nom", type: "text" }, { key: "role", label: "Activité, ville", type: "text" }, { key: "photo", label: "Photo", type: "image" }] }, bg],
    defaults: { title: "Ils développent leur activité avec Moboo.ci", background: "white", items: [] },
  },
  {
    type: "proGuides", label: "Guides et ressources", icon: "📚", description: "Guides du centre d’aide (automatiques) et liens vers vos ressources : contenu utile, bon pour le référencement.",
    fields: [
      { key: "title", label: "Titre", type: "text" }, { key: "subtitle", label: "Texte", type: "textarea" },
      { key: "helpAudience", label: "Guides du centre d’aide à afficher", type: "select", options: HELP },
      { key: "limit", label: "Nombre de guides automatiques", type: "number", min: 0, max: 12 },
      { key: "items", label: "Liens ajoutés à la main", type: "list", itemLabel: "Ressource", fields: [{ key: "title", label: "Titre", type: "text" }, { key: "text", label: "Résumé", type: "textarea" }, { key: "href", label: "Lien", type: "url" }] }, bg,
    ],
    defaults: { title: "Guides et conseils", subtitle: "", helpAudience: "", limit: 6, items: [], background: "soft" },
  },
  {
    type: "proFaq", label: "Questions fréquentes", icon: "❓", description: "Questions / réponses dépliables (aussi lues par Google).",
    fields: [{ key: "title", label: "Titre", type: "text" }, { key: "items", label: "Questions", type: "list", itemLabel: "Question", fields: [{ key: "q", label: "Question", type: "text" }, { key: "a", label: "Réponse", type: "textarea" }] }, bg],
    defaults: { title: "Questions fréquentes", background: "white", items: [] },
  },
  {
    type: "proLeadForm", label: "Formulaire « Être rappelé »", icon: "📞", description: "Un conseiller Moboo rappelle le professionnel (demandes dans Back-office → Professionnels → Demandes).",
    fields: [{ key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" }, { key: "audience", label: "Profil proposé par défaut", type: "select", options: AUD }, { key: "button", label: "Texte du bouton", type: "text" }, bg],
    defaults: { title: "Parlons de votre activité", text: "Laissez vos coordonnées : un conseiller Moboo vous rappelle pour vous présenter les solutions adaptées, sans engagement.", audience: "agents", button: "Être rappelé", background: "brand" },
  },
  {
    type: "proCta", label: "Bandeau d’appel à l’action", icon: "📣", description: "Dernier encouragement avec un ou deux boutons.",
    fields: [{ key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" }, ...cta("primary", "Bouton principal"), ...cta("secondary", "Bouton secondaire"), bg],
    defaults: { title: "", text: "", primaryLabel: "Créer mon compte", primaryHref: "/inscription", secondaryLabel: "", secondaryHref: "", background: "dark" },
  },
  {
    type: "proAudiences", label: "Profils (cartes)", icon: "🧭", description: "Cartes vers les pages de chaque profil professionnel.",
    fields: [{ key: "title", label: "Titre", type: "text" }, { key: "subtitle", label: "Texte", type: "textarea" }, { key: "items", label: "Cartes", type: "list", itemLabel: "Profil", fields: [{ key: "icon", label: "Icône (emoji)", type: "text" }, { key: "title", label: "Titre", type: "text" }, { key: "text", label: "Texte", type: "textarea" }, { key: "href", label: "Lien", type: "url" }, { key: "image", label: "Image", type: "image" }] }, bg],
    defaults: { title: "", subtitle: "", items: [], background: "white" },
  },
];
export const proBlockDef = (type: string) => PRO_BLOCKS.find((b) => b.type === type);

let seq = 0;
export const newProSection = (type: string): Section => ({
  id: `${type.toLowerCase().slice(0, 12)}-${Date.now().toString(36)}${(seq++).toString(36)}`,
  type, enabled: true, props: structuredClone(proBlockDef(type)?.defaults ?? {}),
});
let did = 0;
const s = (type: string, props: Record<string, unknown>, enabled = true): Section =>
  ({ id: `${type.toLowerCase().slice(0, 10)}-d${(did++).toString(36)}`, type, enabled, props: { ...structuredClone(proBlockDef(type)!.defaults), ...props } });

const stats = (...keys: [string, string][]) => s("proStats", { items: keys.map(([source, label]) => ({ source, value: "", label })) });
const lead = (audience: string, title?: string) => s("proLeadForm", { audience, ...(title ? { title } : {}) });
const sampleTestimonials = s("proTestimonials", { items: [{ quote: "Remplacez ce texte par l’avis d’un vrai professionnel qui a accepté d’être cité.", name: "Nom Prénom", role: "Agent immobilier, Cocody", photo: "" }] }, false);

/* ─── Contenu par défaut (modifiable dans le back-office) ───────────────── */

export const PRO_DEFAULTS: Record<ProSlug, ProContent> = {
  pros: {
    meta: { title: "Moboo.ci pour les professionnels de l’immobilier", description: "Agents, agences, promoteurs, propriétaires, résidences meublées et espaces événementiels : touchez les clients qui cherchent en Côte d’Ivoire, gérez vos demandes et développez votre activité avec Moboo.ci." },
    sections: [
      s("proHero", { title: "Développez votre activité immobilière avec Moboo.ci", subtitle: "Chaque jour, des milliers de personnes cherchent un logement, un bureau, un terrain, un meublé ou une salle sur Moboo.ci et dans l’application. Soyez là où vos clients vous cherchent.", primaryLabel: "Créer mon compte pro", primaryHref: "/inscription", secondaryLabel: "Être rappelé par un conseiller", secondaryHref: "#contact", image: "/aide/mon-espace.webp" }),
      stats(["listings", "annonces en ligne"], ["searches30", "recherches ces 30 derniers jours"], ["inquiries30", "demandes envoyées aux annonceurs (30 j)"], ["pros", "professionnels inscrits"]),
      s("proAudiences", { title: "Des solutions pour chaque métier", subtitle: "Choisissez votre profil pour découvrir comment Moboo.ci vous aide.", items: [
        { icon: "🧑‍💼", title: "Agents immobiliers", text: "Page pro, mandats, suivi des clients, visibilité dans votre quartier.", href: "/professionnels/agents", image: "" },
        { icon: "🏢", title: "Agences et promoteurs", text: "Toute l’agence et vos programmes, publication automatique par API ou WordPress.", href: "/professionnels/agences", image: "" },
        { icon: "🔑", title: "Propriétaires", text: "Louez ou vendez votre bien vous-même, sans commission.", href: "/professionnels/proprietaires", image: "" },
        { icon: "🛏️", title: "Résidences meublées", text: "Réservations en ligne, acompte sécurisé, application Moboo Resi.", href: "/professionnels/residences", image: "" },
        { icon: "🎉", title: "Espaces événementiels", text: "Salles, jardins, rooftops : devis, acompte et caution avec Moboo Event.", href: "/professionnels/espaces", image: "" },
      ] }),
      s("proProducts", { title: "Tous les outils pour être vu et choisi", subtitle: "Commencez gratuitement, puis accélérez avec les options de visibilité.", items: [
        { badge: "", icon: "🏠", title: "Annonces", text: "Publiez vos biens avec photos, prix et localisation. Les intéressés vous appellent, vous écrivent sur WhatsApp ou demandent une visite.", price: "", ctaLabel: "Publier", href: "/publier" },
        { badge: "Le plus efficace", icon: "🚀", title: "Boost par zone", text: "Votre annonce en tête des résultats d’une commune ou d’une ville, pendant 7, 15 ou 30 jours.", price: "", ctaLabel: "Découvrir", href: "/mon-espace/publicite" },
        { badge: "", icon: "🌟", title: "Vitrine premium", text: "Grand format dans les résultats, photos et vidéo mises en avant : idéal pour les biens d’exception et les programmes neufs.", price: "", ctaLabel: "Découvrir", href: "/mon-espace/publicite" },
        { badge: "", icon: "📍", title: "Partenaire de zone", text: "Soyez l’agent recommandé d’un quartier : votre profil apparaît auprès de tous ceux qui y cherchent.", price: "", ctaLabel: "Découvrir", href: "/mon-espace/publicite" },
        { badge: "", icon: "🔌", title: "API et WordPress", text: "Vos annonces publiées automatiquement depuis votre logiciel ou votre site WordPress (extension Moboo.ci Connect).", price: "", ctaLabel: "Documentation", href: "/developpeurs" },
        { badge: "", icon: "📱", title: "Moboo Resi et Moboo Event", text: "Les applications des hôtes : calendrier, réservations, acomptes sécurisés et promotions, publiés sur Moboo.ci.", price: "", ctaLabel: "En savoir plus", href: "/professionnels/residences" },
      ] }),
      s("proSplit", { eyebrow: "Votre tableau de bord", title: "Sachez ce que vos clients cherchent, près de chez vous", text: "Mon espace vous montre les recherches de la semaine dans votre zone, vos vues, vos demandes et les actions qui rapportent : répondre aux clients, renouveler une annonce, compléter votre profil.", bullets: [{ text: "Recherches de votre commune en temps réel" }, { text: "Vues, appels, WhatsApp et demandes par annonce" }, { text: "Rappels quand un client attend votre réponse" }], ctaLabel: "Créer mon compte", ctaHref: "/inscription", image: "/aide/mon-espace.webp", imageSide: "right", background: "soft" }),
      sampleTestimonials,
      s("proGuides", { title: "Guides pour les professionnels", subtitle: "Des conseils concrets pour publier, être vu et conclure.", helpAudience: "agents", limit: 6 }),
      s("proFaq", { items: [
        { q: "Combien coûte Moboo.ci pour un professionnel ?", a: "La création du compte est gratuite et vous pouvez publier vos premières annonces sans payer. Les forfaits permettent de publier davantage et de sponsoriser des annonces ; la publicité (boost, vitrine, partenaire de zone) se paie en crédits Moboo, par mobile money ou carte." },
        { q: "Moboo.ci prend-il une commission sur mes ventes ou locations ?", a: "Non. Les clients vous contactent directement. Seuls les acomptes des réservations de meublés et d’espaces passent par Moboo, pour protéger le client et l’hôte." },
        { q: "Comment obtenir le badge Vérifié ?", a: "Envoyez une pièce d’identité (et un document professionnel pour le badge Pro vérifié) depuis Mon espace → Vérification. Vos documents ne sont jamais publiés." },
        { q: "Puis-je être accompagné pour démarrer ?", a: "Oui : laissez vos coordonnées dans le formulaire ci-dessous, un conseiller Moboo vous rappelle." },
      ] }),
      lead("agents"),
      s("proCta", { title: "Prêt à recevoir plus de clients ?", text: "Créez votre compte en une minute avec votre numéro de téléphone.", primaryLabel: "Créer mon compte pro", primaryHref: "/inscription", secondaryLabel: "Voir les forfaits", secondaryHref: "/forfaits" }),
    ],
  },

  "pros-agents": {
    meta: { title: "Agents immobiliers : plus de mandats et de clients avec Moboo.ci", description: "Page professionnelle, publication de vos mandats, suivi des demandes, statistiques, badge Vérifié et visibilité par quartier : Moboo.ci, l’outil des agents immobiliers en Côte d’Ivoire." },
    sections: [
      s("proHero", { eyebrow: "Agents immobiliers", title: "Plus de clients, moins de temps perdu", subtitle: "Publiez vos mandats, recevez des demandes qualifiées et suivez chaque client jusqu’à la signature, depuis une seule application.", primaryLabel: "Créer mon compte agent", primaryHref: "/inscription", secondaryLabel: "Être rappelé", secondaryHref: "#contact", image: "/aide/demandes.webp" }),
      stats(["searches30", "recherches de clients (30 j)"], ["inquiries30", "demandes envoyées aux annonceurs (30 j)"], ["views30", "vues d’annonces (30 j)"], ["listings", "annonces en ligne"]),
      s("proFeatures", { title: "Tout ce dont un agent a besoin", subtitle: "Gratuit pour démarrer, sans commission sur vos affaires.", columns: "3", items: [
        { icon: "🪪", title: "Votre page professionnelle", text: "Photo, présentation, WhatsApp, réseaux, toutes vos annonces et vos avis : partagez-la comme une carte de visite.", href: "/aide/article/agent-demarrer" },
        { icon: "📥", title: "Demandes centralisées", text: "Appels, WhatsApp, messages et demandes de visite au même endroit, classés de « nouvelle » à « conclue ».", href: "/aide/article/agent-crm" },
        { icon: "📊", title: "Statistiques par annonce", text: "Vues, appels, WhatsApp et demandes jour par jour, pour savoir quoi ajuster.", href: "/aide/article/statistiques-annonces" },
        { icon: "✅", title: "Badge Vérifié", text: "Identité et activité contrôlées par Moboo : les clients font davantage confiance aux profils vérifiés.", href: "/aide/article/verification-badge" },
        { icon: "📍", title: "La demande de votre quartier", text: "Les recherches de la semaine dans votre commune : publiez en priorité ce que les clients cherchent.", href: "/aide/article/tableau-de-bord-pro" },
        { icon: "🔔", title: "Rappels intelligents", text: "Moboo vous prévient quand un client attend votre réponse ou qu’une annonce va expirer.", href: "" },
      ] }),
      s("proSplit", { eyebrow: "Suivi des clients", title: "Ne laissez plus un client sans réponse", text: "Chaque demande arrive dans votre tableau Demandes. Passez-la de « nouvelle » à « visite prévue », « négociation » puis « conclue », avec vos notes.", bullets: [{ text: "Toutes les demandes au même endroit" }, { text: "Étapes claires, notes par client" }, { text: "Relance automatique des demandes oubliées" }], ctaLabel: "Lire le guide", ctaHref: "/aide/article/agent-crm", image: "/aide/demandes.webp", imageSide: "right", background: "white" }),
      s("proSplit", { eyebrow: "Visibilité", title: "Soyez en tête là où vos clients cherchent", text: "Boostez une annonce sur une commune ou une ville, passez un bien d’exception en vitrine, ou devenez l’agent partenaire d’un quartier. Tout se règle en crédits Moboo, rechargeables par mobile money.", bullets: [{ text: "Boost par commune ou par ville, 7 à 30 jours" }, { text: "Vitrine premium grand format" }, { text: "Partenaire de zone : votre profil recommandé" }], ctaLabel: "Découvrir la publicité", ctaHref: "/aide/article/publicite-boost", image: "/aide/publicite.webp", imageSide: "left", background: "soft" }),
      s("proSteps", { title: "Démarrer en 4 étapes", ctaLabel: "Créer mon compte agent", ctaHref: "/inscription", items: [
        { title: "Créez votre compte", text: "Avec votre numéro de téléphone, profil « Agent immobilier »." },
        { title: "Complétez votre page pro", text: "Photo, présentation, WhatsApp : la confiance commence là." },
        { title: "Publiez vos mandats", text: "Photos, prix, quartier : en ligne en quelques minutes." },
        { title: "Recevez et suivez vos clients", text: "Répondez vite, suivez chaque demande jusqu’à la signature." },
      ] }),
      sampleTestimonials,
      s("proGuides", { title: "Guides pour les agents", helpAudience: "agents", limit: 6, items: [{ title: "Réussir vos photos et votre description", text: "Les annonces complètes reçoivent beaucoup plus de contacts.", href: "/aide/article/reussir-ses-photos" }] }),
      s("proFaq", { items: [
        { q: "Puis-je publier les biens de mes clients propriétaires ?", a: "Oui, c’est le rôle d’un compte agent. Assurez-vous d’avoir l’accord (mandat) du propriétaire et indiquez vos conditions, dont les frais d’agence, dans la description." },
        { q: "Combien d’annonces puis-je publier ?", a: "Vos premières annonces sont gratuites ; les forfaits permettent d’en publier davantage et d’en sponsoriser. Le détail est sur la page Forfaits." },
        { q: "Les clients me contactent-ils directement ?", a: "Oui : par téléphone, WhatsApp, message ou demande de visite. Moboo.ci ne prend pas de commission sur vos affaires." },
        { q: "Comment apparaître en premier dans mon quartier ?", a: "Avec le boost par zone (annonce en tête des résultats) ou l’offre Partenaire de zone (votre profil recommandé), depuis Mon espace → Publicité." },
      ] }),
      lead("agents", "Un conseiller pour lancer votre activité sur Moboo.ci"),
      s("proCta", { title: "Vos prochains clients cherchent déjà sur Moboo.ci", text: "Créez votre page pro et publiez vos mandats aujourd’hui.", primaryLabel: "Créer mon compte agent", primaryHref: "/inscription", secondaryLabel: "Voir les forfaits", secondaryHref: "/forfaits" }),
    ],
  },

  "pros-agences": {
    meta: { title: "Agences immobilières et promoteurs : votre vitrine sur Moboo.ci", description: "Présentez votre agence et vos programmes, publiez automatiquement par API ou WordPress, suivez les demandes, gérez forfaits et factures : Moboo.ci pour les agences et promoteurs immobiliers." },
    sections: [
      s("proHero", { eyebrow: "Agences et promoteurs", title: "Toute votre agence, visible partout en Côte d’Ivoire", subtitle: "Une vitrine pour votre marque, vos biens et vos programmes neufs, des demandes centralisées et une publication automatique depuis vos outils.", primaryLabel: "Créer le compte de l’agence", primaryHref: "/inscription", secondaryLabel: "Parler à un conseiller", secondaryHref: "#contact", image: "/aide/api.webp" }),
      stats(["listings", "annonces en ligne"], ["searches30", "recherches (30 j)"], ["inquiries30", "demandes de clients (30 j)"], ["cities", "villes couvertes"]),
      s("proFeatures", { title: "Pensé pour les équipes et les volumes", columns: "3", items: [
        { icon: "🏢", title: "Vitrine de l’agence", text: "Logo, présentation, tous vos biens et vos avis sur une page à votre nom.", href: "/aide/article/agence-demarrer" },
        { icon: "🔌", title: "API et extension WordPress", text: "Vos annonces envoyées automatiquement depuis votre logiciel ou votre site (Houzez et autres thèmes).", href: "/aide/article/agence-api-wordpress" },
        { icon: "🛡️", title: "Badge Pro vérifié", text: "RCCM, agrément : un gage de sérieux affiché sur toutes vos annonces.", href: "/aide/article/verification-badge" },
        { icon: "🏗️", title: "Programmes neufs en vitrine", text: "Grand format, photos et vidéo mises en avant pour vos lancements commerciaux.", href: "/aide/article/publicite-boost" },
        { icon: "📍", title: "Partenaire de zone", text: "Votre agence recommandée dans les quartiers où vous êtes implantés.", href: "/aide/article/publicite-boost" },
        { icon: "🧾", title: "Forfaits et factures", text: "Paiement mobile money ou carte, factures à votre raison sociale, téléchargeables.", href: "/aide/article/factures" },
      ] }),
      s("proSplit", { eyebrow: "Intégrations", title: "Publiez une fois, diffusez partout", text: "Reliez votre logiciel de gestion avec l’API Moboo.ci, ou installez l’extension WordPress Moboo.ci Connect : vos biens sont créés, mis à jour et retirés automatiquement, et les demandes reviennent dans vos outils.", bullets: [{ text: "Clés d’API avec droits par usage" }, { text: "Demandes envoyées en temps réel (webhook)" }, { text: "Compatible avec tous les thèmes WordPress" }], ctaLabel: "Voir la documentation", ctaHref: "/developpeurs", image: "/aide/api.webp", imageSide: "right", background: "white" }),
      s("proSplit", { eyebrow: "Pilotage", title: "Mesurez ce que rapporte chaque bien", text: "Vues, appels, WhatsApp et demandes par annonce et par jour, pour arbitrer vos budgets et vos prix.", bullets: [{ text: "Statistiques jour par jour" }, { text: "Suivi des demandes de « nouvelle » à « conclue »" }], ctaLabel: "Lire le guide", ctaHref: "/aide/article/statistiques-annonces", image: "/aide/statistiques.webp", imageSide: "left", background: "soft" }),
      sampleTestimonials,
      s("proGuides", { title: "Guides pour les agences", helpAudience: "agences", limit: 6 }),
      s("proFaq", { items: [
        { q: "Mes agents peuvent-ils avoir leur propre compte ?", a: "Oui : chaque agent crée son compte Agent immobilier ; contactez-nous pour relier les comptes de votre équipe à l’agence." },
        { q: "Puis-je importer toutes mes annonces ?", a: "Oui, avec l’API ou l’extension WordPress Moboo.ci Connect. Chaque annonce garde votre référence interne : une modification chez vous met à jour Moboo.ci." },
        { q: "Quels moyens de paiement ?", a: "Wave, Orange Money, MTN Money, Moov Money et carte bancaire ; la facture est émise automatiquement à votre raison sociale." },
      ] }),
      lead("agences", "Une démonstration pour votre agence"),
      s("proCta", { title: "Faites de Moboo.ci votre premier canal de clients", primaryLabel: "Créer le compte de l’agence", primaryHref: "/inscription", secondaryLabel: "Documentation API", secondaryHref: "/developpeurs" }),
    ],
  },

  "pros-proprietaires": {
    meta: { title: "Propriétaires : louez ou vendez votre bien sans commission", description: "Publiez gratuitement votre appartement, maison, villa ou terrain sur Moboo.ci : contacts directs, statistiques, conseils et prix du quartier pour louer ou vendre plus vite en Côte d’Ivoire." },
    sections: [
      s("proHero", { eyebrow: "Propriétaires", title: "Louez ou vendez votre bien, sans commission", subtitle: "Publiez votre annonce en quelques minutes et recevez les appels, messages WhatsApp et demandes de visite directement.", primaryLabel: "Publier mon bien", primaryHref: "/publier", secondaryLabel: "Comment ça marche", secondaryHref: "/aide/article/publier-une-annonce", image: "/aide/publier.webp" }),
      stats(["searches30", "recherches de logements et de biens (30 j)"], ["inquiries30", "demandes de clients (30 j)"], ["listings", "annonces en ligne"]),
      s("proFeatures", { title: "Pourquoi publier sur Moboo.ci", columns: "4", items: [
        { icon: "💸", title: "Sans commission", text: "Les intéressés vous contactent directement.", href: "" },
        { icon: "⏱️", title: "En ligne en quelques minutes", text: "Photos, prix, quartier : c’est tout.", href: "/aide/article/publier-une-annonce" },
        { icon: "📈", title: "Prix du quartier", text: "Fixez le bon prix grâce aux loyers et prix moyens.", href: "/prix-immobilier" },
        { icon: "🔒", title: "Adresse protégée", text: "Seule la zone apparaît sur la carte publique.", href: "" },
      ] }),
      s("proSplit", { eyebrow: "Résultats", title: "Voyez combien de personnes s’intéressent à votre bien", text: "Vues, appels, WhatsApp et demandes jour par jour : si les vues sont nombreuses mais les demandes rares, ajustez le prix ou les photos.", bullets: [{ text: "Statistiques par annonce" }, { text: "Suivi des demandes de visite" }, { text: "Baisse de prix mise en avant auprès des chercheurs" }], ctaLabel: "Publier mon bien", ctaHref: "/publier", image: "/aide/statistiques.webp", imageSide: "right", background: "white" }),
      s("proSteps", { title: "Comment ça marche", ctaLabel: "Publier mon bien", ctaHref: "/publier", items: [
        { title: "Créez votre compte", text: "Votre numéro de téléphone suffit." },
        { title: "Publiez votre bien", text: "Location ou vente, photos, prix, quartier." },
        { title: "Recevez les contacts", text: "Appels, WhatsApp, messages, demandes de visite." },
        { title: "Concluez", text: "Marquez le bien loué ou vendu en un clic." },
      ] }),
      s("proGuides", { title: "Conseils pour louer ou vendre vite", helpAudience: "proprietaires", limit: 6 }),
      s("proFaq", { items: [
        { q: "Est-ce gratuit ?", a: "La publication de vos premières annonces est gratuite. Des options payantes permettent de mettre votre bien en avant." },
        { q: "Je loue un meublé à la nuit, c’est ici ?", a: "Les résidences meublées réservables se publient avec l’application Moboo Resi : voir la page Résidences meublées." },
        { q: "Puis-je confier mon bien à un agent ?", a: "Oui : les agents immobiliers de Moboo.ci ont une page pro avec leurs annonces et leurs avis. Contactez-les directement." },
      ] }),
      s("proCta", { title: "Votre futur locataire ou acheteur est peut-être en train de chercher", primaryLabel: "Publier mon bien", primaryHref: "/publier", secondaryLabel: "Prix de mon quartier", secondaryHref: "/prix-immobilier", background: "brand" }),
    ],
  },

  "pros-residences": {
    meta: { title: "Résidences meublées : remplissez vos logements avec Moboo Resi", description: "Publiez vos appartements meublés sur Moboo.ci avec l’application Moboo Resi : réservations en ligne, acompte de 30 % sécurisé, alerte sonore, promotions et gestion des litiges." },
    sections: [
      s("proHero", { eyebrow: "Résidences meublées", title: "Plus de réservations, zéro impayé d’acompte", subtitle: "Avec l’application Moboo Resi, vos logements sont réservables sur Moboo.ci : le client paie 30 % d’acompte, conservé par Moboo jusqu’à son arrivée.", primaryLabel: "Devenir hôte", primaryHref: "/inscription", secondaryLabel: "Être rappelé", secondaryHref: "#contact", image: "/aide/residence.webp" }),
      stats(["searches30", "recherches sur Moboo.ci (30 j)"], ["listings", "annonces en ligne"], ["cities", "villes couvertes"]),
      s("proFeatures", { title: "Moboo Resi, l’application des hôtes", columns: "3", items: [
        { icon: "📅", title: "Calendrier à jour", text: "Disponibilités publiées en temps réel sur Moboo.ci, dates bloquées pour éviter les doubles réservations.", href: "" },
        { icon: "🔔", title: "Alerte sonore", text: "Votre téléphone sonne à chaque demande, comme une course VTC : vous répondez vite.", href: "/aide/article/resi-recevoir-reservation" },
        { icon: "💰", title: "Acompte sécurisé", text: "30 % payés par mobile money, versés après l’arrivée du client.", href: "/aide/article/resi-paiement-hote" },
        { icon: "🔐", title: "Code d’arrivée", text: "L’adresse exacte et le code ne sont envoyés qu’après paiement.", href: "" },
        { icon: "🏷️", title: "Promotions", text: "Remplissez vos dates libres avec des réductions affichées sur Moboo.ci.", href: "/aide/article/resi-promotions" },
        { icon: "⚖️", title: "Litiges encadrés", text: "En cas de désaccord, l’équipe Moboo fait la médiation sur pièces.", href: "/aide/article/resi-litiges" },
      ] }),
      s("proSplit", { eyebrow: "Sur Moboo.ci", title: "Une fiche qui donne envie de réserver", text: "Photos, équipements, calendrier, prix à la nuit et réservation en ligne en quelques clics. Les voyageurs voient la disponibilité réelle de vos logements.", bullets: [{ text: "Demande gratuite pour le client" }, { text: "Vous confirmez depuis l’application" }, { text: "Acompte encaissé avant l’arrivée" }], ctaLabel: "Le parcours du client", ctaHref: "/aide/article/reserver-une-residence", image: "/aide/residence.webp", imageSide: "right", background: "white" }),
      s("proSteps", { title: "Démarrer", ctaLabel: "Devenir hôte", ctaHref: "/inscription", items: [
        { title: "Téléchargez Moboo Resi", text: "Sur Google Play." },
        { title: "Créez vos logements", text: "Photos, prix à la nuit, équipements." },
        { title: "Publiez sur Moboo.ci", text: "Vos logements deviennent réservables." },
        { title: "Accueillez vos clients", text: "Code d’arrivée, acompte versé après l’arrivée." },
      ] }),
      s("proGuides", { title: "Guides pour les hôtes", helpAudience: "residences", limit: 6 }),
      s("proFaq", { items: [
        { q: "Quand suis-je payé ?", a: "L’acompte est conservé par Moboo jusqu’à l’arrivée du client, puis versé sur votre numéro mobile money. Le solde est réglé par le client sur place." },
        { q: "Puis-je garder mes autres canaux (Airbnb, Booking, direct) ?", a: "Oui : bloquez simplement les dates réservées ailleurs dans Moboo Resi pour éviter les doubles réservations." },
        { q: "Que se passe-t-il en cas de problème avec un client ?", a: "Le client peut ouvrir un litige ; vous répondez avec vos photos et l’équipe Moboo décide. Le versement de l’acompte est gelé pendant l’examen." },
      ] }),
      lead("residences", "Mettre votre résidence sur Moboo.ci"),
    ],
  },

  "pros-espaces": {
    meta: { title: "Espaces événementiels : faites louer votre salle avec Moboo Event", description: "Salles de fête, jardins, rooftops, salles de réunion : publiez votre espace sur Moboo.ci avec Moboo Event, envoyez des devis, encaissez l’acompte et la caution en toute sécurité." },
    sections: [
      s("proHero", { eyebrow: "Espaces événementiels", title: "Remplissez votre agenda d’événements", subtitle: "Mariages, anniversaires, baptêmes, séminaires : les organisateurs trouvent et réservent votre espace sur Moboo.ci. Vous gérez devis, acompte et caution avec Moboo Event.", primaryLabel: "Publier mon espace", primaryHref: "/inscription", secondaryLabel: "Être rappelé", secondaryHref: "#contact", image: "/aide/espace.webp" }),
      stats(["searches30", "recherches sur Moboo.ci (30 j)"], ["inquiries30", "demandes de clients (30 j)"], ["cities", "villes couvertes"]),
      s("proFeatures", { title: "Moboo Event, l’application des propriétaires d’espaces", columns: "3", items: [
        { icon: "🖼️", title: "Une belle fiche", text: "Jusqu’à 12 photos, capacité, équipements, horaires, caution et conditions d’annulation.", href: "/aide/article/demarrer-moboo-event" },
        { icon: "🧾", title: "Devis en quelques secondes", text: "Location, prestations, acompte et caution envoyés depuis l’application.", href: "/aide/article/event-devis" },
        { icon: "💳", title: "Acompte sécurisé", text: "Le client bloque la date en payant l’acompte par mobile money.", href: "/aide/article/event-paiements" },
        { icon: "🛡️", title: "Caution", text: "Restituée après l’événement si tout est en ordre.", href: "/aide/article/event-paiements" },
        { icon: "🏷️", title: "Promotions", text: "Une réduction sur une date libre, affichée avec compte à rebours.", href: "" },
        { icon: "🧮", title: "Caisse du jour J", text: "Enregistrez les encaissements de l’événement depuis la bulle flottante.", href: "" },
      ] }),
      s("proSplit", { eyebrow: "Sur Moboo.ci", title: "Les organisateurs voient vos dates libres", text: "Votre fiche montre la capacité, les équipements, les photos et les prochaines dates disponibles. Une demande arrive : votre téléphone sonne, vous envoyez le devis.", bullets: [{ text: "Demande gratuite pour l’organisateur" }, { text: "Devis et acompte depuis l’application" }, { text: "Signaux « Plus que 2 samedis libres » sur vos vraies disponibilités" }], ctaLabel: "Le parcours du client", ctaHref: "/aide/article/reserver-un-espace", image: "/aide/espace.webp", imageSide: "right", background: "white" }),
      s("proSteps", { title: "Démarrer", ctaLabel: "Publier mon espace", ctaHref: "/inscription", items: [
        { title: "Téléchargez Moboo Event", text: "Sur Google Play." },
        { title: "Créez votre annonce Moboo.ci", text: "Type d’espace, capacité, 12 photos, conditions." },
        { title: "Recevez les demandes", text: "Votre téléphone sonne à chaque demande." },
        { title: "Envoyez le devis, encaissez l’acompte", text: "La date est bloquée dès le paiement." },
      ] }),
      s("proGuides", { title: "Guides pour les espaces événementiels", helpAudience: "espaces", limit: 6 }),
      s("proFaq", { items: [
        { q: "Comment fixer mes conditions d’annulation ?", a: "Indiquez le délai d’annulation dans votre annonce Moboo Event : il est affiché sur la fiche avant la réservation." },
        { q: "Quelle différence entre espace de gestion et annonce Moboo.ci ?", a: "L’espace de gestion sert à gérer toutes vos réservations dans l’application ; l’annonce Moboo.ci est la fiche publique qui vous apporte de nouveaux clients." },
        { q: "La caution est-elle obligatoire ?", a: "Non, c’est vous qui décidez de son montant ; elle est indiquée sur la fiche et dans le devis." },
      ] }),
      lead("espaces", "Mettre votre espace sur Moboo.ci"),
    ],
  },
};

export function normalizePro(slug: ProSlug, c: Partial<ProContent> | null | undefined): ProContent {
  const d = PRO_DEFAULTS[slug];
  if (!c?.sections?.length) return { sections: d.sections, meta: { ...d.meta, ...(c?.meta ?? {}) } };
  return {
    meta: { ...d.meta, ...(c.meta ?? {}) },
    sections: c.sections.filter((x) => proBlockDef(x.type)).map((x) => ({ ...x, props: { ...structuredClone(proBlockDef(x.type)!.defaults), ...(x.props ?? {}) } })),
  };
}
