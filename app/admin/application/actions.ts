"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

const BASE = "/site/admin/mobile";
const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export interface AppStats {
  installs: number; newInstalls7d: number; newInstalls30d: number; onlineNow: number; loggedInDevices: number; loggedInToday: number;
  dau: number; wau: number; mau: number; siteAccounts: number; activeRate30d: number; stickiness: number;
  platforms: { platform: string; devices: number }[];
  versions: { version: string; devices: number }[];
  series: { day: string; active: number; installs: number; calls: number }[];
  gatewayCalls30d: number; gatewayErrors30d: number;
}

async function get<T>(path: string): Promise<T | null> {
  const { ok, data } = await authedFetch(`${BASE}${path}`, { method: "GET" });
  return ok ? (data as T) : null;
}

export const getAppStats = async () => get<AppStats>("/stats");

export interface AppDevice {
  id: string; deviceId: string; platform: string | null; appVersion: string | null; osVersion: string | null; model: string | null;
  sessions: number; firstSeenAt: string; lastSeenAt: string; online: boolean; wpUserId: number | null;
  account: { name: string | null; phone: string } | null;
}
export const getAppDevices = async (params: Record<string, string | undefined>) =>
  get<{ total: number; page: number; perPage: number; items: AppDevice[] }>(`/devices?${new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][])}`);

export interface GatewayInfo {
  implemented: string[];
  calls: { path: string; hits: number; errors: number; lastAt: string | null; implemented: boolean }[];
  config: Record<string, any>;
}
export const getGatewayInfo = async () => get<GatewayInfo>("/gateway");

export interface AppContact { id: string; source: string; name: string | null; email: string | null; phone: string | null; message: string | null; meta: Record<string, any>; handled: boolean; createdAt: string }
export const getAppContacts = async (params: Record<string, string | undefined>) =>
  get<{ total: number; page: number; perPage: number; counts: Record<string, number>; items: AppContact[] }>(`/contacts?${new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][])}`);

export async function contactHandledAction(id: string, handled: boolean): Promise<{ ok: boolean }> {
  const { ok } = await authedFetch(`${BASE}/contacts/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ handled }) });
  revalidatePath("/admin/application/contacts");
  return { ok };
}

export interface AppPush { id: string; title: string; body: string; url: string | null; segment: string; recipients: number | null; error: string | null; createdAt: string }
export const getPushHistory = async () => (await get<AppPush[]>("/push")) ?? [];

export async function sendPushAction(input: { title: string; body: string; url?: string; segment: string }): Promise<{ ok: boolean; error?: string; recipients?: number | null }> {
  const { ok, data } = await authedFetch(`${BASE}/push`, { method: "POST", body: JSON.stringify(input) });
  revalidatePath("/admin/application/push");
  return ok ? { ok: true, recipients: data?.recipients ?? null } : { ok: false, error: errMsg(data, "Envoi impossible.") };
}
