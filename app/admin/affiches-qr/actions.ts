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

export async function searchQr(q: string, type = "all"): Promise<{ realtors: QrRealtor[]; listings: QrListing[] } | null> {
  const r = await authedFetch(`${B}?q=${encodeURIComponent(q)}&type=${encodeURIComponent(type)}`, { method: "GET" });
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
