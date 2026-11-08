import { listingPath } from "@/lib/listing-url";
import { flatBlocks, type Block, type DocData, type ZoneItem, type ZonePrice, type ZonePro } from "./types";

/** Réponse de l'API : données réelles d'une zone pour le magazine de quartier. */
export interface ZonePayload {
  zone: { slug: string; name: string; city: string };
  listings: { rent: number; sale: number; furnished: number };
  rent: { n: number; median: number | null; p25: number | null; p75: number | null };
  sale: { n: number; median: number | null; p25: number | null; p75: number | null };
  pros: { pros: number; agents: number; agences: number; listings: number; reviews: number; rating: number | null; verified: number } | null;
  guide: { name: string; summary: string; image: string | null } | null;
  intro: string[];
  sections: Record<string, string>;
  byType: { tx: "rent" | "sale"; type: string; label: string; n: number; median: number | null; p25: number | null; p75: number | null }[];
  recent: { rent: RawListing[]; sale: RawListing[] };
  deals: (RawListing & { pct: number })[];
  agents: RawPro[];
  agences: RawPro[];
}
export interface ZoneOption { slug: string; name: string; city: string; level: string; rent: number; sale: number }
interface RawListing { id: string; title: string; tx: string; type: string; price: number; priceUnit: string | null; commune: string | null; quartier: string | null; city: string | null; bedrooms: number | null; surface: number | null; image: string; pct?: number }
interface RawPro { ref: string; href: string; name: string; kind: string; company: string | null; photo: string | null; rating: number; reviews: number; listings: number; verified: boolean; businessVerified: boolean; phone: string | null; whatsapp: string | null }

const BASE = "https://moboo.ci";
const esc = (s: string) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const SECTION_TITLES: Record<string, string> = { vivre: "Vivre ici", ecoles: "Écoles", transports: "Transports", securite: "Sécurité", commerces: "Commerces", investir: "Investir" };

const toItem = (l: RawListing): ZoneItem => ({
  id: l.id, title: l.title, tx: l.tx, price: l.price, priceUnit: l.priceUnit, place: [l.quartier, l.commune || l.city].filter(Boolean).join(", "),
  bedrooms: l.bedrooms, surface: l.surface, image: l.image, url: BASE + listingPath({ id: l.id, title: l.title, transaction: l.tx, quartier: l.quartier, commune: l.commune, city: l.city }), pct: l.pct,
});
const toPro = (p: RawPro): ZonePro => ({
  name: p.name, company: p.company, image: p.photo ?? "", rating: p.rating, reviews: p.reviews, listings: p.listings,
  verified: p.verified || p.businessVerified, phone: p.whatsapp || p.phone, url: BASE + p.href,
});
const toPrices = (z: ZonePayload, tx: "rent" | "sale"): ZonePrice[] =>
  z.byType.filter((r) => r.tx === tx && r.median !== null).map((r) => ({ label: r.label, n: r.n, median: r.median, p25: r.p25, p75: r.p75 }));

export function zoneText(z: ZonePayload): string {
  const paragraphs = [z.guide?.summary, ...z.intro].filter(Boolean).map((p) => `<p>${esc(p as string)}</p>`);
  const sections = Object.entries(z.sections ?? {}).filter(([, v]) => v).map(([k, v]) => `<h4>${esc(SECTION_TITLES[k] ?? k)}</h4><p>${esc(v)}</p>`);
  return [...paragraphs, ...sections].join("");
}

function fill(b: Block, z: ZonePayload): Block {
  if (b.type === "columns") return { ...b, left: b.left.map((x) => fill(x, z)), right: b.right.map((x) => fill(x, z)) };
  if (!("locked" in b) || b.locked) return b;
  const money = (n: number | null) => (n === null ? "—" : formatPrice(n));
  switch (b.type) {
    case "zoneStats": return { ...b, items: [
      { value: String(z.listings.rent), label: "biens à louer sur Moboo.ci" },
      { value: String(z.listings.sale), label: "biens à vendre sur Moboo.ci" },
      { value: String(z.pros?.pros ?? 0), label: "professionnels dans la zone" },
      ...(z.rent.median !== null ? [{ value: money(z.rent.median), label: "loyer médian par mois" }] : []),
      ...(z.sale.median !== null ? [{ value: money(z.sale.median), label: "prix de vente médian" }] : []),
      ...(z.pros?.rating ? [{ value: String(z.pros.rating).replace(".", ",") + " / 5", label: `note moyenne sur ${z.pros.reviews} avis` }] : []),
    ] };
    case "zonePrices": return { ...b, rows: toPrices(z, b.tx) };
    case "zoneListings": return { ...b, items: (b.source === "deals" ? z.deals : z.recent[b.source]).slice(0, b.limit).map(toItem) };
    case "zonePros": return { ...b, items: (b.kind === "agent" ? z.agents : z.agences).slice(0, b.limit).map(toPro) };
    case "zoneText": return { ...b, html: zoneText(z) };
    default: return b;
  }
}

/** Remplit les blocs de données du document avec la zone (les blocs verrouillés sont laissés tels quels). */
export function applyZone(data: DocData, z: ZonePayload): DocData {
  return { settings: { ...data.settings, zoneName: z.zone.name }, pages: data.pages.map((p) => ({ ...p, blocks: p.blocks.map((b) => fill(b, z)) })) };
}

export const hasZoneBlocks = (data: DocData) => data.pages.some((p) => flatBlocks(p.blocks).some((b) => b.type.startsWith("zone")));

/** Montant en FCFA, écrit de la même façon côté serveur et navigateur. */
export function formatPrice(n: number): string {
  return `${String(Math.round(n)).replace(/\B(?=(\d{3})+$)/g, " ")} FCFA`;
}
