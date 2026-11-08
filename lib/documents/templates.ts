import livreBlanc from "./data/livre-blanc-page-pro.json";
import { DEFAULT_FOOTER, newPage, uid, type Block, type DocData, type DocFormat, type DocKind } from "./types";

export interface DocTemplate { key: string; name: string; description: string; kind: DocKind; format: DocFormat; title: string; editionDate?: string; needsZone?: boolean; build: () => DocData }

const id = uid;
const settings = (author = "") => ({ footer: DEFAULT_FOOTER, author });
const h = (kicker: string, title: string, toc: "none" | "chapter" | "sub", lead = ""): Block => ({ id: id(), type: "heading", kicker, title, lead, toc, tocLabel: "" });
const text = (t: string): Block => ({ id: id(), type: "text", html: `<p>${t}</p>` });
const tip = (title: string, t: string): Block => ({ id: id(), type: "callout", tone: "tip", title, text: t });

/** Page d'ouverture d'une partie, puis une page par chapitre avec ses deux encadrés. */
const PARTS: { name: string; chapters: [string, string][] }[] = [
  { name: "Devenir un professionnel", chapters: [["1", "Du démarcheur au professionnel"], ["2", "L’équation de la rentabilité"], ["3", "Votre vitrine en ligne"]] },
  { name: "Trouver des mandats", chapters: [["4", "Les sources de mandats"], ["5", "Les scripts de prospection"], ["6", "Signer un mandat"]] },
  { name: "Attirer", chapters: [["7", "L’annonce qui fait appeler"], ["8", "La vidéo"]] },
  { name: "Conclure", chapters: [["9", "Qualifier et faire visiter"], ["10", "Conclure et encaisser"]] },
  { name: "Durer", chapters: [["11", "Avis et clients récurrents"], ["12", "Votre plan de 90 jours"]] },
];

function ebook(): DocData {
  const pages = [
    newPage([{ id: id(), type: "cover", tag: "Ebook", title: "L’agent immobilier rentable en Côte d’Ivoire", subtitle: "Méthode complète pour trouver des mandats, attirer des clients et encaisser.", image: "", footLeft: "Édition n° {edition} · {date}", footRight: "Eric Ganhoulet" }]),
    newPage([{ id: id(), type: "toc", kicker: "Sommaire", title: "Dans ce livre" }], "Sommaire"),
    newPage([h("Introduction", "L’équation de l’agent rentable", "chapter"), text("Rédigez ici l’introduction : ce que gagne le lecteur, et l’équation qui structure le livre.")], "Introduction"),
  ];
  PARTS.forEach((p, i) => {
    pages.push(newPage([h(`Partie ${i + 1}`, p.name, "chapter")], `Partie ${i + 1}`));
    for (const [n, title] of p.chapters) {
      pages.push(newPage([
        h(`Chapitre ${n}`, title, "sub"),
        text("Rédigez ici le chapitre."),
        tip("Passez à l’action", "Ce que le lecteur fait dès aujourd’hui."),
        tip("Avec Moboo", "Comment Moboo.ci l’aide à le faire."),
      ], `Partie ${i + 1} · Chapitre ${n}`));
    }
  });
  [["A", "Scripts"], ["B", "Modèles de documents"], ["C", "Documents fonciers"], ["D", "Lexique"]].forEach(([l, t]) => {
    pages.push(newPage([{ ...h(`Annexe ${l}`, t, "chapter"), tocLabel: `Annexe ${l} : ${t}` } as Block, text("Rédigez ici l’annexe.")], "Annexes"));
  });
  pages.push(newPage([{ id: id(), type: "back", title: "Passez du démarchage au métier", text: "Votre message de fin et votre offre.", cta: "moboo.ci/professionnels", links: [] }]));
  return { settings: settings("Eric Ganhoulet"), pages };
}

