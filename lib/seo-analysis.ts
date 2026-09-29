// Analyse SEO et lisibilité « façon Yoast » (module neutre, exécuté dans
// l'éditeur du back-office). Règles inspirées de Yoast SEO, adaptées au français.

export type Level = "good" | "ok" | "bad";
export interface Check { id: string; level: Level; text: string }
export interface SeoInput {
  keyword: string; seoTitle: string; title: string; metaDescription: string; slug: string; intro: string; content: string;
}

const strip = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const textOf = (html: string) => html
  .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
  .replace(/<\/(p|h[1-6]|li|div|br)>/gi, "\n").replace(/<br\s*\/?>/gi, "\n")
  .replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#0?39;|&rsquo;/g, "'");
const words = (s: string) => strip(s).match(/[a-z0-9]+(?:['’-][a-z0-9]+)*/g) ?? [];

/** Nombre d'occurrences de l'expression (accents et casse ignorés). */
function count(hay: string, kw: string) {
  const k = words(kw).join(" ");
  if (!k) return 0;
  const h = ` ${words(hay).join(" ")} `;
  let n = 0, i = 0;
  while ((i = h.indexOf(` ${k} `, i)) !== -1) { n++; i += k.length + 1; }
  return n;
}
/** Comme Yoast : l'expression exacte, ou une phrase qui contient tous ses mots importants. */
function occurrences(text: string, kw: string) {
  const exact = count(text, kw);
  if (exact) return exact;
  const important = words(kw).filter((x) => x.length >= 3);
  if (!important.length) return 0;
  return text.split(/(?<=[.!?…])\s+|\n+/).filter((s) => { const w = new Set(words(s)); return important.every((x) => w.has(x)); }).length;
}
/** Contient l'expression, ou à défaut tous ses mots importants (≥ 3 lettres). */
const has = (hay: string, kw: string) => {
  if (count(hay, kw)) return true;
  const w = new Set(words(hay));
  const important = words(kw).filter((x) => x.length >= 3);
  return important.length > 0 && important.every((x) => w.has(x));
};

const TRANSITIONS = [
  "ainsi", "en effet", "de plus", "cependant", "par ailleurs", "donc", "enfin", "d'abord", "ensuite", "toutefois", "en outre",
  "par exemple", "notamment", "c'est pourquoi", "en revanche", "neanmoins", "pourtant", "de meme", "en particulier", "egalement",
  "tout d'abord", "finalement", "en conclusion", "par consequent", "grace a", "afin de", "en resume", "au contraire", "d'autre part",
];

export function analyze(input: SeoInput) {
  const kw = input.keyword.trim();
  const html = `${input.intro || ""}\n${input.content || ""}`;
  const body = textOf(html);
  const w = words(body);
  const nWords = w.length;
  const seo: Check[] = [];
  const read: Check[] = [];
  const add = (list: Check[], id: string, level: Level, text: string) => list.push({ id, level, text });

  // ─── SEO ────────────────────────────────────────────────────────────────
  const title = input.seoTitle || input.title;
  if (!kw) {
    add(seo, "kw", "bad", "Aucun mot-clé principal : indiquez l’expression que les gens tapent sur Google (ex. « maisons à louer Cocody »).");
  } else {
    const first = strip(title).indexOf(words(kw)[0] ?? "");
    add(seo, "kw-title", has(title, kw) ? (first >= 0 && first < 12 ? "good" : "ok") : "bad",
      has(title, kw) ? (first >= 0 && first < 12 ? "Le mot-clé est au début du titre SEO. Parfait." : "Le titre SEO contient le mot-clé ; placez-le plutôt au début.") : "Ajoutez le mot-clé dans le titre SEO.");
    add(seo, "kw-h1", has(input.title, kw) ? "good" : "bad", has(input.title, kw) ? "Le titre de la page (H1) contient le mot-clé." : "Ajoutez le mot-clé dans le titre de la page (H1).");
    add(seo, "kw-meta", has(input.metaDescription, kw) ? "good" : "bad", has(input.metaDescription, kw) ? "La méta-description contient le mot-clé." : "Ajoutez le mot-clé dans la méta-description.");
    const slugWords = new Set(strip(input.slug).split(/[^a-z0-9]+/));
    const slugOk = words(kw).filter((x) => x.length >= 3).every((x) => slugWords.has(x) || slugWords.has(x.replace(/s$/, "")) || slugWords.has(`${x}s`));
    add(seo, "kw-slug", slugOk ? "good" : "ok", slugOk ? "L’adresse de la page contient le mot-clé." : "L’adresse de la page ne reprend pas tout le mot-clé (changez-la seulement si la page est nouvelle).");
    const firstPara = textOf((html.match(/<p[\s\S]*?<\/p>/i) ?? [input.intro || body.slice(0, 600)])[0]);
    add(seo, "kw-intro", has(firstPara, kw) ? "good" : "bad", has(firstPara, kw) ? "Le mot-clé apparaît dès le premier paragraphe." : "Utilisez le mot-clé dans le premier paragraphe.");
    const n = occurrences(body, kw);
    const density = nWords ? (n * words(kw).length * 100) / nWords : 0;
    add(seo, "density", n === 0 ? "bad" : density > 3.5 ? "bad" : density >= 0.5 ? "good" : "ok",
      n === 0 ? "Le mot-clé n’apparaît pas dans le texte." : density > 3.5 ? `Mot-clé trop répété (${n} fois, ${density.toFixed(1)} %) : Google peut y voir du bourrage.` : density >= 0.5 ? `Densité du mot-clé : ${n} fois (${density.toFixed(1)} %). Bien.` : `Le mot-clé n’apparaît que ${n} fois (${density.toFixed(1)} %) : visez 0,5 à 3 %.`);
    const subs = [...html.matchAll(/<h[2-3][^>]*>([\s\S]*?)<\/h[2-3]>/gi)].map((m) => textOf(m[1]));
    add(seo, "kw-sub", subs.some((s) => has(s, kw)) ? "good" : subs.length ? "ok" : "bad",
      subs.some((s) => has(s, kw)) ? "Un sous-titre (H2/H3) reprend le mot-clé." : subs.length ? "Aucun sous-titre ne reprend le mot-clé." : "Ajoutez des sous-titres (H2) dont un avec le mot-clé.");
  }
  const tl = title.length;
  add(seo, "title-len", tl >= 30 && tl <= 60 ? "good" : tl > 0 && tl <= 70 ? "ok" : "bad",
    tl === 0 ? "Renseignez un titre SEO." : tl < 30 ? `Titre SEO court (${tl} caractères) : visez 30 à 60.` : tl > 60 ? `Titre SEO long (${tl} caractères) : Google le coupera après ~60.` : `Longueur du titre SEO : ${tl} caractères. Parfait.`);
  const ml = input.metaDescription.length;
  add(seo, "meta-len", ml >= 120 && ml <= 156 ? "good" : ml >= 70 && ml <= 170 ? "ok" : "bad",
    ml === 0 ? "Écrivez une méta-description : c’est le texte affiché sous le titre dans Google." : ml < 120 ? `Méta-description courte (${ml} caractères) : visez 120 à 156.` : ml > 156 ? `Méta-description longue (${ml} caractères) : elle sera coupée après ~156.` : `Longueur de la méta-description : ${ml} caractères. Parfait.`);
  add(seo, "length", nWords >= 600 ? "good" : nWords >= 300 ? "ok" : "bad",
    nWords >= 600 ? `Texte de ${nWords} mots : excellent pour le référencement.` : nWords >= 300 ? `Texte de ${nWords} mots : correct, 600 mots et plus seraient encore mieux.` : `Texte de ${nWords} mots : trop court, écrivez au moins 300 mots.`);
  const links = [...html.matchAll(/<a\s[^>]*href="([^"]+)"/gi)].map((m) => m[1]);
  const internal = links.filter((h) => h.startsWith("/") || /moboo\.ci/.test(h)).length;
  add(seo, "internal", internal ? "good" : "bad", internal ? `${internal} lien(s) vers d’autres pages de Moboo.` : "Ajoutez des liens vers d’autres pages de Moboo (ex. « maisons à louer à Marcory »).");
  const imgs = [...html.matchAll(/<img\s[^>]*>/gi)].map((m) => m[0]);
  if (imgs.length) {
    const alt = imgs.filter((i) => /alt="[^"]+"/i.test(i)).length;
    add(seo, "alt", alt === imgs.length ? "good" : "ok", alt === imgs.length ? "Toutes les images ont un texte alternatif." : `${imgs.length - alt} image(s) sans texte alternatif (alt).`);
  }

  // ─── Lisibilité ────────────────────────────────────────────────────────
  const sentences = body.split(/(?<=[.!?…])\s+|\n+/).map((s) => s.trim()).filter((s) => words(s).length >= 3);
  if (sentences.length) {
    const long = sentences.filter((s) => words(s).length > 20).length;
    const pct = Math.round((long * 100) / sentences.length);
    add(read, "sentences", pct <= 25 ? "good" : pct <= 35 ? "ok" : "bad", pct <= 25 ? `Phrases courtes : ${pct} % dépassent 20 mots. Bien.` : `${pct} % des phrases dépassent 20 mots : raccourcissez-en quelques-unes (25 % max).`);
    const trans = sentences.filter((s) => { const t = ` ${strip(s)} `; return TRANSITIONS.some((x) => t.includes(` ${x} `) || t.startsWith(` ${x}`)); }).length;
    const tp = Math.round((trans * 100) / sentences.length);
    add(read, "transitions", tp >= 20 ? "good" : tp >= 10 ? "ok" : "bad", tp >= 20 ? `Mots de liaison dans ${tp} % des phrases. Bien.` : `Mots de liaison dans ${tp} % des phrases : utilisez-en plus (« de plus », « ainsi », « par exemple »…).`);
  }
  const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => words(textOf(m[1])).length).filter(Boolean);
  if (paras.length) {
    const longP = paras.filter((n) => n > 150).length;
    add(read, "paragraphs", longP === 0 ? "good" : "ok", longP === 0 ? "Paragraphes de taille raisonnable." : `${longP} paragraphe(s) de plus de 150 mots : coupez-les.`);
  }
  const blocks = html.split(/<h[2-3][^>]*>/i).map((b) => words(textOf(b)).length);
  const bigBlock = blocks.some((n) => n > 350);
  if (nWords > 300) add(read, "subheadings", bigBlock ? "ok" : "good", bigBlock ? "Une partie du texte dépasse 350 mots sans sous-titre : ajoutez un H2." : "Le texte est bien découpé par des sous-titres.");

  const score = (list: Check[]) => {
    if (!list.length) return "ok" as Level;
    const pts = list.reduce((s, c) => s + (c.level === "good" ? 2 : c.level === "ok" ? 1 : 0), 0) / (list.length * 2);
    return (pts >= 0.75 ? "good" : pts >= 0.45 ? "ok" : "bad") as Level;
  };
  const order = { bad: 0, ok: 1, good: 2 };
  seo.sort((a, b) => order[a.level] - order[b.level]);
  read.sort((a, b) => order[a.level] - order[b.level]);
  return { seo, read, seoScore: score(seo), readScore: score(read), words: nWords };
}
