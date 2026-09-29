import type { ListingDraft } from "@/components/listing-editor";

/**
 * Brouillon vide de l'éditeur. Ici (module serveur/partagé) et non dans le
 * composant client : une page serveur ne peut pas appeler une fonction d'un
 * module « use client ».
 */
export function emptyDraft(contact?: { name?: string; phone?: string }): ListingDraft {
  return {
    transaction: "rent", propertyType: "appartement", title: "", price: "", description: "",
    bedrooms: "", bathrooms: "", garage: "", surface: "", yearBuilt: "", features: [],
    city: "Abidjan", commune: "", quartier: "", address: "", latitude: null, longitude: null,
    photos: [], videoUrl: "", contactName: contact?.name ?? "", contactPhone: contact?.phone ?? "",
  };
}

const s = (v: unknown) => (v == null ? "" : String(v));

/** Annonce (API) → brouillon de l'éditeur (espace compte et back-office). */
export function draftFromListing(l: Record<string, any>): ListingDraft {
  return {
    transaction: l.transaction === "sale" ? "sale" : "rent",
    propertyType: l.propertyType || "autre",
    title: s(l.title), price: s(l.price), description: s(l.description),
    bedrooms: s(l.bedrooms), bathrooms: s(l.bathrooms), garage: s(l.garage), surface: s(l.surface), yearBuilt: s(l.yearBuilt),
    features: Array.isArray(l.features) ? l.features.map(String) : [],
    city: s(l.city) || "Abidjan", commune: s(l.commune), quartier: s(l.quartier), address: s(l.address),
    latitude: l.latitude ?? null, longitude: l.longitude ?? null,
    photos: Array.isArray(l.photos) ? l.photos.map(String) : [],
    videoUrl: s(l.videoUrl), contactName: s(l.contactName), contactPhone: s(l.contactPhone),
  };
}
