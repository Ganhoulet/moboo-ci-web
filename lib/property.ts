import { listEspaces, listListings, listResidences } from "./api";

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  appartement: "Appartement",
  maison: "Maison",
  villa: "Villa",
  studio: "Studio",
  terrain: "Terrain",
  bureau: "Bureau",
  magasin: "Magasin",
  autre: "Bien",
};

/** Le site couvre TOUT Moboo.ci : à louer, à vendre + le réservable (meublé/event). */
export type Transaction = "rent" | "sale" | "furnished" | "event";

export interface Property {
  id: string;
  href: string;
  title: string;
  zone: string;
  image: string | null;
  price: number | null;
  priceLabel: string; // "/ nuit", "/ mois", ""
  transaction: Transaction;
  reservable: boolean;
  meta?: string;
  propertyType?: string; // pour les annonces classiques (filtre)
  bedrooms?: number | null;
}

export const TRANSACTION_BADGE: Record<Transaction, string> = {
  rent: "À louer",
  sale: "À vendre",
  furnished: "Meublé",
  event: "Événementiel",
};

export const TRANSACTION_FILTERS: { key: Transaction | "all"; label: string }[] = [
  { key: "all", label: "Tout" },
  { key: "rent", label: "À louer" },
  { key: "sale", label: "À vendre" },
  { key: "furnished", label: "Meublés" },
  { key: "event", label: "Espaces" },
];

export interface PagedProperties {
  items: Property[];
  total: number;
  page: number;
  perPage: number;
}

export async function reservableResidences(): Promise<Property[]> {
  const { items } = await listResidences({ perPage: 24 });
  return items.map((r) => ({
    id: `res-${r.id}`,
    href: `/residence/${r.id}`,
    title: r.name,
    zone: [r.commune, r.city].filter(Boolean).join(", ") || "Côte d'Ivoire",
    image: r.photos?.[0] ?? null,
    price: r.minNightlyPrice,
    priceLabel: "/ nuit",
    transaction: "furnished" as const,
    reservable: true,
    meta: r.apartmentsCount ? `${r.apartmentsCount} logement(s)` : undefined,
  }));
}

export async function reservableEspaces(): Promise<Property[]> {
  const { items } = await listEspaces({ perPage: 24 });
  return items.map((e) => {
    const prices = (e.tarifs ?? []).map((t) => t.prix ?? 0).filter((p) => p > 0);
    return {
      id: `esp-${e.id}`,
      href: `/espace/${e.slug || e.id}`,
      title: e.nom,
      zone: [e.quartier, e.commune].filter(Boolean).join(", ") || "Côte d'Ivoire",
      image: e.photoPrincipaleUrl,
      price: prices.length ? Math.min(...prices) : null,
      priceLabel: "",
      transaction: "event" as const,
      reservable: true,
      meta: `${e.capaciteMin}–${e.capaciteMax} pers.`,
    };
  });
}

function mapListing(l: import("./types").ListingItem): Property {
  const kind = l.listingKind ?? "classic";
  const reservable = kind === "furnished" || kind === "event";
  return {
    id: `lst-${l.id}`,
    href: `/annonce/${l.id}`,
    title: l.title,
    zone: [l.quartier || l.commune, l.city].filter(Boolean).join(", ") || "Côte d'Ivoire",
    image: l.photos?.[0] ?? null,
    price: l.price,
    priceLabel: kind === "furnished" ? "/ nuit" : l.transaction === "rent" ? "/ mois" : "",
    transaction: kind === "event" ? "event" : kind === "furnished" ? "furnished" : l.transaction,
    reservable,
    meta: l.bedrooms
      ? `${l.bedrooms} ch.`
      : PROPERTY_TYPE_LABEL[l.propertyType] ?? l.propertyType,
    propertyType: l.propertyType,
    bedrooms: l.bedrooms,
  };
}

/**
 * Annonces classiques paginées + filtrées côté serveur (à louer / à vendre / tout).
 * C'est le chemin principal du catalogue (des milliers de biens).
 */
export async function listListingsPage(opts: {
  transaction?: "rent" | "sale";
  q?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  listingKind?: string;
  page?: number;
  perPage?: number;
}): Promise<PagedProperties> {
  const { items, total, page, perPage } = await listListings({
    transaction: opts.transaction,
    q: opts.q,
    priceMin: opts.priceMin,
    priceMax: opts.priceMax,
    propertyType: opts.propertyType,
    listingKind: opts.listingKind,
    page: opts.page ?? 1,
    perPage: opts.perPage ?? 24,
  });
  return { items: items.map(mapListing), total, page, perPage };
}

/** Biens similaires : même ville + même type de transaction (hors bien courant). */
export async function similarListings(opts: {
  city: string;
  transaction: "rent" | "sale";
  excludeId: string; // id complet "lst-xxx" ou l'id brut
  limit?: number;
}): Promise<Property[]> {
  const { items } = await listListings({ transaction: opts.transaction, city: opts.city, perPage: 8 });
  const raw = opts.excludeId.replace(/^lst-/, "");
  return items
    .filter((l) => l.id !== raw)
    .slice(0, opts.limit ?? 3)
    .map(mapListing);
}

/** Annonces classiques (à louer / à vendre) via /marketplace/properties. */
async function generalListings(transaction?: "rent" | "sale"): Promise<Property[]> {
  const { items } = await listListings({ transaction, perPage: 24 });
  return items.map((l) => ({
    id: `lst-${l.id}`,
    href: `/annonce/${l.id}`,
    title: l.title,
    zone: [l.quartier || l.commune, l.city].filter(Boolean).join(", ") || "Côte d'Ivoire",
    image: l.photos?.[0] ?? null,
    price: l.price,
    priceLabel: l.transaction === "rent" ? "/ mois" : "",
    transaction: l.transaction,
    reservable: false,
    meta: l.bedrooms
      ? `${l.bedrooms} ch.`
      : PROPERTY_TYPE_LABEL[l.propertyType] ?? l.propertyType,
    propertyType: l.propertyType,
    bedrooms: l.bedrooms,
  }));
}

/**
 * Catalogue Moboo.ci complet : réservable (meublé/événementiel, via marketplace)
 * + annonces classiques (à louer / à vendre, via /properties). On ne récupère
 * que les sources utiles au filtre demandé.
 */
export async function listProperties(opts?: {
  transaction?: Transaction | "all";
  reservable?: boolean;
}): Promise<Property[]> {
  const t = opts?.transaction && opts.transaction !== "all" ? opts.transaction : undefined;
  const reservableOnly = !!opts?.reservable;

  const [res, esp, lst] = await Promise.all([
    !reservableOnly && (t === "rent" || t === "sale") ? Promise.resolve([]) :
      (!t || t === "furnished") ? reservableResidences() : Promise.resolve([]),
    !reservableOnly && (t === "rent" || t === "sale") ? Promise.resolve([]) :
      (!t || t === "event") ? reservableEspaces() : Promise.resolve([]),
    reservableOnly ? Promise.resolve([]) :
      (!t || t === "rent" || t === "sale")
        ? generalListings(t === "rent" || t === "sale" ? t : undefined)
        : Promise.resolve([]),
  ]);

  let all: Property[] = [...res, ...esp, ...lst];
  if (reservableOnly) all = all.filter((p) => p.reservable);
  if (t) all = all.filter((p) => p.transaction === t);
  return all;
}
