"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Action impossible.";
type Res = { ok: boolean; error?: string; data?: any };

async function call(path: string, method: string, body?: unknown, username?: string | null): Promise<Res> {
  const r = await authedFetch(`/site/me/pro-profile${path}`, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (r.ok && username) revalidatePath(`/pro/${username}`);
  return r.ok ? { ok: true, data: r.data } : { ok: false, error: err(r.data) };
}

export async function saveProPage(input: Record<string, unknown>, username: string | null) { return call("", "PUT", input, username); }
export async function addVideoLinks(urls: string[], caption: string, username: string | null) { return call("/video-link", "POST", { urls, caption }, username); }
export async function leaveAgency(username: string | null) { return call("/leave-agency", "POST", {}, username); }
export async function removeMedia(id: string, username: string | null) { return call(`/media/${id}`, "DELETE", undefined, username); }
export async function arrangeMedia(items: { id: string; caption: string }[], username: string | null) { return call("/media", "PUT", { items }, username); }
export async function refreshProPage(username: string | null) { if (username) revalidatePath(`/pro/${username}`); return call("", "GET"); }

/** Jeton d'envoi direct : la photo part du navigateur vers l'API. */
export async function mediaUploadUrl() {
  const r = await call("/upload-token", "POST", {});
  if (!r.ok) return r;
  const base = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
  return { ok: true, data: { url: `${base}/site/pro-media/upload?t=${encodeURIComponent(r.data.token)}`, maxMb: r.data.maxMb } };
}
