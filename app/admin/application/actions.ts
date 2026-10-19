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

// ─── Bascule de Moboo Pro (WordPress → Render) ────────────────────────────
export type BasculeMode = "off" | "pilot" | "on";
export interface BasculeOrg { id: string; name: string; contact: string | null }
export interface BasculeDomain { key: string; label: string; detail: string; mode: BasculeMode; open: boolean; migrated: number; pilots: (BasculeOrg & { migrated: boolean })[] }
export interface BasculeMigration { organizationId: string; name: string; contact: string | null; domain: string; status: string; counts: Record<string, number>; migratedAt: string }
const PB = "/site/admin/pro-bascule";
export interface BasculeAppPolicy { minProtocol: number; androidUrl: string; iosUrl: string; message: string }
export interface BasculePreparation { domainsNotOn: string[]; orgsStarted: number; orgsComplete: number; invitationsPending: number; proAccounts: number; appSeen30: number }
export const getProBascule = async () => {
  const { ok, data } = await authedFetch(PB, { method: "GET" });
  return ok ? (data as { domains: BasculeDomain[]; migrations: BasculeMigration[]; wordpress?: { off: boolean; at: string | null }; app?: BasculeAppPolicy; preparation?: BasculePreparation }) : null;
};

async function basculeCall(path: string, method: string, body?: unknown): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`${PB}${path}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
  revalidatePath("/admin/application/bascule-pro");
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Action impossible.") };
}
export const setWordpressOffAction = async (off: boolean) => basculeCall("/arret-wordpress", "PUT", { off });
export const setProAppPolicyAction = async (p: Partial<BasculeAppPolicy>) => basculeCall("/version-app", "PUT", p);
export const setBasculeModeAction = async (domain: string, mode: BasculeMode) => basculeCall(`/${encodeURIComponent(domain)}`, "PUT", { mode });
export const addBasculePilotAction = async (domain: string, orgId: string) => basculeCall(`/${encodeURIComponent(domain)}/pilots/${encodeURIComponent(orgId)}`, "POST");
export const removeBasculePilotAction = async (domain: string, orgId: string) => basculeCall(`/${encodeURIComponent(domain)}/pilots/${encodeURIComponent(orgId)}`, "DELETE");
export const resetBasculeAction = async (domain: string, orgId: string) => basculeCall(`/${encodeURIComponent(domain)}/reset/${encodeURIComponent(orgId)}`, "POST");

export async function searchBasculeOrgsAction(q: string): Promise<BasculeOrg[]> {
  const { ok, data } = await authedFetch(`${PB}/orgs?q=${encodeURIComponent(q)}`, { method: "GET" });
  return ok && Array.isArray(data) ? (data as BasculeOrg[]) : [];
}

/* ─── Vidéos des annonces ──────────────────────────────────────────────── */

export interface AdminVideo {
  id: string; appId: number; title: string; city: string; transaction: "rent" | "sale"; status: string; featured: boolean;
  provider: "r2" | "bunny" | "youtube"; videoStatus: string | null; size: number | null; length: number | null;
  uploadedAt: string | null; keep: boolean; notifiedAt: string | null; deleteOn: string | null; thumbnail: string | null; url: string | null;
}
export interface AdminVideoList {
  page: number; perPage: number; total: number; provider: "r2" | "bunny"; providerReady: boolean; quotaBytes: number;
  usage: { r2: { bytes: number; count: number }; bunny: { bytes: number; count: number } };
  items: AdminVideo[];
}
export const getAdminVideos = async (params: Record<string, string | undefined>) =>
  get<AdminVideoList>(`/video/list?${new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][])}`);

export interface VideoStatus {
  provider: "r2" | "bunny"; providerReady: boolean; appUpload: boolean; webUpload: boolean; aiRooms: boolean; maxSeconds: number; maxMb: number;
  cleanup: { enabled: boolean; days: number; target: "rent" | "closed" | "all"; keepFeatured: boolean; noticeDays: number };
  r2: { configured: boolean; bucket: string; publicHost: string };
  bunny: { configured: boolean; library: string; cdnHost: string; apiKeySet: boolean; webhookSecretSet: boolean };
  workerKeySet: boolean; videos: number; ready_videos: number; jobs: Record<string, number>;
}
export const getVideoStatus = async () => get<VideoStatus>("/video");

export interface VideoLogEntry { id: number; listingId: string; appId: number | null; title: string; provider: string; size: number | null; reason: string; reasonLabel: string; actor: string | null; createdAt: string }
export const getVideoLog = async (page?: string) => get<{ page: number; total: number; items: VideoLogEntry[] }>(`/video/log${page ? `?page=${encodeURIComponent(page)}` : ""}`);

export async function deleteVideosAction(ids: string[]): Promise<{ ok: boolean; removed?: number; error?: string }> {
  const { ok, data } = await authedFetch(`${BASE}/video/delete`, { method: "POST", body: JSON.stringify({ ids }) });
  revalidatePath("/admin/application/videos");
  return ok ? { ok: true, removed: data?.removed ?? 0 } : { ok: false, error: errMsg(data, "Suppression impossible.") };
}
