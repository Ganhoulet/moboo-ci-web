"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export interface MigrationStatus {
  media: {
    total: number; pending: number; done: number; failed: number; missing: number; bytes: number; running: boolean;
    rowsWithWpUrls: number; origin: string; storageConfigured: boolean;
    failures: { path: string; status: string; error: string | null; attempts: number }[];
  };
  users: {
    total: number; created: number; linked: number; noPhone: number; conflict: number; pending: number;
    problems: { wpId: number; login: string; email: string | null; phoneRaw: string | null; status: string; note: string | null }[];
  };
  billing?: { packages: number; memberships: number; invoices: number };
}

export async function getMigrationStatus() {
  const { ok, data } = await authedFetch("/site/admin/migration", { method: "GET" });
  return ok ? (data as MigrationStatus) : null;
}

/** Actions du tableau de bord (analyse, copie, remplacement des adresses…). */
export async function migrationAction(action: "media/scan" | "media/probe" | "media/start" | "media/pause" | "media/batch" | "media/rewrite" | "media/retry" | "users/link") {
  const { ok, data } = await authedFetch(`/site/admin/migration/${action}`, { method: "POST" });
  revalidatePath("/admin/migration");
  return ok ? { ok: true as const, data } : { ok: false as const, error: errMsg(data, "Action impossible.") };
}
