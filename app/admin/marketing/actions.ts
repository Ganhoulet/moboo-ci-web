"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { MARKETING_TAG } from "@/lib/marketing";

export interface Campaign {
  id: string; name: string; placements: string[]; template: "image" | "split" | "hero";
  title: string | null; text: string | null; imageUrl: string | null; badge: string | null;
  ctaLabel: string | null; ctaUrl: string | null; bgColor: string; textColor: string; ctaColor: string;
  audience: "all" | "guests" | "members"; platforms: string[]; frequency: "once" | "daily" | "always";
  dismissible: boolean; delaySec: number; priority: number; active: boolean;
  startsAt: string | null; endsAt: string | null; views: number; clicks: number; dismissals: number;
  createdAt: string; updatedAt: string;
}

const msg = (d: any, f: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || f;
const done = () => { revalidateTag(MARKETING_TAG); revalidatePath("/admin/marketing"); };

export async function listCampaigns(): Promise<Campaign[]> {
  const r = await authedFetch("/site/admin/marketing", { method: "GET" });
  return r.ok ? r.data.items : [];
}

export async function saveCampaignAction(id: string | null, body: Partial<Campaign>): Promise<{ ok: boolean; error?: string; id?: string }> {
  const r = await authedFetch(id ? `/site/admin/marketing/${encodeURIComponent(id)}` : "/site/admin/marketing", { method: id ? "PUT" : "POST", body: JSON.stringify(body) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Enregistrement impossible.") };
  done();
  return { ok: true, id: r.data.id };
}

export async function toggleCampaignAction(id: string, active: boolean) {
  const r = await authedFetch(`/site/admin/marketing/${encodeURIComponent(id)}/active`, { method: "PATCH", body: JSON.stringify({ active }) });
  done();
  return { ok: r.ok };
}

export async function duplicateCampaignAction(id: string) {
  const r = await authedFetch(`/site/admin/marketing/${encodeURIComponent(id)}/duplicate`, { method: "POST" });
  done();
  return { ok: r.ok, id: r.data?.id as string | undefined };
}

export async function deleteCampaignAction(id: string) {
  const r = await authedFetch(`/site/admin/marketing/${encodeURIComponent(id)}`, { method: "DELETE" });
  done();
  return { ok: r.ok };
}
