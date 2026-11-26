/**
 * Fiches d'annonces à imprimer (back-office → Marketing) : une sélection
 * d'annonces mise en page sur des feuilles (A4 recto-verso, A3, A5, A6…),
 * chaque bien avec sa photo, son prix, sa zone et un QR code vers sa fiche.
 *
 * Enregistrées comme « documents imprimables » (API /site/admin/documents,
 * template « fiches-annonces ») : JSON { fiche, settings, items }.
 */

export const FICHE_TEMPLATE = "fiches-annonces";

/** Modèles de mise en page (les 3 maquettes validées avec Eric). */
export type FicheDesign = "cartes" | "photo" | "liste";
export const DESIGNS: { key: FicheDesign; label: string; hint: string }[] = [
  { key: "cartes", label: "Cartes", hint: "Photo à gauche, prix et QR à droite. Clair et sobre." },
  { key: "photo", label: "Grande photo", hint: "La photo occupe la carte, prix sur bandeau orange. Plus d’encre." },
  { key: "liste", label: "Liste par commune", hint: "Une annonce par ligne, rangées par commune. Textes plus gros." },
];

export type PaperKey = "A3" | "A4" | "A5" | "A6" | "Letter" | "custom";
export const PAPERS: Record<Exclude<PaperKey, "custom">, { w: number; h: number; label: string; cols: number; rows: number }> = {
  A3: { w: 297, h: 420, label: "A3 (29,7 × 42 cm)", cols: 3, rows: 5 },
  A4: { w: 210, h: 297, label: "A4 (21 × 29,7 cm)", cols: 2, rows: 5 },
  A5: { w: 148, h: 210, label: "A5 (14,8 × 21 cm)", cols: 2, rows: 3 },
  A6: { w: 105, h: 148, label: "A6 (10,5 × 14,8 cm)", cols: 1, rows: 2 },
  Letter: { w: 215.9, h: 279.4, label: "Lettre US (21,6 × 27,9 cm)", cols: 2, rows: 5 },
};

export type FicheTx = "rent" | "sale" | "furnished";
export const TX_LABEL: Record<FicheTx, string> = { rent: "À louer", sale: "À vendre", furnished: "Meublé" };

export interface FicheItem {
  /** « listing:<id> » ou « residence:<id> ». */
  key: string;
  src: "listing" | "residence";
  id: string;
  tx: FicheTx;
  title: string;
  zone: string;
  commune: string;
  price: number;
  unit: string;
  image: string;
  /** Chemin de la fiche sur le site (/annonce/<id>, /residence/<id>). */
  path: string;
}

export interface FicheSettings {
  design: FicheDesign;
  paper: PaperKey;
  orientation: "portrait" | "landscape";
  customW: number;
  customH: number;
  cols: number;
  rows: number;
  /** Titre de chaque face ; pageTitles[i] le remplace pour la face i (magazine). */
  title: string;
  pageTitles: string[];
  /** {edition} et {date} remplacés. */
  editionLine: string;
  showSide: boolean;
  scanTitle: string;
  scanText: string;
  /** Vide : toutes les annonces du site. */
  scanUrl: string;
  footerSite: string;
  footerPowered: string;
  footerHint: string;
  /** Adresse des QR codes ; vide = adresse actuelle du site. */
  siteBase: string;
  /** Taille du QR imprimé (mm) ; 0 = automatique. */
  qrMm: number;
  frame: boolean;
  showTag: boolean;
  showRef: boolean;
  showNumber: boolean;
  groupByCommune: boolean;
}

export interface FicheData { fiche: 1; settings: FicheSettings; items: FicheItem[] }

export const DEFAULT_SETTINGS: FicheSettings = {
  design: "cartes", paper: "A4", orientation: "portrait", customW: 210, customH: 297, cols: 2, rows: 5,
  title: "Biens à louer à Yopougon", pageTitles: [], editionLine: "Édition n°{edition} — sortie le {date}", showSide: true,
  scanTitle: "Scannez", scanText: "toutes les annonces sur moboo.ci", scanUrl: "",
  footerSite: "www.moboo.ci", footerPowered: "propulsé par Moboo.ci", footerHint: "Scannez le QR d’un bien pour voir ses photos et contacter l’annonceur",
  siteBase: "", qrMm: 0, frame: true, showTag: true, showRef: true, showNumber: true, groupByCommune: true,
};

export const newFicheData = (): FicheData => ({ fiche: 1, settings: { ...DEFAULT_SETTINGS }, items: [] });

/** Données enregistrées → fiche complète (réglages manquants remis par défaut). */
export function readFiche(raw: unknown): FicheData {
  const d = (raw ?? {}) as Partial<FicheData>;
  return { fiche: 1, settings: { ...DEFAULT_SETTINGS, ...(d.settings ?? {}) }, items: Array.isArray(d.items) ? d.items.filter((x) => x && x.id) : [] };
}

/** Taille de la feuille en mm, orientation comprise. */
export function paperSize(s: FicheSettings): { w: number; h: number } {
  const p = s.paper === "custom" ? { w: clamp(s.customW, 50, 1200), h: clamp(s.customH, 50, 1200) } : PAPERS[s.paper] ?? PAPERS.A4;
  const [a, b] = [Math.min(p.w, p.h), Math.max(p.w, p.h)];
  return s.orientation === "landscape" ? { w: b, h: a } : { w: a, h: b };
}

