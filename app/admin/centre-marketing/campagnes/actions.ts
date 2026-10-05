"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

export interface Audience {
  source?: "site" | "clients" | "hosts"; clientKind?: "stay" | "event" | "all"; bookedWithinDays?: number; hostApp?: "resi" | "event" | "all";
  accountTypes?: string[]; places?: string[]; verified?: "yes" | "no" | "any"; listings?: "with" | "without" | "any";
  signedUpWithinDays?: number; inactiveDays?: number; activeWithinDays?: number;
}
export interface Campaign {
  id?: string; name: string; channel: "email" | "whatsapp" | "sms" | "push"; audience: Audience;
  subject: string; body: string; waTemplate: string; waLanguage: string; waVars: string[]; pushApp: "resi" | "event"; link: string;
}
export interface CampaignRow extends Campaign {
  id: string; status: "draft" | "scheduled" | "sending" | "sent" | "cancelled"; scheduledAt: string | null; startedAt: string | null; finishedAt: string | null;
  total: number; sent: number; failed: number; createdAt: string; createdBy: string | null;
}
export interface CampaignDetail extends CampaignRow {
  counts: { pending: number; sent: number; failed: number }; errors: { address: string; error: string | null }[]; variables: Record<string, string>;
}

const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Action impossible.";
const done = () => revalidatePath("/admin/centre-marketing/campagnes", "layout");

export async function listCampaigns(): Promise<{ items: CampaignRow[]; variables: Record<string, string> } | null> {
  const r = await authedFetch("/site/admin/broadcasts", { method: "GET" });
  return r.ok ? r.data : null;
}
export async function getCampaign(id: string): Promise<CampaignDetail | null> {
  const r = await authedFetch(`/site/admin/broadcasts/${encodeURIComponent(id)}`, { method: "GET" });
  return r.ok ? r.data : null;
}
export async function previewAction(c: Pick<Campaign, "channel" | "audience" | "pushApp">): Promise<{ count: number; excluded: number; sample: { nom: string; ville: string }[] } | null> {
  const r = await authedFetch("/site/admin/broadcasts/preview", { method: "POST", body: JSON.stringify(c) });
  return r.ok ? r.data : null;
}
export async function saveCampaignAction(c: Campaign): Promise<{ ok: boolean; id?: string; error?: string }> {
  const r = c.id
    ? await authedFetch(`/site/admin/broadcasts/${encodeURIComponent(c.id)}`, { method: "PATCH", body: JSON.stringify(c) })
    : await authedFetch("/site/admin/broadcasts", { method: "POST", body: JSON.stringify(c) });
  if (r.ok) done();
  return r.ok ? { ok: true, id: r.data.id } : { ok: false, error: err(r.data) };
}
export async function testCampaignAction(c: Campaign, to: string): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch("/site/admin/broadcasts/test", { method: "POST", body: JSON.stringify({ campaign: c, to }) });
  return r.ok ? r.data : { ok: false, error: err(r.data) };
}
export async function sendCampaignAction(id: string, at: string | null): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`/site/admin/broadcasts/${encodeURIComponent(id)}/send`, { method: "POST", body: JSON.stringify({ at }) });
  if (r.ok) done();
  return r.ok ? { ok: true } : { ok: false, error: err(r.data) };
}
export async function cancelCampaignAction(id: string): Promise<void> {
  await authedFetch(`/site/admin/broadcasts/${encodeURIComponent(id)}/cancel`, { method: "POST" });
  done();
}
export async function duplicateCampaignAction(id: string): Promise<{ id?: string }> {
  const r = await authedFetch(`/site/admin/broadcasts/${encodeURIComponent(id)}/duplicate`, { method: "POST" });
  done();
  return r.ok ? { id: r.data.id } : {};
}
export async function deleteCampaignAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`/site/admin/broadcasts/${encodeURIComponent(id)}`, { method: "DELETE" });
  done();
  return r.ok ? { ok: true } : { ok: false, error: err(r.data) };
}
