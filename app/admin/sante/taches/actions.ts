"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

export interface JobsStats {
  mode: "redis" | "memory"; server: string; redisConfigured: boolean;
  counts: { waiting: number; active: number; delayed: number; completed: number; failed: number };
  types: { name: string; label: string; attempts: number }[];
  failures: { id: string; name: string; label: string; error: string; attempts: number; createdAt: string }[];
  recent: { name: string; label: string; status: "ok" | "retry" | "failed"; at: string; ms: number; error?: string; server: string }[];
}

export async function getJobs(): Promise<JobsStats | null> {
  const r = await authedFetch("/site/admin/jobs", { method: "GET" });
  return r.ok ? r.data : null;
}

async function post(path: string) {
  await authedFetch(`/site/admin/jobs${path}`, { method: "POST" });
  revalidatePath("/admin/sante/taches");
}
export async function retryAllAction(): Promise<void> { await post("/failures/retry"); }
export async function dismissAllAction(): Promise<void> { await post("/failures/dismiss"); }
export async function retryOneAction(id: string): Promise<void> { await post(`/failures/${encodeURIComponent(id)}/retry`); }
export async function dismissOneAction(id: string): Promise<void> { await post(`/failures/${encodeURIComponent(id)}/dismiss`); }
