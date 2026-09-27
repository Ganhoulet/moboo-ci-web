/** Formes renvoyées par le moteur NestJS (module marketplace). */

export interface Residence {
  id: string;
  name: string;
  description: string | null;
  city: string;
  commune: string | null;
  photos: string[];
  amenities: string[];
  minNightlyPrice: number | null;
  currency: string;
  apartmentsCount: number;
}

export interface Tarif {
  id?: string;
  nom?: string;
  prix?: number;
}

export interface Espace {
  id: string;
  slug: string;
  nom: string;
  type: string;
  description: string | null;
  commune: string;
  quartier: string | null;
  capaciteMin: number;
  capaciteMax: number;
  photoPrincipaleUrl: string | null;
  videoUrl: string | null;
  tarifs: Tarif[];
}

export interface Paginated<T> {
  total: number;
  page: number;
  perPage: number;
  items: T[];
}

export interface Apartment {
  id: string;
  type: string;
  surface: number | null;
  nightlyPrice: number | string;
  weeklyPrice: number | string | null;
  photos: string[];
  amenities: string[];
  description: string | null;
  status: string;
}

export interface ResidenceDetail extends Residence {
  apartments: Apartment[];
}

export interface EspaceDetail extends Espace {
  photos: string[];
  reglesInternes: string | null;
  equipementsInclus: string[];
}

/** Annonce classique (à louer / à vendre) — feed public /marketplace/properties. */
export interface ListingItem {
  id: string;
  transaction: "rent" | "sale";
  propertyType: string;
  listingKind?: string; // classic | furnished | event
  subType?: string | null;
  title: string;
  price: number;
  priceUnit: string | null;
  currency: string;
  city: string;
  commune: string | null;
  quartier: string | null;
  bedrooms: number | null;
  bathrooms?: number | null;
  surface: number | null;
  photos: string[];
  // détail uniquement :
  garage?: number | null;
  yearBuilt?: number | null;
  features?: string[];
  videoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  contactName?: string | null;
  contactPhone?: string | null;
  agent?: {
    name: string;
    kind: string; // agent | agency
    phone?: string | null;
    whatsapp?: string | null;
    email?: string | null;
    photoUrl?: string | null;
    position?: string | null;
    company?: string | null;
    serviceArea?: string | null;
  } | null;
}
