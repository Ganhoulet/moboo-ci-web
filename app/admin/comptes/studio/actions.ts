"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

/** Studio de publication (back-office → Suivi des comptes). */
type R<T = any> = { ok: boolean; error?: string; data?: T };
const err = (d: any, fb: string) => (typeof d?.error?.message === "string" ? d.error.message : typeof d?.message === "string" ? d.message : fb);

async function call<T = any>(path: string, method = "GET", body?: unknown): Promise<R<T>> {
  const { ok, data } = await authedFetch(`/site/admin/growth${path}`, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return ok ? { ok: true, data: data as T } : { ok: false, error: err(data, "Action impossible.") };
}

export async function getGrowth<T = any>(path: string): Promise<T | null> {
  const r = await call<T>(path);
  return r.ok ? r.data! : null;
}

export async function searchAgentsAction(q: string, scope: string) { return call(`/agents?${new URLSearchParams({ q, scope })}`); }
export async function createProfileAction(input: Record<string, string>) { return call("/agents", "POST", input); }
export async function requestMandateAction(id: string) { return call(`/agents/${id}/mandate`, "POST"); }
export async function declareMandateAction(id: string, proof: string) { return call(`/agents/${id}/mandate`, "PUT", { proof }); }
export async function revokeMandateAction(id: string) { return call(`/agents/${id}/mandate`, "DELETE"); }
export async function extractAction(text: string, accountId?: string) { return call("/extract", "POST", { text, accountId }); }
export async function duplicatesAction(input: Record<string, unknown>) { return call("/duplicates", "POST", input); }
export async function reportAction(id: string, days = 7) { return call(`/agents/${id}/report?days=${days}`); }

export async function publishAction(input: { accountId: string; listing: Record<string, unknown>; photos: string[]; source: string }) {
  const r = await call("/publish", "POST", input);
  if (r.ok) revalidatePath("/admin/comptes/studio", "layout");
  return r;
}

export async function assignAction(listingId: string, accountId: string) {
  const r = await call(`/listings/${listingId}/assign`, "PUT", { accountId });
  if (r.ok) revalidatePath("/admin/comptes/studio/annonces");
  return r;
}

/** Compte TikTok de l'agent (retrouver ses vidéos). */
export async function setTiktokAction(id: string, tiktok: string) { return call(`/agents/${id}/tiktok`, "PUT", { tiktok }); }

/** Jeton d'envoi de la vidéo reçue sur WhatsApp, pour l'annonce publiée par l'équipe. */
export async function teamVideoTicketAction(listingId: string): Promise<{ ok: true; token: string; uploadUrl: string; maxMb: number } | { ok: false; error: string }> {
  const { ok, data } = await authedFetch(`/site/video/team/${encodeURIComponent(listingId)}/ticket`, { method: "POST", body: "{}" });
  return ok ? { ok: true, token: data.token, uploadUrl: data.uploadUrl, maxMb: data.maxMb } : { ok: false, error: err(data, "Envoi de la vidéo impossible pour le moment.") };
}

/* ─── Liens de publication rapide ─────────────────────────────────────── */

async function quick<T = any>(path: string, method = "GET", body?: unknown): Promise<R<T>> {
  const { ok, data } = await authedFetch(`/site/admin/quick-links${path}`, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  return ok ? { ok: true, data: data as T } : { ok: false, error: err(data, "Action impossible.") };
}
export async function getQuickLinks<T = any>(path = ""): Promise<T | null> { const r = await quick<T>(path); return r.ok ? r.data! : null; }
export async function createQuickLinkAction(input: { title: string; slug?: string }) {
  const r = await quick("", "POST", input);
  if (r.ok) revalidatePath("/admin/comptes/liens-rapides");
  return r;
}
export async function updateQuickLinkAction(id: string, input: { active?: boolean; title?: string }) {
  const r = await quick(`/${id}`, "PUT", input);
  if (r.ok) revalidatePath("/admin/comptes/liens-rapides");
  return r;
}
export async function quickLinkAccountsAction(id: string) { return quick(`/${id}/accounts`); }
