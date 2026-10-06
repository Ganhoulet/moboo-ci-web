// Services Moboo (ex-extensions WordPress) : types partagés par le back-office.
// Miroir de l'API : src/modules/moboo-services/services.config.ts.

export interface Soon { on: boolean; at: string; title: string; message: string }
export interface CreditPack { id: string; label: string; credits: number; price: number }
export interface AlertePack { id: string; label: string; audience: "sender" | "agent"; credits: number; days: number; price: number }
export interface RechargePack { id: string; label: string; amount: number; price: number }

export interface ServicesConfig {
  alertes: { enabled: boolean; userPaid: boolean; agentPaid: boolean; packages: AlertePack[] };
  edl: { enabled: boolean; agentPaid: boolean; seqPct: number; mobooSharePct: number; soon: Soon; packages: RechargePack[] };
  support: { version: number; maintenance: boolean; maintenanceMsg: string; minAppVersion: string; whatsapp: string; chatForAll: boolean };
  foncier: { enabled: boolean; soon: Soon; marketLabel: string; minObs: number; since: string; minSqm: number; maxSqm: number; packages: CreditPack[] };
  loyer: { enabled: boolean; soon: Soon; minObs: number; since: string; trendSince: string; trendMin: number; packages: CreditPack[] };
  card: {
    durationMonths: number; reminderDays: number[];
    primaryColor: string; secondaryColor: string; goldColor: string; accentColor: string;
    showPhoto: boolean; showAgency: boolean; showPhone: boolean; showEmail: boolean; showWebsite: boolean; showWhatsapp: boolean; showTagline: boolean;
    footerText: string; legalFront: string; legalBack: string; legalSide: string; disclaimer: string;
    defaultTitleAgent: string; defaultTitleAgency: string;
  };
}

export const WALLET_LABEL: Record<string, string> = {
  alerte_send: "Envois d’alertes (crédits)",
  alerte_agent: "Réception des alertes (jours d’abonnement agent)",
  edl_wallet: "Wallet état des lieux (FCFA)",
  foncier_pdf: "Rapports fonciers PDF (crédits)",
  loyer_report: "Rapports loyer (crédits)",
};

export const fcfa = (n: number | null | undefined) => `${Math.round(Number(n) || 0).toLocaleString("fr-FR").replace(/[  ]/g, " ")} FCFA`;
