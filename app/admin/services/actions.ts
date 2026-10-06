"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import type { ServicesConfig } from "@/lib/moboo-services";

const BASE = "/site/admin/services";
const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Action impossible.";
type Res<T = any> = { ok: boolean; error?: string; data?: T };

async function call<T = any>(path: string, method = "GET", body?: unknown): Promise<Res<T>> {
  const r = await authedFetch(`${BASE}${path}`, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return r.ok ? { ok: true, data: r.data } : { ok: false, error: err(r.data) };
}

/** Lecture (pages serveur) : null si indisponible ou permission manquante. */
export async function getServices<T = any>(path: string): Promise<T | null> {
  const r = await call<T>(path);
  return r.ok ? (r.data as T) : null;
}

export async function saveServicesConfig(cfg: ServicesConfig) {
  const r = await call<ServicesConfig>("/config", "PUT", cfg);
  revalidatePath("/admin/services", "layout");
  return r;
}

export async function deleteAlerte(id: string) {
  const r = await call(`/alertes/${id}`, "DELETE");
  revalidatePath("/admin/services/alertes");
  return r;
}

export async function addCredits(ref: string, kind: string, amount: number, days?: number) {
  const r = await call(`/credits/${encodeURIComponent(ref.trim())}`, "POST", { kind, amount, days });
  revalidatePath("/admin/services", "layout");
  return r;
}

export async function getWallets(ref: string) {
  return call(`/wallets/${encodeURIComponent(ref.trim())}`);
}

export async function supportTicket(id: string) {
  return call(`/support/${id}`);
}

export async function supportReply(id: string, message: string) {
  const r = await call(`/support/${id}/reply`, "POST", { message });
  revalidatePath("/admin/services/support");
  return r;
}

export async function supportStatus(id: string, status: string) {
  const r = await call(`/support/${id}/status`, "POST", { status });
  revalidatePath("/admin/services/support");
  return r;
}

export async function saveGridRow(kind: "dgi" | "marche", row: Record<string, unknown>) {
  const r = await call(`/estimation/grid/${kind}`, "POST", row);
  revalidatePath("/admin/services/estimations");
  return r;
}

export async function deleteGridRow(id: string) {
  const r = await call(`/estimation/grid-row/${id}`, "DELETE");
  revalidatePath("/admin/services/estimations");
  return r;
}

export async function importGridCsv(kind: "dgi" | "marche" | "loyer", csv: string) {
  const r = await call(`/estimation/import/${kind}`, "POST", { csv });
  revalidatePath("/admin/services/estimations");
  return r;
}

export async function analyze(what: "foncier" | "loyer" | "trend") {
  const r = await call(`/estimation/analyze/${what}`, "POST", {});
  revalidatePath("/admin/services/estimations");
  return r;
}

export async function setCard(accountId: string, body: { action?: string; expiresAt?: string }) {
  const r = await call(`/cards/${accountId}`, "POST", body);
  revalidatePath("/admin/services/cartes");
  return r;
}