/**
 * Mise à l'échelle : la page est dessinée à la taille d'une A4 (même surface),
 * puis agrandie ou réduite à la feuille choisie. Textes et marges suivent.
 */
export function pageScale(s: FicheSettings) {
  const { w, h } = paperSize(s);
  const k = Math.sqrt((w * h) / (210 * 297));
  return { w, h, k, bw: w / k, bh: h / k };
}

/** Mesures de base (mm, à l'échelle A4) communes aux trois modèles. */
export const BASE = { mx: 9, mt: 7, mb: 6, header: 27, headerGap: 2, footer: 9, footerGap: 1.5, frame: 1.8, pad: 3, gap: 3 };

/** Hauteur d'une ligne d'annonces (mm à l'échelle A4) et taille du QR. */
export function cellMetrics(s: FicheSettings) {
  const { bw, bh, k } = pageScale(s);
  const inner = (s.frame ? BASE.frame + BASE.pad : 0) * 2;
  const availH = bh - BASE.mt - BASE.mb - BASE.header - BASE.headerGap - BASE.footer - BASE.footerGap - inner;
  const availW = bw - BASE.mx * 2 - inner;
  const rows = Math.max(1, s.rows), cols = Math.max(1, s.cols);
  const rowH = (availH - BASE.gap * (rows - 1)) / rows;
  const colW = (availW - BASE.gap * (cols - 1)) / cols;
  const auto = s.design === "photo" ? Math.min(rowH * 0.42, colW * 0.3, 24) : s.design === "liste" ? Math.min(rowH - 3, colW * 0.2, 24) : Math.min(rowH - 9, colW * 0.24, 24);
  const qrBase = s.qrMm > 0 ? Math.min(s.qrMm / k, rowH - 2, colW * 0.4) : auto;
  return { rowH, colW, qrBase: Math.max(6, qrBase), qrPrinted: Math.max(6, qrBase) * k, k };
}

export const perFace = (s: FicheSettings) => Math.max(1, s.cols) * Math.max(1, s.rows);

/** Faces : annonces par paquets (au moins une face, même vide). */
export function faces(items: FicheItem[], s: FicheSettings): FicheItem[][] {
  const n = perFace(s);
  const list = s.design === "liste" && s.groupByCommune ? groupedOrder(items) : items;
  const out: FicheItem[][] = [];
  for (let i = 0; i < list.length; i += n) out.push(list.slice(i, i + n));
  return out.length ? out : [[]];
}

/** Ordre par commune, en gardant l'ordre de première apparition. */
export function groupedOrder(items: FicheItem[]) {
  const order: string[] = [];
  const by = new Map<string, FicheItem[]>();
  for (const it of items) {
    const c = it.commune || "Abidjan";
    if (!by.has(c)) { by.set(c, []); order.push(c); }
    by.get(c)!.push(it);
  }
  return order.flatMap((c) => by.get(c)!);
}

export const fillLine = (t: string, edition: number, date: string) =>
  t.replace(/\{edition\}/g, String(edition)).replace(/\{date\}/g, date || "…");

export const formatAmount = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, " ");

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, Number(n) || a));

// ─── Annonces brutes de l'API → éléments de fiche ─────────────────────────
export const COMMUNES = ["Cocody", "Yopougon", "Bingerville", "Plateau", "Marcory", "Koumassi", "Treichville", "Abobo", "Adjamé", "Port-Bouët", "Attécoubé", "Anyama", "Songon", "Grand-Bassam", "Assinie", "Bassam", "Yamoussoukro", "Bouaké", "San-Pédro"];
const norm = (s: unknown) => String(s ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

export function communeOf(fields: (string | null | undefined)[]): string {
  const hay = norm(fields.join(" "));
  return COMMUNES.find((c) => hay.includes(norm(c))) ?? "Abidjan";
}

export function zoneOf(fields: (string | null | undefined)[]): string {
  const z = fields.map((f) => String(f ?? "").trim()).filter(Boolean).filter((v, i, a) => a.findIndex((x) => norm(x) === norm(v)) === i);
  const zz = z.filter((v) => norm(v) !== "abidjan");
  return (zz.length ? zz : z).join(", ") || "Abidjan";
}

/** Titre court et propre (sans #, majuscules criardes ni « à louer » répété). */
export function cleanTitle(t: string, max = 40): string {
  let s = String(t ?? "").replace(/[#|_]+/g, " ").replace(/[–—]/g, " ").replace(/\s+/g, " ").trim();
  s = s.replace(/^(à louer|a louer|à vendre|a vendre|location d['’]un(e)?)\s*:?\s*/i, "");
  if (s === s.toUpperCase()) s = s.toLowerCase();
  s = s.charAt(0).toUpperCase() + s.slice(1);
  for (const c of COMMUNES) s = s.replace(new RegExp(`\\b${norm(c)}\\b`, "gi"), c);
  return s.length > max ? s.slice(0, max - 1).replace(/\s\S*$/, "") + "…" : s;
}
