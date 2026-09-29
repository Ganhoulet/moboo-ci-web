// Réglages du site définis dans le back-office (/admin). Lus côté serveur,
// mis en cache 60 s (étiquette « site-settings », vidée à chaque enregistrement).
import { API_URL } from "./api";
import { relayHeaders } from "./relay";

export interface SiteSettings {
  general: {
    containerWidth: string; backToTop: boolean; favoritesLoginRequired: boolean;
    excerptEnabled: boolean; excerptWords: number; readMoreText: string;
  };
  branding: {
    siteName: string; logoUrl: string; logoHeight: number; faviconUrl: string;
    footerTagline: string; seoTitle: string; seoDescription: string;
  };
  header: {
    headerStyle: "classic" | "dark" | "contacts" | "centered"; headerLayout: "container" | "full";
    navAlign: "left" | "center" | "right"; headerAddress: string; headerHours: string;
    showPublishButton: boolean; publishButtonText: string; showSignupButton: boolean;
    topBarEnabled: boolean; topBarText: string; topBarPhone: string; topBarWhatsapp: string; topBarEmail: string;
    facebookUrl: string; instagramUrl: string; tiktokUrl: string; linkedinUrl: string; youtubeUrl: string;
  };
  auth: {
    loginPhone: boolean; loginPassword: boolean; loginGoogle: boolean; loginIntro: string;
    signupEnabled: boolean; signupAccountTypes: string[];
  };
  notifications: { inquirySuccessText: string; visitSuccessText: string; reservationSuccessText: string };
  listing: {
    bannerStyle: "mosaic" | "wide" | "split" | "collage";
    showVideo: boolean; showFeatures: boolean; showMap: boolean; showVisitForm: boolean;
    showContactForm: boolean; showSimilar: boolean; similarCount: number; contactNotice: string;
  };
  submit: { maxPhotos: number; submitIntro: string };
  search: { perPage: number; headerSearch: "none" | "simple" | "filters"; headerSearchPages: "details" | "all" };
  print: {
    enabled: boolean; logoUrl: string; showAgent: boolean; showDescription: boolean;
    showDetails: boolean; showFeatures: boolean; showGallery: boolean; showQr: boolean; footerText: string;
  };
  reviews: { enabled: boolean; onListings: boolean; onPros: boolean; moderation: boolean; intro: string };
  packages: {
    enabled: boolean; requirePackage: boolean; freeListings: number; pageTitle: string; pageIntro: string;
    companyName: string; companyAddress: string; companyTaxId: string; invoiceNote: string;
  };
}

/** Valeurs de secours (API injoignable) — les mêmes que le schéma de l'API. */
export const DEFAULT_SETTINGS: SiteSettings = {
  general: { containerWidth: "1270", backToTop: true, favoritesLoginRequired: false, excerptEnabled: true, excerptWords: 75, readMoreText: "Lire la suite" },
  branding: {
    siteName: "Moboo.ci", logoUrl: "", logoHeight: 32, faviconUrl: "",
    footerTagline: "Louer, acheter, réserver — l’immobilier en Côte d’Ivoire.",
    seoTitle: "Moboo.ci — Louer, acheter & réserver en Côte d’Ivoire",
    seoDescription: "L’immobilier en Côte d’Ivoire : biens à louer, à vendre, résidences meublées et espaces événementiels. Réservation en ligne sécurisée quand c’est possible.",
  },
  header: {
    headerStyle: "classic", headerLayout: "container", navAlign: "center", headerAddress: "", headerHours: "",
    showPublishButton: true, publishButtonText: "Publier", showSignupButton: true,
    topBarEnabled: false, topBarText: "", topBarPhone: "", topBarWhatsapp: "", topBarEmail: "",
    facebookUrl: "", instagramUrl: "", tiktokUrl: "", linkedinUrl: "", youtubeUrl: "",
  },
  auth: {
    loginPhone: true, loginPassword: true, loginGoogle: true,
    loginIntro: "Au choix : votre numéro de téléphone, votre identifiant ou votre compte Google. Retrouvez vos favoris, vos annonces, vos messages et vos alertes.",
    signupEnabled: true, signupAccountTypes: ["particulier", "proprietaire", "agent", "entreprise", "etablissement"],
  },
  notifications: {
    inquirySuccessText: "Demande envoyée ! L’annonceur vous recontactera bientôt.",
    visitSuccessText: "Demande de visite envoyée ! L’annonceur vous recontactera pour confirmer.",
    reservationSuccessText: "Demande de réservation envoyée ! L’annonceur confirme la disponibilité et vous recontacte.",
  },
  listing: {
    bannerStyle: "mosaic",
    showVideo: true, showFeatures: true, showMap: true, showVisitForm: true, showContactForm: true,
    showSimilar: true, similarCount: 4,
    contactNotice: "Mise en relation directe avec l’annonceur — Moboo ne prend pas de commission sur les ventes et locations classiques.",
  },
  submit: { maxPhotos: 12, submitIntro: "Publiez votre bien en quelques minutes : les intéressés vous contactent directement, sans commission." },
  search: { perPage: 24, headerSearch: "none", headerSearchPages: "details" },
  print: {
    enabled: true, logoUrl: "", showAgent: true, showDescription: true, showDetails: true, showFeatures: true,
    showGallery: false, showQr: true, footerText: "Fiche imprimée depuis Moboo.ci — l’immobilier en Côte d’Ivoire.",
  },
  reviews: { enabled: true, onListings: true, onPros: true, moderation: true, intro: "Partagez votre expérience : votre avis aide les autres visiteurs." },
  packages: {
    enabled: true, requirePackage: false, freeListings: 3, pageTitle: "Choisissez votre forfait",
    pageIntro: "Publiez plus d’annonces et mettez vos biens en vedette. Paiement par Wave, Orange Money, MTN, Moov ou carte.",
    companyName: "Moboo.ci", companyAddress: "Abidjan, Côte d’Ivoire", companyTaxId: "", invoiceNote: "Merci pour votre confiance.",
  },
};

export const SETTINGS_TAG = "site-settings";

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const res = await fetch(`${API_URL}/site/settings`, {
      next: { revalidate: 60, tags: [SETTINGS_TAG] },
      headers: { Accept: "application/json", ...relayHeaders(false) },
    });
    if (!res.ok) return DEFAULT_SETTINGS;
    const data = (await res.json()) as Partial<SiteSettings>;
    const out = { ...DEFAULT_SETTINGS } as any;
    for (const k of Object.keys(DEFAULT_SETTINGS) as (keyof SiteSettings)[]) out[k] = { ...DEFAULT_SETTINGS[k], ...(data[k] ?? {}) };
    return out as SiteSettings;
  } catch {
    return DEFAULT_SETTINGS;
  }
}
