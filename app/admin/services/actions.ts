"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { SITE_SERVICES_TAG } from "@/lib/site-services";
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
  revalidateTag(SITE_SERVICES_TAG);
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

export async function saveAppConfig(cfg: unknown) {
  const r = await call("/app-config", "PUT", cfg);
  revalidatePath("/admin/services/application");
  return r;
}

export async function setAutonomousOwner(ref: string, on: boolean) {
  const r = await call("/app-config/autonomous", "POST", { ref, on });
  revalidatePath("/admin/services/application");
  return r;
}

/** Badges du menu : demandes d'état des lieux à attribuer et demandes de rappel non traitées. */
export async function getServicesBadges(): Promise<{ edl: number; leads: number }> {
  const [e, l] = await Promise.all([call<{ pending: number }>("/edl/pending"), call<{ fresh: number }>("/leads?page=1&status=new")]);
  return { edl: e.data?.pending ?? 0, leads: l.data?.fresh ?? 0 };
}

// États des lieux : attribution à un agent (Moboo Pro), diffusion aux agents, statut.
export async function edlAgents(q: string) {
  return call<{ items: { id: string; name: string; phone: string; zone: string; moboo: boolean; verified: boolean }[] }>(`/edl/agents?q=${encodeURIComponent(q)}`);
}

export async function edlAssign(id: string, agentId: string, price: number, note: string) {
  const r = await call(`/edl/${id}/assign`, "POST", { agentId, price, note });
  revalidatePath("/admin", "layout");
  return r;
}

export async function edlDispatch(id: string) {
  const r = await call<{ agents: number }>(`/edl/${id}/dispatch`, "POST", {});
  revalidatePath("/admin", "layout");
  return r;
}

export async function edlSetStatus(id: string, status: string) {
  const r = await call(`/edl/${id}/status`, "POST", { status });
  revalidatePath("/admin", "layout");
  return r;
}

export async function leadSetStatus(id: string, status: string) {
  const r = await call(`/leads/${id}/status`, "POST", { status });
  revalidatePath("/admin", "layout");
  return r;
}

/** Solvabilité sans canal SMS : code à dicter au candidat après avoir recueilli son accord. */
export async function solvencyCode(ref: string) {
  return call<{ code: string; ttlMin: number; tenantName: string; tenantPhone: string }>(`/solvabilite/${encodeURIComponent(ref)}/code`, "POST", {});
}
