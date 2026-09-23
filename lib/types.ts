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
