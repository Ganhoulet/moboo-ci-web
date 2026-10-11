"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { SEO_TAG } from "@/lib/seo";
import { authedFetch } from "@/lib/server-api";

export interface Backlink {
  id: string; sourceUrl: string; sourceName: string; kind: string; targetPath: string; anchor: string; status: string;
  contact: string; notes: string; live: boolean | null; follow: boolean | null; foundHref: string | null;
  lastCheckedAt: string | null; lastError: string | null; createdAt: string;
}
export interface BacklinkStats { total: number; obtenu: number; enCours: number; perdu: number; live: number; follow: number }
export interface SocialVideo {
  id: string; platform: string; url: string; videoId: string; title: string; zoneSlug: string | null; targetPath: string;
  code: string; number: number; clicks: number; views: number; showOnSite: boolean; createdAt: string;
}
type R = { ok: boolean; error?: string };
const msg = (d: any, f: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || d?.error?.message || f;
const B = "/site/admin/seo";

export async function getBacklinks(): Promise<{ items: Backlink[]; stats: BacklinkStats } | null> {
  const r = await authedFetch(`${B}/backlinks/all`, { method: "GET" });
  return r.ok ? r.data : null;
}
export async function getVideos(): Promise<SocialVideo[]> {
  const r = await authedFetch(`${B}/videos/all`, { method: "GET" });
  return r.ok ? r.data.items : [];
}
async function send(path: string, method: string, body?: unknown, page = "/admin/seo/backlinks"): Promise<R> {
  const r = await authedFetch(`${B}${path}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
  revalidatePath(page);
  // Vidéos affichées sur les pages du quartier : rafraîchies tout de suite.
  if (page === "/admin/seo/tiktok") revalidateTag(SEO_TAG);
  return r.ok ? { ok: true } : { ok: false, error: msg(r.data, "Action impossible.") };
}
export const saveBacklinkAction = async (id: string | null, body: Partial<Backlink>) => send(id ? `/backlinks/${id}` : "/backlinks/new", id ? "PUT" : "POST", body);
export const checkBacklinkAction = async (id: string) => send(`/backlinks/${id}/check`, "POST");
export const checkAllBacklinksAction = async () => send("/backlinks/check-all", "POST");
export const deleteBacklinkAction = async (id: string) => send(`/backlinks/${id}`, "DELETE");
export const saveVideoAction = async (id: string | null, body: Partial<SocialVideo>) => send(id ? `/videos/${id}` : "/videos/new", id ? "PUT" : "POST", body, "/admin/seo/tiktok");
export const deleteVideoAction = async (id: string) => send(`/videos/${id}`, "DELETE", undefined, "/admin/seo/tiktok");
