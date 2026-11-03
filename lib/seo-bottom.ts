// Bas des pages SEO « catégorie × lieu » : pastilles de liens, chiffres du
// jour, FAQ et texte en trois parties (back-office › Pages SEO › une page).
// Les chiffres du texte sont des cases ({annonces}, {prix_median}…) remplies
// ici à l'affichage : le texte reste juste quand les annonces changent.
import { API_URL } from "./api";
import { relayHeaders } from "./relay";
import { SEO_TAG } from "./seo";

export interface BottomChip { href: string; label: string; count: number | null }
export interface BottomPart { title: string; text: string }
export interface SeoBottom {
  label: string;
  zone: { slug: string; name: string; city: string; level: string } | null;
  count: number; median: number | null; p25: number | null; p75: number | null; unit: "month" | null;
  chips: { same: { title: string; items: BottomChip[] }; zones: { title: string; items: BottomChip[] }; cities: { title: string; items: BottomChip[] } } | null;
  faq: { q: string; a: string }[];
  text: { parts: BottomPart[]; autoMeta: boolean } | null;
}

export async function getSeoBottom(slug: string): Promise<SeoBottom | null> {
  try {
    const r = await fetch(`${API_URL}/site/seo/bottom?slug=${encodeURIComponent(slug)}`, {
      next: { revalidate: 300, tags: [SEO_TAG] }, headers: { Accept: "application/json", ...relayHeaders(false) }, signal: AbortSignal.timeout(6000),
    });
    return r.ok ? ((await r.json()) as SeoBottom) : null;
  } catch {
    return null;
  }
}

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const num = (n: number) => Math.round(n).toLocaleString("fr-FR").replace(/[   ]/g, " ");
export const fcfaText = (n: number) => `${num(n)} FCFA`;

export type Values = Record<"annonces" | "prix_median" | "prix_bas" | "prix_haut" | "mois", string | null>;

/** Valeurs des cases ; `total` : annonces trouvées par la page (sinon le compte de l'API). */
export function bottomValues(b: Pick<SeoBottom, "count" | "median" | "p25" | "p75">, total?: number, now = new Date()): Values {
  const count = total && total > 0 ? total : b.count;
  const range = b.p25 && b.p75 && b.p25 < b.p75;
  return {
    annonces: count > 0 ? num(count) : null,
    prix_median: b.median ? fcfaText(b.median) : null,
    prix_bas: range ? fcfaText(b.p25!) : null,
    prix_haut: range ? fcfaText(b.p75!) : null,
    mois: `${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
  };
}

const KEY = /\{(annonces|prix_median|prix_bas|prix_haut|mois)\}/g;

/** Remplit les cases d'un paragraphe ; une phrase dont une case n'a pas de valeur est retirée. */
export function fillText(text: string, v: Values): string {
  const sentences = text.split(/(?<=[.!?…])\s+/);
  return sentences
    .filter((s) => [...s.matchAll(KEY)].every((m) => v[m[1] as keyof Values] != null))
    .map((s) => s.replace(KEY, (_, k: keyof Values) => v[k] ?? ""))
    .join(" ").replace(/\{[a-z_]+\}/g, "").trim();
}

/** Sous-titre : case vide retirée avec sa préposition (« Prix à Cocody en {mois} »). */
export function fillTitle(title: string, v: Values): string {
  return title.replace(/\s*(?:en|au|de)?\s*\{([a-z_]+)\}/g, (m, k: string) => {
    const val = v[k as keyof Values];
    return val ? m.replace(`{${k}}`, val) : "";
  }).trim();
}

/** Paragraphes d'une partie (séparés par une ligne vide). */
export const paragraphs = (text: string, v: Values) => text.split(/\n\s*\n/).map((p) => fillText(p.replace(/\n/g, " "), v)).filter(Boolean);

/** Titre Google et description avec les vrais chiffres. */
export function bottomMeta(h1: string, b: SeoBottom): { title: string; description: string } {
  const title = `${h1}${b.count > 0 ? ` – ${num(b.count)} annonce${b.count > 1 ? "s" : ""}` : ""} | Moboo`;
  const where = !b.zone || b.zone.level === "pays" ? "en Côte d’Ivoire" : `à ${b.zone.name}`;
  const lead = b.count > 0 ? `${num(b.count)} annonces « ${b.label.toLowerCase()} » ${where} sur Moboo.ci.` : `${b.label} ${where} sur Moboo.ci.`;
  const word = b.unit === "month" ? "Loyer médian" : "Prix médian";
  const price = b.median ? ` ${word} : ${fcfaText(b.median)}${b.unit === "month" ? " par mois" : ""}.` : "";
  const end = " Photos, prix et contact direct des propriétaires et des agences.";
  const description = `${lead}${price}${end}`.length <= 170 ? `${lead}${price}${end}` : `${lead}${price}`;
  return { title, description: description.replace(/ /g, " ") };
}
