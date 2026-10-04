"use server";

import { authedFetch } from "@/lib/server-api";
import type { SeoTexts } from "@/components/backoffice/qr-poster";

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

// ─── Marketing terrain : emplacements, pages SEO, scans ────────────────────

export interface SeoQrPage { id: string; slug: string; title: string; url: string; zone: string; group: string | null; column: string | null; scans30: number }
export interface SeoPlacement { code: string; placement: string; url: string; poster: Partial<SeoTexts> | null; scans: number; createdAt: string }
export interface SeoPosterInfo { page: { id: string; slug: string; title: string; url: string; zone: string; listings: number | null }; defaults: SeoTexts; placements: SeoPlacement[] }
export interface ScanStats {
  days: number; total: number; phones: number; byKind: Record<string, number>; byDevice: Record<string, number>;
  series: { day: string; scans: number }[];
  top: { kind: string; ref: string; scans: number; label: string; href: string | null }[];
  placements: { code: string; placement: string; kind: string; label: string; zone: string | null; scans: number }[];
}

export async function placementUrls(placement: string, items: { kind: string; ref: string; appId: number; label: string }[]): Promise<Record<string, string>> {
  const r = await authedFetch(`${B}/placements`, { method: "POST", body: JSON.stringify({ placement, items }) });
  return r.ok ? r.data : {};
}
export async function scanCounts(items: { kind: string; ref: string }[]): Promise<Record<string, number>> {
  if (!items.length) return {};
  const r = await authedFetch(`${B}/scans/counts`, { method: "POST", body: JSON.stringify({ items }) });
  return r.ok ? r.data : {};
}
export async function getScanStats(days: number): Promise<ScanStats | null> {
  const r = await authedFetch(`${B}/scans?days=${days}`, { method: "GET" });
  return r.ok ? r.data : null;
}
export async function listSeoPages(q: string): Promise<SeoQrPage[]> {
  const r = await authedFetch(`${B}/seo?q=${encodeURIComponent(q)}`, { method: "GET" });
  return r.ok ? r.data.items : [];
}
export async function getSeoPoster(id: string): Promise<SeoPosterInfo | null> {
  const r = await authedFetch(`${B}/seo/${encodeURIComponent(id)}`, { method: "GET" });
  return r.ok ? r.data : null;
}
/** Code de l'affiche (emplacement + textes) puis QR code SVG prêt à imprimer. */
export async function seoCodeAction(id: string, placement: string, poster: SeoTexts): Promise<{ ok: boolean; url?: string; code?: string; svg?: string; error?: string }> {
  const r = await authedFetch(`${B}/seo/${encodeURIComponent(id)}/code`, { method: "POST", body: JSON.stringify({ placement, poster }) });
  if (!r.ok) return { ok: false, error: (r.data as any)?.error?.message || (r.data as any)?.message || "Création du code impossible." };
  const { qrSvg } = await import("@/lib/qr-svg");
  return { ok: true, url: r.data.url, code: r.data.code, svg: await qrSvg(r.data.url) };
}
