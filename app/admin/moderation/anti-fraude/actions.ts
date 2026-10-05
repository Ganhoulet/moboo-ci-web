"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

export interface RiskReason { text: string; points: number }
export interface RiskyAccount {
  id: string; name: string; phone: string; accountType: string; status: string; verified: boolean; createdAt: string; listings: number;
  score: number; level: "eleve" | "moyen" | "faible"; reasons: RiskReason[]; linked: { id: string; name: string; status: string | null }[];
}
export interface ReusedPhoto {
  url: string; firstUrl: string; listingId: string; title: string; owner: string; ownerKey: string;
  firstListingId: string; firstTitle: string; firstOwner: string; firstOwnerKey: string; distance: number;
}
export interface FraudOverview {
  counts: { high: number; medium: number; reusedPhotos: number; photosAnalysed: number; photosPending: number; devicesSeen: number };
  risky: RiskyAccount[];
  reused: ReusedPhoto[];
}

export async function getFraudOverview(): Promise<FraudOverview | null> {
  const r = await authedFetch("/site/admin/fraud", { method: "GET" });
  return r.ok ? r.data : null;
}
export async function getAccountRisk(id: string): Promise<RiskyAccount | null> {
  const r = await authedFetch(`/site/admin/fraud/accounts/${encodeURIComponent(id)}`, { method: "GET" });
  return r.ok ? r.data : null;
}
export async function scanPhotosAction(): Promise<void> {
  await authedFetch("/site/admin/fraud/scan-photos?max=300", { method: "POST" });
  revalidatePath("/admin/moderation/anti-fraude");
}
