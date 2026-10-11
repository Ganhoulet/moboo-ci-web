"use server";

import { authedFetch } from "@/lib/server-api";

export interface GscRow { clicks: number; impressions: number; ctr: number; position: number }
export interface GscOverview {
  configured: boolean; site: string; account?: string; days?: number; from?: string; to?: string; error?: string;
  totals?: { clicks: number; impressions: number; ctr: number; position: number };
  byDate?: { day: string; clicks: number; impressions: number }[];
  pages?: (GscRow & { url: string; path: string; generated: boolean })[];
  queries?: (GscRow & { query: string })[];
  opportunities?: { query: string; impressions: number; clicks: number; position: number }[];
  sitemaps?: { path: string; lastSubmitted: string | null; lastDownloaded: string | null; isPending: boolean; errors: number; warnings: number; submitted: number }[];
}
const msg = (d: any, f: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || d?.error?.message || f;

export async function getGscOverview(days: string): Promise<GscOverview> {
  const r = await authedFetch(`/site/admin/seo/console/overview?days=${encodeURIComponent(days)}`, { method: "GET" });
  return r.ok ? r.data : { configured: true, site: "", error: msg(r.data, "Search Console indisponible.") };
}

export async function submitSitemapAction(): Promise<{ ok: boolean; error?: string; sitemap?: string }> {
  const r = await authedFetch("/site/admin/seo/console/sitemap", { method: "POST" });
  return r.ok ? { ok: true, sitemap: r.data.sitemap } : { ok: false, error: msg(r.data, "Envoi impossible.") };
}
