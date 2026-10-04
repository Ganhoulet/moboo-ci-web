"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { getSession } from "@/lib/session";
import type { AdsPricing } from "@/lib/ads";

const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export interface AdsOverview {
  balance: number;
  pricing: AdsPricing;
  history: { id: string; amount: number; balanceAfter: number; reason: string; label: string; createdAt: string }[];
  boosts: { id: string; listingId: string; listingTitle: string; zone: string; zoneLabel: string; startsAt: string; endsAt: string; amount: number; impressions: number; clicks: number; live: boolean }[];
  partners: { id: string; zone: string; zoneLabel: string; endsAt: string; amount: number; impressions: number; clicks: number; live: boolean }[];
  campaigns: { id: string; title: string; text: string | null; imageUrl: string | null; placements: string[]; targetZones: string[]; days: number; paid: number; review: "pending" | "approved" | "rejected"; reviewNote: string | null; active: boolean; startsAt: string | null; endsAt: string | null; views: number; clicks: number }[];
  listings: { id: string; title: string; city: string; commune: string | null; online: boolean; photo: string | null; views: number; showcaseUntil: string | null }[];
}

export async function getAdsOverview(): Promise<AdsOverview | null> {
  if (!getSession()) return null;
  const { ok, data } = await authedFetch("/site/me/ads", { method: "GET" });
  return ok ? data : null;
}

type R = { ok: boolean; error?: string; message?: string; paymentUrl?: string | null };
async function call(path: string, body: unknown, ok: (d: any) => string, method = "POST"): Promise<R> {
  if (!getSession()) return { ok: false, error: "Connectez-vous d'abord." };
  const r = await authedFetch(path, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (!r.ok) return { ok: false, error: errMsg(r.data, "Action impossible.") };
  revalidatePath("/mon-espace/publicite");
  return { ok: true, message: ok(r.data) };
}
const cr = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} crédits`;

/** Recharge : lien de paiement (Money Fusion, ou page de paiement simulé en mode test). */
export async function topupAction(amount: number): Promise<R> {
  if (!getSession()) return { ok: false, error: "Connectez-vous d'abord." };
  const r = await authedFetch("/site/me/ads/topup", { method: "POST", body: JSON.stringify({ amount }) });
  if (!r.ok) return { ok: false, error: errMsg(r.data, "Recharge impossible.") };
  return { ok: true, paymentUrl: r.data?.paymentUrl ?? `/mon-espace/publicite?facture=${r.data?.invoiceId}` };
}
export const boostAction = (listingId: string, scope: "commune" | "city", days: number) =>
  call("/site/me/ads/boost", { listingId, scope, days }, (d) => `Boost actif à ${d.boost?.zoneLabel} jusqu’au ${new Date(d.boost?.endsAt).toLocaleDateString("fr-FR")} (−${cr(d.price)}).`);
export const showcaseAction = (listingId: string) =>
  call(`/site/me/ads/showcase/${encodeURIComponent(listingId)}`, {}, (d) => `Vitrine active jusqu’au ${new Date(d.showcaseUntil).toLocaleDateString("fr-FR")} (−${cr(d.price)}).`);
export const partnerAction = (zone: string) =>
  call("/site/me/ads/partner", { zone }, (d) => `Vous êtes partenaire à ${d.partner?.zoneLabel} jusqu’au ${new Date(d.partner?.endsAt).toLocaleDateString("fr-FR")} (−${cr(d.price)}).`);
export const campaignAction = (input: { title: string; text: string; imageUrl: string; ctaLabel: string; ctaUrl: string; days: number; placements: string[]; zones: string[] }) =>
  call("/site/me/ads/campaigns", input, (d) => d.campaign?.review === "pending" ? `Bannière envoyée : elle s’affichera après validation par l’équipe (−${cr(d.price)}).` : `Bannière en ligne (−${cr(d.price)}).`);
export const cancelCampaignAction = (id: string) =>
  call(`/site/me/ads/campaigns/${encodeURIComponent(id)}`, undefined, () => "Bannière annulée, crédits rendus.", "DELETE");
