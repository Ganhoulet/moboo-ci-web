"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

type R<T = any> = { ok: boolean; error?: string; data?: T };
const errMsg = (data: any, fallback: string) => {
  const m = data?.error?.message ?? data?.message;
  return (Array.isArray(m) ? m[0] : m) || fallback;
};
const qs = (p: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][]).toString();
  return s ? `?${s}` : "";
};
async function call<T = any>(path: string, method: string, body?: unknown, fallback = "Action impossible."): Promise<R<T>> {
  const { ok, data } = await authedFetch(path, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (ok && method !== "GET") revalidatePath("/admin/seo/redirections");
  return ok ? { ok: true, data } : { ok: false, error: errMsg(data, fallback) };
}

export interface RedirectRow { id: string; source: string; target: string; code: number; active: boolean; auto: boolean; note: string | null; hits: number; lastHitAt: string | null; createdBy: string | null; updatedAt: string }
export interface NotFoundRow { id: string; path: string; hits: number; referrer: string | null; bot: boolean; ignored: boolean; firstSeenAt: string; lastSeenAt: string; suggestion: string }

export async function listRedirects(p: Record<string, string | undefined>) {
  const r = await call<{ total: number; page: number; perPage: number; items: RedirectRow[]; counts: { manual: number; auto: number; hits: number } }>(`/site/admin/redirects${qs(p)}`, "GET");
  return r.ok ? r.data! : null;
}
export async function list404(p: Record<string, string | undefined>) {
  const r = await call<{ total: number; page: number; perPage: number; items: NotFoundRow[]; counts: { open: number; bots: number; ignored: number } }>(`/site/admin/redirects/404${qs(p)}`, "GET");
  return r.ok ? r.data! : null;
}
export const createRedirectAction = async (input: { source: string; target: string; code?: number; note?: string }) => call("/site/admin/redirects", "POST", input, "Création impossible.");
export const updateRedirectAction = async (id: string, input: { source?: string; target?: string; code?: number; active?: boolean }) => call(`/site/admin/redirects/${encodeURIComponent(id)}`, "PUT", input, "Enregistrement impossible.");
export const deleteRedirectAction = async (id: string) => call(`/site/admin/redirects/${encodeURIComponent(id)}`, "DELETE", undefined, "Suppression impossible.");
export const importRedirectsAction = async (csv: string) => call<{ created: number; errors: string[] }>("/site/admin/redirects/import", "POST", { csv }, "Import impossible.");
export const testRedirectAction = async (path: string) => call<{ target: string; code: number; source: string; rule?: string }>(`/site/admin/redirects/test${qs({ path })}`, "GET");
export const ignore404Action = async (id: string, ignored: boolean) => call(`/site/admin/redirects/404/${encodeURIComponent(id)}`, "PATCH", { ignored });
export const clear404Action = async (view: string) => call<{ count: number }>(`/site/admin/redirects/404${qs({ view })}`, "DELETE");
