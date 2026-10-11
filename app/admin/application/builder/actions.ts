"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

const BASE = "/site/admin/mobile/builder";
const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export interface BuilderVersion { id: string; version: number; note: string; createdBy: string | null; createdAt: string }
export interface BuilderState { config: Record<string, any>; custom: boolean; version: number; history: BuilderVersion[] }
type Res = { ok: boolean; error?: string; state?: BuilderState };

export async function getBuilder(): Promise<BuilderState | null> {
  const { ok, data } = await authedFetch(BASE, { method: "GET" });
  return ok ? (data as BuilderState) : null;
}

async function send(path: string, method: string, body?: unknown): Promise<Res> {
  const { ok, data } = await authedFetch(`${BASE}${path}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
  revalidatePath("/admin/application/builder");
  return ok ? { ok: true, state: data as BuilderState } : { ok: false, error: errMsg(data, "Publication impossible.") };
}

export const publishAppConfigAction = async (config: Record<string, any>, note: string) => send("", "PUT", { config, note });
export const restoreAppConfigAction = async (id: string) => send(`/versions/${encodeURIComponent(id)}/restore`, "POST");
export const resetAppConfigAction = async () => send("/reset", "POST");

export async function getAppConfigVersionAction(id: string): Promise<{ ok: boolean; config?: Record<string, any>; error?: string }> {
  const { ok, data } = await authedFetch(`${BASE}/versions/${encodeURIComponent(id)}`, { method: "GET" });
  return ok ? { ok: true, config: (data as any).config } : { ok: false, error: errMsg(data, "Version introuvable.") };
}
