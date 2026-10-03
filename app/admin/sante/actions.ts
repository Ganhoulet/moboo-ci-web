"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

export interface HealthCheck { key: string; label: string; level: "ok" | "warn" | "error"; detail: string; help?: string }
export interface HealthReport {
  overall: "ok" | "warn" | "error"; checks: HealthCheck[];
  server: { version: string; node: string; uptimeS: number; memoryMb: number; startedAt: string; region: string | null; service: string | null };
  errorsByApp: { app: string; label: string; open: number; occurrences: number }[];
  queues: { moderation: number; deletions: number };
}
export interface ErrorRow { id: string; app: string; errorType: string; message: string; stackTrace: string | null; zone: string | null; appVersion: string | null; platform: string | null; count: number; status: string; firstSeenAt: string; lastSeenAt: string }

export async function getHealth(): Promise<HealthReport | null> {
  const { ok, data } = await authedFetch("/site/admin/health", { method: "GET" });
  return ok ? data : null;
}
export async function getErrors(status?: string, app?: string): Promise<ErrorRow[]> {
  const q = new URLSearchParams(Object.entries({ status, app }).filter(([, v]) => v) as [string, string][]).toString();
  const { ok, data } = await authedFetch(`/site/admin/errors${q ? `?${q}` : ""}`, { method: "GET" });
  return ok ? data.items : [];
}
export async function setErrorStatusAction(id: string, status: "OPEN" | "RESOLVED" | "IGNORED") {
  const { ok } = await authedFetch(`/site/admin/errors/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ status }) });
  if (ok) revalidatePath("/admin/sante");
  return { ok };
}
