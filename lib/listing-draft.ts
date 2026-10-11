import type { FloorPlanDraft, ListingDraft, UnitDraft } from "@/components/listing-editor";

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
    ...EMPTY_EXTRAS,
  };
}

/** Champs complémentaires (mêmes que le formulaire de l'application Moboo.ci). */
const EMPTY_EXTRAS = {
  labels: [] as string[], pricePrefix: "", pricePostfix: "", secondaryPrice: "", sizeUnit: "m²", landArea: "", landAreaUnit: "m²", garageSize: "",
  additional: [] as { title: string; value: string }[], virtualTour: "", floorPlans: [] as FloorPlanDraft[], units: [] as UnitDraft[],
  postalCode: "", disclaimer: "", privateNote: "",
};

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
    ...extrasFromListing(l),
  };
}

function extrasFromListing(l: Record<string, any>) {
  const x = l.details && typeof l.details === "object" ? l.details : {};
  const arr = (v: unknown) => (Array.isArray(v) ? v : []);
  return {
    labels: arr(l.labels).map((v: any) => (typeof v === "string" ? v : String(v?.slug ?? ""))).filter(Boolean),
    pricePrefix: s(x.pricePrefix), pricePostfix: s(x.pricePostfix), secondaryPrice: s(x.secondaryPrice),
    sizeUnit: s(x.sizeUnit) || "m²", landArea: s(x.landArea), landAreaUnit: s(x.landAreaUnit) || "m²", garageSize: s(x.garageSize),
    additional: arr(x.additional).map((a: any) => ({ title: s(a?.title), value: s(a?.value) })),
    virtualTour: s(x.virtualTour),
    floorPlans: arr(x.floorPlans).map((p: any) => ({ title: s(p?.title), price: s(p?.price), size: s(p?.size), rooms: s(p?.rooms), baths: s(p?.baths), image: s(p?.image), description: s(p?.description) })),
    units: arr(l.units).map((u: any) => ({ title: s(u?.title), price: s(u?.price), priceUnit: s(u?.priceUnit), beds: s(u?.beds), baths: s(u?.baths), size: s(u?.size), sizeUnit: s(u?.sizeUnit), type: s(u?.type), availability: s(u?.availability) })),
    postalCode: s(x.postalCode), disclaimer: s(x.disclaimer), privateNote: s(x.privateNote),
  };
}
