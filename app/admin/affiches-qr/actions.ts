"use server";

import { authedFetch } from "@/lib/server-api";

const B = "/site/admin/qr";

export interface QrRealtor {
  ref: string; kind: "agent" | "agency"; source: "account" | "wp"; appId: number; name: string; phone: string;
  photo: string | null; zone: string | null; listings: number; qrUrl: string; landing: string; label: string;
}
export interface QrListing {
  ref: string; kind: "listing"; appId: number; title: string; price: string; photo: string | null;
  zone: string | null; owner: string | null; qrUrl: string; landing: string;
}

export async function searchQr(q: string, type = "all", limit = 40): Promise<{ realtors: QrRealtor[]; listings: QrListing[] } | null> {
  const r = await authedFetch(`${B}?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}&limit=${limit}`, { method: "GET" });
  return r.ok ? r.data : null;
}
export async function getQrRealtor(ref: string): Promise<{ realtor: QrRealtor; listings: QrListing[] } | null> {
  const r = await authedFetch(`${B}/realtors/${encodeURIComponent(ref)}`, { method: "GET" });
  return r.ok ? r.data : null;
}
export async function getQrStats(): Promise<{ realtors: number; listings: number } | null> {
  const r = await authedFetch(`${B}/stats`, { method: "GET" });
  return r.ok ? r.data : null;
}

export type QrBatchPoster = ({ type: "realtor" } & QrRealtor) | ({ type: "listing" } & QrListing);
/** Impression groupée : agents / agences (profil, + toutes leurs annonces si demandé) et annonces choisies. */
export async function getQrBatch(r: string[], l: string[], withListings: boolean): Promise<{ posters: QrBatchPoster[]; truncated: boolean } | null> {
  const qs = new URLSearchParams({ r: r.join(","), l: l.join(","), annonces: withListings ? "1" : "0" });
  const res = await authedFetch(`${B}/batch?${qs}`, { method: "GET" });
  return res.ok ? res.data : null;
}
