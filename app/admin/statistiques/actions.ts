"use server";

import { authedFetch } from "@/lib/server-api";

export type Point = { day: string; value: number };
export type Kpi = { value: number; prev: number; change: number | null };

export interface Overview {
  range: { days: number; start: string; end: string };
  kpis: {
    accounts: Kpi; listings: Kpi & { active: number; pending: number }; views: Kpi;
    contacts: Kpi & { calls: number; whatsapp: number; forms: number }; conversion: { value: number; prev: number };
    revenue: Kpi & { invoices: number; subscriptions: number }; searches: Kpi & { zero: number; zeroRate: number }; app: Kpi;
  };
  breakdown: { accountTypes: { key: string; value: number }[]; inquiryKinds: { key: string; value: number }[]; revenueKinds: { key: string; value: number; count: number }[] };
  series: Record<"accounts" | "listings" | "views" | "contacts" | "revenue" | "searches", Point[]>;
  topListings: { id: string; title: string; place: string; views: number; calls: number; whatsapp: number; forms: number }[];
  topPlaces: { place: string; views: number; contacts: number }[];
}
export interface SearchRow { kind: string; label: string; propertyType: string | null; total: number; zero: number; avgResults: number; last: string }
export interface Searches {
  range: { days: number }; totals: { searches: number; zero: number; site: number; app: number };
  top: SearchRow[]; zero: SearchRow[];
  demand: { place: string; searches: number; zero: number; listings: number; ratio: number | null }[];
  budgets: { label: string; value: number }[];
}
export interface ProRow { id: string; kind: string; href: string | null; name: string; type: string; verified: boolean; plan: string | null; listings: number; active: number; views: number; calls: number; whatsapp: number; forms: number; contacts: number; conversion: number }
export interface Pros { range: { days: number }; totals: { pros: number; withContacts: number; withoutViews: number }; items: ProRow[] }

const get = async <T,>(path: string): Promise<T | null> => {
  const { ok, data } = await authedFetch(path, { method: "GET" });
  return ok ? (data as T) : null;
};
export const getOverview = async (range: string) => get<Overview>(`/site/admin/analytics?range=${encodeURIComponent(range)}`);
export const getSearches = async (range: string, source?: string) => get<Searches>(`/site/admin/analytics/searches?range=${encodeURIComponent(range)}${source ? `&source=${source}` : ""}`);
export const getPros = async (range: string, sort?: string) => get<Pros>(`/site/admin/analytics/pros?range=${encodeURIComponent(range)}${sort ? `&sort=${sort}` : ""}`);
