import { listEspaces, listResidences } from "./api";

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

async function reservableResidences(): Promise<Property[]> {
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

async function reservableEspaces(): Promise<Property[]> {
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

/**
 * Catalogue Moboo.ci. Les biens RÉSERVABLES (meublé/événementiel) viennent du
 * module `marketplace`. Les annonces classiques (à louer / à vendre) viendront
 * de l'endpoint `/properties` du moteur — brique à construire (migration
 * WordPress → NestJS des annonces). En attendant, on affiche le réservable.
 */
export async function listProperties(opts?: {
  transaction?: Transaction | "all";
  reservable?: boolean;
}): Promise<Property[]> {
  const [res, esp] = await Promise.all([reservableResidences(), reservableEspaces()]);
  let all: Property[] = [...res, ...esp];
  // TODO(engine): + annonces générales rent/sale via GET /properties.
  if (opts?.reservable) all = all.filter((p) => p.reservable);
  if (opts?.transaction && opts.transaction !== "all") {
    all = all.filter((p) => p.transaction === opts.transaction);
  }
  return all;
}
