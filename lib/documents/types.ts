/** Documents imprimables (livres blancs, ebooks, magazines) : pages et blocs enregistrés en JSON par l'API. */

export type DocFormat = "A4" | "A5";
export type DocKind = "livre-blanc" | "ebook" | "magazine" | "autre";
export type DocStatus = "draft" | "published" | "archived";

export const PAPER: Record<DocFormat, { w: number; h: number; label: string }> = {
  A4: { w: 210, h: 297, label: "A4 (21 × 29,7 cm)" },
  A5: { w: 148, h: 210, label: "A5 (14,8 × 21 cm)" },
};
export const KIND_LABEL: Record<DocKind, string> = {
  "livre-blanc": "Livre blanc", ebook: "Ebook", magazine: "Magazine de quartier", autre: "Autre document",
};

export interface Marker { n: number; x: number; y: number; label: string }
export interface Crop { pageW: number; x: number; y: number; w: number; h: number }

interface B<T extends string> { id: string; type: T }
export type CoverBlock = B<"cover"> & { tag: string; title: string; subtitle: string; image: string; footLeft: string; footRight: string };
export type BackBlock = B<"back"> & { title: string; text: string; cta: string; note?: string; qr?: string; links: { title: string; text: string }[] };
export type HeadingBlock = B<"heading"> & { kicker: string; title: string; lead: string; toc: "none" | "chapter" | "sub"; tocLabel: string; badge?: string; kickerTag?: boolean };
export type SubheadingBlock = B<"subheading"> & { text: string };
export type TextBlock = B<"text"> & { html: string };
export type ImageBlock = B<"image"> & { src: string; caption: string; width: number; frame: "shot" | "phone" | "none"; crop: Crop | null; markers: Marker[]; legend: "none" | "right" | "below" };
export type CalloutBlock = B<"callout"> & { tone: "tip" | "warn"; title: string; text: string };
export type SpecBlock = B<"spec"> & { title: string; rows: { a: string; b: string }[] };
export type DoDontBlock = B<"dodont"> & { good: string[]; bad: string[] };
export type ExampleBlock = B<"example"> & { tone: "good" | "bad"; label: string; text: string };
export type TableBlock = B<"table"> & { head: string[]; rows: string[][]; dense?: boolean };
export type ChecklistBlock = B<"checklist"> & { items: { group: boolean; tag: string; text: string }[] };
export type ColumnsBlock = B<"columns"> & { ratio: "equal" | "wide" | "anat" | "narrow"; left: Block[]; right: Block[] };
export type TocBlock = B<"toc"> & { kicker: string; title: string };
export type KpisBlock = B<"kpis"> & { items: { value: string; label: string }[] };
export type BenefitsBlock = B<"benefits"> & { single?: boolean; items: { title: string; text: string }[] };
export type HtmlBlock = B<"html"> & { html: string };
export type LegendBlock = B<"legend"> & { items: { n: number; text: string }[] };
export type DividerBlock = B<"divider">;
export type QrBlock = B<"qr"> & { url: string; caption: string };
export interface ZoneItem { id: string; title: string; tx: string; price: number; priceUnit: string | null; place: string; bedrooms: number | null; surface: number | null; image: string; url: string; pct?: number }
export interface ZonePro { name: string; company: string | null; image: string; rating: number; reviews: number; listings: number; verified: boolean; phone: string | null; url: string }
export interface ZonePrice { label: string; n: number; median: number | null; p25: number | null; p75: number | null }
export type ZoneStatsBlock = B<"zoneStats"> & { locked: boolean; items: { value: string; label: string }[] };
export type ZonePricesBlock = B<"zonePrices"> & { locked: boolean; tx: "rent" | "sale"; title: string; entry: boolean; rows: ZonePrice[] };
export type ZoneListingsBlock = B<"zoneListings"> & { locked: boolean; source: "rent" | "sale" | "deals"; limit: number; items: ZoneItem[] };
export type ZoneProsBlock = B<"zonePros"> & { locked: boolean; kind: "agent" | "agence"; limit: number; items: ZonePro[] };
export type ZoneTextBlock = B<"zoneText"> & { locked: boolean; html: string };

export type Block =
  | CoverBlock | BackBlock | HeadingBlock | SubheadingBlock | TextBlock | ImageBlock | CalloutBlock | SpecBlock
  | DoDontBlock | ExampleBlock | TableBlock | ChecklistBlock | ColumnsBlock | TocBlock | KpisBlock | BenefitsBlock | HtmlBlock | LegendBlock | DividerBlock | QrBlock
  | ZoneStatsBlock | ZonePricesBlock | ZoneListingsBlock | ZoneProsBlock | ZoneTextBlock;
export type BlockType = Block["type"];

export interface DocPage { id: string; section: string; noChrome?: boolean; blocks: Block[] }
export interface DocSettings { footer: string; author: string; zoneName?: string }
export interface DocData { settings: DocSettings; pages: DocPage[] }

export interface DocMeta {
  title: string; kind: DocKind; format: DocFormat; edition: number; editionDate: string; status: DocStatus; zone: string | null; template: string | null;
}
export interface DocRow extends DocMeta { id: string; parentId: string | null; updatedAt: string; createdAt: string; pages: number }
export interface DocFull extends DocMeta { id: string; data: DocData }

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-3);

export const DEFAULT_FOOTER = "{titre} · Édition n° {edition}, {date}";