/** Magazine de quartier : rubriques reprises du Moboo Magazine WordPress, chiffres et annonces réels de la zone. */
function magazine(): DocData {
  const b = (x: Omit<Block, "id"> & Record<string, unknown>) => ({ id: id(), ...x }) as Block;
  const zone = (type: string, extra: object) => b({ type, locked: false, ...extra } as any);
  const heading = (kicker: string, title: string, lead = "", toc: "chapter" | "sub" | "none" = "chapter") => h(kicker, title, toc, lead);
  return {
    settings: { footer: "Moboo Magazine · {zone} · Édition n° {edition}, {date}", author: "" },
    pages: [
      newPage([{ id: id(), type: "cover", tag: "Magazine immobilier", title: "L’immobilier à {zone}", subtitle: "Les prix du quartier, les biens disponibles et les professionnels à qui parler.", image: "", footLeft: "Édition n° {edition} · {date}", footRight: "moboo.ci" }]),
      newPage([
        { id: id(), type: "toc", kicker: "Sommaire", title: "Dans ce numéro" },
        tip("Le mot de Moboo", "Bienvenue dans votre magazine immobilier local. Chaque édition rassemble les annonces, les professionnels et les chiffres clés de {zone}. Scannez, comparez, contactez, et trouvez le logement qui vous ressemble."),
      ], "Sommaire"),
      newPage([
        heading("Le marché", "Les chiffres de {zone}", "Des prix calculés sur les annonces réellement en ligne sur Moboo.ci, à titre indicatif : pour situer un bien et pour négocier."),
        zone("zoneStats", { items: [] }),
        zone("zonePrices", { tx: "rent", title: "Loyers par type de bien", entry: true, rows: [] }),
        zone("zonePrices", { tx: "sale", title: "Prix de vente par type de bien", entry: false, rows: [] }),
      ], "Le marché"),
      newPage([heading("Bons plans", "Les bonnes affaires de {zone}", "Des annonces nettement sous le prix médian de leur catégorie dans le quartier. Scannez le QR pour voir l’annonce, puis vérifiez sur place."), zone("zoneListings", { source: "deals", limit: 6, items: [] })], "Bons plans"),
      newPage([heading("À louer", "Les dernières annonces à louer"), zone("zoneListings", { source: "rent", limit: 9, items: [] })], "À louer"),
      newPage([heading("À vendre", "Les dernières annonces à vendre"), zone("zoneListings", { source: "sale", limit: 9, items: [] })], "À vendre"),
      newPage([heading("Professionnels", "Les agents de {zone}"), zone("zonePros", { kind: "agent", limit: 10, items: [] })], "Professionnels"),
      newPage([heading("Professionnels", "Les agences de {zone}"), zone("zonePros", { kind: "agence", limit: 10, items: [] })], "Professionnels"),
      newPage([heading("Guide", "Comment fonctionne l’immobilier à {zone}"), zone("zoneText", { html: "" })], "Guide"),
      newPage([
        heading("Guide", "À vérifier avant de payer", "L’arnaque au logement est fréquente. Avant de verser le moindre franc, vérifiez ces points."),
        { id: id(), type: "checklist", items: [
          ["Visitez le bien en personne", "Ne payez jamais un logement que vous n’avez pas vu de vos propres yeux."],
          ["Vérifiez l’identité de l’agent", "Demandez sa pièce et son numéro. Sur Moboo.ci, cherchez le badge « Vérifié »."],
          ["Méfiez-vous des prix trop bas", "Un loyer très en dessous du marché du quartier est souvent un piège."],
          ["Exigez un état des lieux écrit et signé", "Photos et signatures des deux parties."],
          ["Ne versez rien sans reçu", "Chaque paiement doit avoir une trace écrite : reçu daté et signé."],
          ["Refusez la pression", "« Payez vite ou vous perdez le bien » est la phrase préférée des arnaqueurs."],
        ].map(([t, x]) => ({ group: false, tag: "", text: `**${t}.** ${x}` })) },
        { id: id(), type: "callout", tone: "warn", title: "En cas de doute", text: "Contactez Moboo. Mieux vaut vérifier deux fois que perdre son argent." },
      ], "Guide"),
      newPage([
        heading("Pratique", "Démarches et numéros utiles"),
        { id: id(), type: "spec", title: "Démarches", rows: [
          { a: "Électricité (CIE) et eau (SODECI)", b: "Pièce d’identité et contrat de bail." },
          { a: "Attestation de résidence", b: "Mairie de la commune." },
          { a: "Enregistrement du bail", b: "Recommandé pour sa valeur juridique." },
        ] },
        { id: id(), type: "table", head: ["Service", "Numéro"], rows: [["Police secours", "170"], ["Pompiers (GSPM)", "180"], ["SAMU", "185"], ["CIE (électricité)", "179"], ["SODECI (eau)", "175"]] },
      ], "Pratique"),
      newPage([{ id: id(), type: "back", title: "Tout {zone} sur Moboo.ci", text: "Annonces, agents vérifiés et avis clients, mis à jour chaque jour.", cta: "moboo.ci", qr: "https://moboo.ci", links: [] }]),
    ],
  };
}

export const TEMPLATES: DocTemplate[] = [
  { key: "magazine-quartier", name: "Magazine de quartier", description: "Chiffres, prix par type de bien, bons plans, annonces, agents et agences : remplis avec les données réelles de la zone choisie.", kind: "magazine", format: "A4", title: "L’immobilier dans votre quartier", needsZone: true, build: magazine },
  { key: "livre-blanc-page-pro", name: "Livre blanc page pro", description: "Le livre blanc « Votre page pro sur Moboo.ci », 30 pages A4, entièrement modifiable bloc par bloc.", kind: "livre-blanc", format: "A4", title: "Votre page pro sur Moboo.ci", editionDate: "novembre 2026", build: () => JSON.parse(JSON.stringify(livreBlanc)) as DocData },
  { key: "ebook-a5", name: "Ebook A5", description: "Plan complet de l’ebook n° 1 : 5 parties, 12 chapitres avec encadrés « Passez à l’action » et « Avec Moboo », annexes.", kind: "ebook", format: "A5", title: "L’agent immobilier rentable en Côte d’Ivoire", build: ebook },
];

export function blankDoc(): DocData {
  return { settings: settings(), pages: [newPage([h("", "Titre de la page", "none")])] };
}
