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
  type?: string; // soiree | journee | weekend | heure | forfait
  dureesIncluses?: number;
  prixHeureSup?: number;
  inclutSon?: boolean;
  inclutLumiere?: boolean;
  inclutNettoyage?: boolean;
  inclutSecurite?: boolean;
  inclutParking?: boolean;
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
  floor?: number | null;
  nightlyPrice: number | string;
  weeklyPrice: number | string | null;
  monthlyPrice?: number | string | null;
  deposit?: number | string | null;
  photos: string[];
  amenities: string[];
  description: string | null;
  status: string;
  houseRules?: string | null;
  services?: string | null;
  virtualTourUrl?: string | null;
  maxGuests?: number | null;
  bedrooms?: number | null;
  beds?: number | null;
  bathrooms?: number | null;
  checkInTime?: string | null;
  checkOutTime?: string | null;
  minNights?: number | null;
}

/** Hôte affiché sur les fiches réservables (jamais de coordonnées avant l'acompte). */
export interface Host {
  name: string;
  avatarUrl: string | null;
  listingsCount: number;
}

export interface ResidenceDetail extends Residence {
  apartments: Apartment[];
  quartier?: string | null;
  host?: Host;
  reference?: number | null;
  videoUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  updatedAt?: string;
}

export interface EspaceDetail extends Espace {
  photos: string[];
  reglesInternes: string | null;
  equipementsInclus: string[];
  host?: Host;
  superficie?: number | null;
  horaireOuverture?: string | null;
  horaireFermeture?: string | null;
  cautionMontant?: number | null;
  acomptePourcentage?: number | null;
  delaiAnnulationHeures?: number | null;
  accepteReservationAuto?: boolean;
  reference?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  updatedAt?: string;
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
  units?: { title: string; price?: number | null; bedrooms?: string; bathrooms?: string; size?: string }[];
  reference?: number | null;
  views?: number;
  createdAt?: string;
  updatedAt?: string;
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
  /** Back-office : « en vedette » et étiquettes (nom + couleur). */
  featured?: boolean;
  labels?: { slug: string; label: string; color: string | null }[];
  /** Statut affiché (back-office → Statuts) : à louer, à vendre, loué, vendu. */
  statusLabel?: { slug: string; label: string; color: string | null } | null;
  /** Annonceur (compte du site) : coordonnées publiques. */
  owner?: {
    name: string; kind: string; photoUrl: string | null; username: string | null;
    phone: string | null; whatsapp: string | null; email: string | null;
  } | null;
}
