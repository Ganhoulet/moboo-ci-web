import { API_URL } from "@/lib/api";

/** Forfaits de l'application Moboo Pro (prix, modules, limites, états des lieux). */
export interface ProPlans {
  plans: Record<"pro" | "business" | "enterprise", { label: string; price: number; promo: number }>;
  modules: Record<string, string>;
  edl: { single: number; pack2: number; owner: number };
  limits: Record<string, { max_biens: number; max_locataires: number; max_agents: number }>;
}
export interface MyProPlan {
  linked: boolean; name?: string; plan?: string; active?: boolean; expires_at?: string | null; edl_credits?: number; shared?: string | null;
}

export const PRO_PLAN_KEYS = ["pro", "business", "enterprise"] as const;
export const PRO_RANK: Record<string, number> = { starter: 0, pro: 1, business: 2, enterprise: 3 };
export const PRO_MODULE_LABELS: Record<string, string> = {
  etatsLieux: "États des lieux", devis: "Devis & Calculatrice", crm: "CRM & Prospection", mandats: "Mandats", contrats: "Contrats",
  documents: "Documents partagés", importExport: "Import / Export", scanner: "Scanner", foncier: "Foncier & Lotissements",
  promotion: "Promotion immobilière", mobooScore: "Moboo Score", demandesDossier: "Demandes de dossier", estimation: "Estimation",
  analytics: "Analytics", facility: "Facility Management", multiAgences: "Multi-agences", brandingPdf: "Branding PDF",
};

export async function getProPlans(): Promise<ProPlans | null> {
  try {
    const r = await fetch(`${API_URL}/site/pro-plans`, { next: { revalidate: 60 } });
    return r.ok ? ((await r.json()) as ProPlans) : null;
  } catch {
    return null;
  }
}

export const unitPrice = (p: { price: number; promo: number }) => (p.promo > 0 && p.promo < p.price ? p.promo : p.price);
export const limitText = (n: number) => (n < 0 ? "Illimité" : n.toLocaleString("fr-FR"));
