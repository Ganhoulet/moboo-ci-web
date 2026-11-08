import { DEFAULT_FOOTER, newPage, uid, type Block, type DocData, type DocFormat, type DocKind } from "./types";

export interface DocTemplate { key: string; name: string; description: string; kind: DocKind; format: DocFormat; title: string; build: () => DocData }

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

export const TEMPLATES: DocTemplate[] = [
  { key: "ebook-a5", name: "Ebook A5", description: "Plan complet de l’ebook n° 1 : 5 parties, 12 chapitres avec encadrés « Passez à l’action » et « Avec Moboo », annexes.", kind: "ebook", format: "A5", title: "L’agent immobilier rentable en Côte d’Ivoire", build: ebook },
];

export function blankDoc(): DocData {
  return { settings: settings(), pages: [newPage([h("", "Titre de la page", "none")])] };
}
