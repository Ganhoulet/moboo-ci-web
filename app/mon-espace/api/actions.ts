"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

export interface MyApi {
  enabled: boolean; rateLimit?: number; webhookUrl?: string | null; webhookSecret?: string; baseUrl?: string;
  scopes?: Record<string, string>;
  keys?: { id: string; name: string; prefix: string; scopes: string[]; requests: number; createdAt: string; lastUsedAt: string | null; revokedAt: string | null }[];
  usage?: { day: string; requests: number; errors: number }[];
}

const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Action impossible.";

export async function getMyApi(): Promise<MyApi | null> {
  const r = await authedFetch("/site/me/api", { method: "GET" });
  return r.ok ? r.data : null;
}

export async function createKeyAction(name: string, scopes: string[]): Promise<{ ok: boolean; key?: string; error?: string }> {
  const r = await authedFetch("/site/me/api/keys", { method: "POST", body: JSON.stringify({ name, scopes }) });
  revalidatePath("/mon-espace/api");
  return r.ok ? { ok: true, key: r.data.key } : { ok: false, error: err(r.data) };
}

export async function revokeKeyAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`/site/me/api/keys/${encodeURIComponent(id)}`, { method: "DELETE" });
  revalidatePath("/mon-espace/api");
  return r.ok ? { ok: true } : { ok: false, error: err(r.data) };
}

export async function saveWebhookAction(url: string, rotateSecret = false): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch("/site/me/api/webhook", { method: "POST", body: JSON.stringify({ url, rotateSecret }) });
  revalidatePath("/mon-espace/api");
  return r.ok ? { ok: true } : { ok: false, error: err(r.data) };
}

export async function testWebhookAction(): Promise<{ ok: boolean; status?: number; error?: string }> {
  const r = await authedFetch("/site/me/api/webhook/test", { method: "POST" });
  return r.ok ? r.data : { ok: false, error: err(r.data) };
}
