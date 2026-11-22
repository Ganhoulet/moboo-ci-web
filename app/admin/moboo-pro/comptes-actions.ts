"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

const BASE = "/site/admin/pro-comptes";
const errMsg = (d: any) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || (Array.isArray(d?.error?.message) ? d.error.message[0] : d?.error?.message) || "Action impossible.";

export interface ProAccount {
  id: number; display_name: string; email: string; phone: string; role: string; active: boolean; suspended: boolean; plan: string;
  expires_at: string | null; edl_credits: number; registered: string | null; last_login: string | null; app_active: boolean; app_last_seen: string | null;
}
export interface ProAccountStats {
  total_users: number; total_agencies: number; total_agents: number; total_owners: number; total_tenants: number; total_properties: number;
  active_subscriptions: number; total_edl: number; monthly_revenue: number; app_active_users: number; site_only_users: number;
}
export interface ProAccounts { items: ProAccount[]; total: number; page: number; perPage: number; stats: ProAccountStats; roles: string[]; plans: string[] }
export interface ProAccountDetail {
  account: ProAccount & { nb_biens: number; content: Record<string, number> };
  insights: {
    linked: boolean;
    counts: Record<string, number>;
    properties: { id: number; titre: string; ville: string | null; quartier: string | null; statut: string | null; loyer: number | null; createdAt: string }[];
    timeline: { type: string; label: string; date: string }[];
  };
}
export interface Audience { accounts: number; devices: number; pushReady: boolean }
export interface ProNotifs { audiences: Record<"tous" | "agence" | "proprietaire" | "locataire", Audience>; history: { id: number; label: string; by: string | null; date: string }[] }

export async function getProAccounts(q: Record<string, string | undefined>): Promise<ProAccounts | null> {
  const qs = new URLSearchParams(Object.entries(q).filter(([, v]) => !!v) as [string, string][]);
  const { ok, data } = await authedFetch(`${BASE}${qs.size ? `?${qs}` : ""}`, { method: "GET" });
  return ok ? (data as ProAccounts) : null;
}

export async function getProAccount(wpId: number): Promise<ProAccountDetail | null> {
  const { ok, data } = await authedFetch(`${BASE}/${wpId}`, { method: "GET" });
  return ok ? (data as ProAccountDetail) : null;
}

export async function getProNotifs(): Promise<ProNotifs | null> {
  const { ok, data } = await authedFetch(`${BASE}/notifications`, { method: "GET" });
  return ok ? (data as ProNotifs) : null;
}

async function act(path: string, body?: unknown, revalidate?: string): Promise<{ ok: boolean; error?: string; data?: any }> {
  const { ok, data } = await authedFetch(`${BASE}${path}`, { method: "POST", ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (revalidate) revalidatePath(revalidate);
  return ok ? { ok: true, data } : { ok: false, error: errMsg(data) };
}

export const suspendProAccountAction = async (wpId: number) => act(`/${wpId}/suspend`, undefined, `/admin/moboo-pro/comptes/${wpId}`);
export const activateProAccountAction = async (wpId: number) => act(`/${wpId}/activate`, undefined, `/admin/moboo-pro/comptes/${wpId}`);
export const setProAccountRoleAction = async (wpId: number, role: string) => act(`/${wpId}/role`, { role }, `/admin/moboo-pro/comptes/${wpId}`);
export const setProAccountPlanAction = async (wpId: number, plan: string, days: number, edlCredits: number | null) =>
  act(`/${wpId}/subscription`, { plan, days, ...(edlCredits === null ? {} : { edl_credits: edlCredits }) }, `/admin/moboo-pro/comptes/${wpId}`);
export const notifyProAccountAction = async (wpId: number, title: string, body: string) => act(`/${wpId}/notify`, { title, body });
export const broadcastProAction = async (cible: string, title: string, body: string) => act("/notifications", { cible, title, body }, "/admin/moboo-pro/notifications");