/** Catalogue des blocs proposés dans l'éditeur (groupes dans l'ordre d'affichage). */
export const BLOCK_CATALOG: { group: string; items: { type: BlockType; label: string }[] }[] = [
  { group: "Structure", items: [
    { type: "cover", label: "Couverture" }, { type: "heading", label: "Titre et chapitre" }, { type: "subheading", label: "Intertitre" },
    { type: "toc", label: "Sommaire automatique" }, { type: "columns", label: "Deux colonnes" }, { type: "divider", label: "Séparateur" }, { type: "back", label: "Quatrième de couverture" },
  ] },
  { group: "Contenu", items: [
    { type: "text", label: "Texte riche" }, { type: "image", label: "Image ou capture" }, { type: "callout", label: "Encadré (conseil, attention)" },
    { type: "legend", label: "Liste de repères" }, { type: "qr", label: "QR code" }, { type: "kpis", label: "Chiffres clés" }, { type: "benefits", label: "Cartes d’arguments" },
  ] },
  { group: "Méthode", items: [
    { type: "spec", label: "Fiche technique" }, { type: "dodont", label: "À faire, à éviter" }, { type: "example", label: "Bon ou mauvais exemple" },
    { type: "table", label: "Tableau" }, { type: "checklist", label: "Liste à cocher" },
  ] },
  { group: "Données du quartier", items: [
    { type: "zoneStats", label: "Chiffres de la zone" }, { type: "zonePrices", label: "Prix par type de bien" }, { type: "zoneListings", label: "Annonces de la zone" },
    { type: "zonePros", label: "Agents et agences" }, { type: "zoneText", label: "Comment ça marche ici" },
  ] },
];

export function newBlock(type: BlockType): Block {
  const id = uid();
  switch (type) {
    case "cover": return { id, type, tag: "Livre blanc", title: "Titre du document", subtitle: "Une phrase qui explique ce que le lecteur va y trouver.", image: "", footLeft: "Édition n° {edition} · {date}", footRight: "moboo.ci" };
    case "back": return { id, type, title: "Passez à l’action", text: "Votre message de conclusion.", cta: "moboo.ci", links: [] };
    case "heading": return { id, type, kicker: "Chapitre", title: "Titre du chapitre", lead: "", toc: "chapter", tocLabel: "" };
    case "subheading": return { id, type, text: "Intertitre" };
    case "text": return { id, type, html: "<p>Votre texte ici.</p>" };
    case "image": return { id, type, src: "", caption: "", width: 100, frame: "shot", crop: null, markers: [], legend: "none" };
    case "callout": return { id, type, tone: "tip", title: "Conseil", text: "Votre conseil ici." };
    case "spec": return { id, type, title: "Fiche technique", rows: [{ a: "Champ", b: "Valeur" }] };
    case "dodont": return { id, type, good: ["Premier point"], bad: ["Premier point"] };
    case "example": return { id, type, tone: "good", label: "Bon exemple", text: "Votre exemple ici." };
    case "table": return { id, type, head: ["Colonne 1", "Colonne 2"], rows: [["", ""]] };
    case "checklist": return { id, type, items: [{ group: false, tag: "", text: "Premier point à vérifier" }] };
    case "columns": return { id, type, ratio: "equal", left: [newBlock("text")], right: [newBlock("text")] };
    case "toc": return { id, type, kicker: "Sommaire", title: "Dans ce document" };
    case "kpis": return { id, type, items: [{ value: "100", label: "Votre chiffre" }] };
    case "benefits": return { id, type, items: [{ title: "Argument", text: "Explication courte." }] };
    case "html": return { id, type, html: "<p></p>" };
    case "legend": return { id, type, items: [{ n: 1, text: "Premier repère" }] };
    case "divider": return { id, type };
    case "qr": return { id, type, url: "https://moboo.ci", caption: "Scannez pour ouvrir Moboo.ci" };
    case "zoneStats": return { id, type, locked: false, items: [] };
    case "zonePrices": return { id, type, locked: false, tx: "rent", title: "Loyers par type de bien", entry: true, rows: [] };
    case "zoneListings": return { id, type, locked: false, source: "rent", limit: 9, items: [] };
    case "zonePros": return { id, type, locked: false, kind: "agent", limit: 8, items: [] };
    case "zoneText": return { id, type, locked: false, html: "" };
  }
}

export const newPage = (blocks: Block[] = [], section = ""): DocPage => ({ id: uid(), section, blocks });

/** Remplace {titre}, {edition}, {date}, {zone} dans les textes de couverture et de pied de page. */
export function fillVars(s: string, m: Pick<DocMeta, "title" | "edition" | "editionDate"> & { zoneName?: string }) {
  return String(s ?? "").replace(/\{titre\}/g, m.title).replace(/\{edition\}/g, String(m.edition)).replace(/\{date\}/g, m.editionDate).replace(/\{zone\}/g, m.zoneName || "votre quartier");
}

/** Tous les blocs d'une page, y compris ceux des colonnes. */
export function flatBlocks(blocks: Block[]): Block[] {
  return blocks.flatMap((b) => (b.type === "columns" ? [b, ...flatBlocks(b.left), ...flatBlocks(b.right)] : [b]));
}

export interface TocEntry { label: string; page: number; level: 0 | 1 }
export function buildToc(pages: DocPage[]): TocEntry[] {
  const out: TocEntry[] = [];
  pages.forEach((p, i) => {
    for (const b of flatBlocks(p.blocks)) {
      if (b.type === "heading" && b.toc !== "none") out.push({ label: b.tocLabel || b.title, page: i + 1, level: b.toc === "sub" ? 1 : 0 });
    }
  });
  return out;
}
