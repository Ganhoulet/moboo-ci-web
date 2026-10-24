"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

/* ─── Vidéo d'une annonce (Mon espace) ─────────────────────────────────── */

const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export interface ListingVideo {
  uploadEnabled: boolean; maxMb: number; maxSeconds: number; aiRooms: boolean; aiHint: string | null;
  video:
    | { kind: "file"; status: string; provider: "r2" | "bunny"; uploadedAt: string | null; size: number | null; keep: boolean; deleteOn: string | null; video_url: string; thumbnail_url: string; embed_url: string }
    | { kind: "youtube"; url: string; thumbnail_url: string }
    | { kind: "link"; url: string }
    | null;
}

const path = (id: string) => `/site/video/listing/${encodeURIComponent(id)}`;

/** Envoi depuis le site (nouvelle annonce, avant qu'elle existe) : activé, tailles et durées. */
export async function getSiteVideoConfig(): Promise<ListingVideo | null> {
  const { ok, data } = await authedFetch("/site/video/config", { method: "GET" });
  return ok ? (data as ListingVideo) : null;
}

export async function getListingVideo(id: string): Promise<ListingVideo | null> {
  const { ok, data } = await authedFetch(path(id), { method: "GET" });
  return ok ? (data as ListingVideo) : null;
}

/** Jeton d'envoi (30 min) : le navigateur envoie ensuite le fichier directement à l'API. */
export async function videoTicketAction(id: string): Promise<{ ok: true; token: string; uploadUrl: string; maxMb: number } | { ok: false; error: string }> {
  const { ok, data } = await authedFetch(`${path(id)}/ticket`, { method: "POST", body: "{}" });
  return ok ? { ok: true, token: data.token, uploadUrl: data.uploadUrl, maxMb: data.maxMb } : { ok: false, error: errMsg(data, "Envoi impossible pour le moment.") };
}

export async function videoKeepAction(id: string, keep = true): Promise<{ ok: boolean }> {
  const { ok } = await authedFetch(`${path(id)}/keep`, { method: "POST", body: JSON.stringify({ keep }) });
  revalidatePath(`/mon-espace/annonces/${id}`);
  return { ok };
}

export async function videoRemoveAction(id: string): Promise<{ ok: boolean }> {
  const { ok } = await authedFetch(path(id), { method: "DELETE" });
  revalidatePath(`/mon-espace/annonces/${id}`);
  return { ok };
}

export async function videoRefreshAction(id: string) {
  revalidatePath(`/mon-espace/annonces/${id}`);
}
