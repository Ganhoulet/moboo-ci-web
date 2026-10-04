"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { MARKETING_TAG } from "@/lib/marketing";

const msg = (d: any, f: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || (Array.isArray(d?.error?.message) ? d.error.message[0] : d?.error?.message) || f;

type Who = { name: string; phone: string | null };
export interface AdsAdmin {
  totals: { activeBoosts: number; activePartners: number; activeShowcases: number; pendingBanners: number; creditsSpent: number; creditsBought: number; creditsOutstanding: number };
  boosts: { id: string; listingId: string; listingTitle: string; zoneLabel: string; endsAt: string; amount: number; impressions: number; clicks: number; account: Who }[];
  partners: { id: string; zoneLabel: string; endsAt: string; amount: number; impressions: number; clicks: number; account: Who }[];
  pending: { id: string; title: string | null; text: string | null; imageUrl: string | null; ctaUrl: string | null; placements: string[]; targetZones: string[]; days: number; paid: number; createdAt: string; account: Who }[];
  campaigns: { id: string; title: string | null; review: string; reviewNote: string | null; endsAt: string | null; views: number; clicks: number; paid: number; account: Who }[];
}

export async function getAdsAdmin(): Promise<AdsAdmin | null> {
  const r = await authedFetch("/site/admin/ads", { method: "GET" });
  return r.ok ? r.data : null;
}

export async function reviewBannerAction(id: string, approve: boolean, note?: string): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`/site/admin/ads/campaigns/${encodeURIComponent(id)}/review`, { method: "POST", body: JSON.stringify({ approve, note }) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Action impossible.") };
  revalidateTag(MARKETING_TAG);
  revalidatePath("/admin/publicite");
  return { ok: true };
}

export async function grantCreditsAction(phone: string, amount: number, note: string): Promise<{ ok: boolean; error?: string; message?: string }> {
  const r = await authedFetch("/site/admin/ads/credits", { method: "POST", body: JSON.stringify({ phone, amount, note }) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Action impossible.") };
  revalidatePath("/admin/publicite");
  return { ok: true, message: `${r.data.account} : nouveau solde ${Number(r.data.balance).toLocaleString("fr-FR")} crédits.` };
}
