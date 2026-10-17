"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

const BASE = "/site/admin/pro-platform";
const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export interface ProPlanConfig {
  plans: Record<"pro" | "business" | "enterprise", { label: string; price: number; promo: number }>;
  modules: Record<string, { label: string; plan: string }>;
  edl: Record<string, number>;
  limits: Record<string, { max_biens: number; max_locataires: number; max_agents: number }>;
  payments: Record<string, boolean>;
}
export const getProPlanConfig = async () => {
  const { ok, data } = await authedFetch(`${BASE}/plans`, { method: "GET" });
  return ok ? (data as ProPlanConfig) : null;
};
export async function saveProPlanConfigAction(input: unknown): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`${BASE}/plans`, { method: "PUT", body: JSON.stringify(input) });
  revalidatePath("/admin/application/forfaits-pro");
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Enregistrement impossible.") };
}

export interface ProAnnouncement {
  id: number; title: string; body: string; image: string | null; color: string; btn_label: string | null; link: string | null; audio: string | null;
  cible: string; published: boolean; position: number; created_at: string;
  stats: { totals: Record<string, number>; byRole: Record<string, Record<string, number>> };
}
export const getProAnnouncements = async () => {
  const { ok, data } = await authedFetch(`${BASE}/announcements`, { method: "GET" });
  return ok ? (data as ProAnnouncement[]) : null;
};
export async function saveProAnnouncementAction(id: number | null, input: unknown): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(id ? `${BASE}/announcements/${id}` : `${BASE}/announcements`, { method: id ? "PUT" : "POST", body: JSON.stringify(input) });
  revalidatePath("/admin/application/annonces-pro");
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Enregistrement impossible.") };
}
export async function deleteProAnnouncementAction(id: number): Promise<{ ok: boolean }> {
  const { ok } = await authedFetch(`${BASE}/announcements/${id}`, { method: "DELETE" });
  revalidatePath("/admin/application/annonces-pro");
  return { ok };
}
export async function proAnnouncementListenersAction(id: number): Promise<{ name: string; email: string; role: string; date: string }[]> {
  const { ok, data } = await authedFetch(`${BASE}/announcements/${id}/listeners`, { method: "GET" });
  return ok && Array.isArray(data) ? data : [];
}
/** Image ou audio d'une annonce (data URI). */
export async function uploadProAnnouncementMediaAction(dataUri: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const { ok, data } = await authedFetch(`${BASE}/announcements/media`, { method: "POST", body: JSON.stringify({ data: dataUri }) });
  return ok && data?.url ? { ok: true, url: data.url } : { ok: false, error: errMsg(data, "Envoi impossible.") };
}
