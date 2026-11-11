"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

export type TransferKind = "listing" | "residence" | "espace";
export interface TransferParty { id: string; name: string; detail: string }
export interface TransferCheck { kind: TransferKind; label: string; id: string; title: string; owner: (TransferParty & { kind: string }) | null; blockers: string[] }
export interface ReservableRow { id: string; title: string; place: string; online: boolean | null; imported: boolean; owner: { id: string; name: string } }

const BASE = "/site/admin/transfer";
const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;
const kindOk = (k: string): k is TransferKind => k === "listing" || k === "residence" || k === "espace";

export async function getTransferCheck(kind: TransferKind, id: string): Promise<{ ok: boolean; data?: TransferCheck; error?: string }> {
  if (!kindOk(kind)) return { ok: false, error: "Type de bien inconnu." };
  const { ok, data } = await authedFetch(`${BASE}/${kind}/${encodeURIComponent(id)}`);
  return ok ? { ok: true, data } : { ok: false, error: errMsg(data, "Propriétaire indisponible.") };
}

export async function searchTransferTargets(kind: TransferKind, id: string, q: string): Promise<TransferParty[]> {
  if (!kindOk(kind) || q.trim().length < 2) return [];
  const { ok, data } = await authedFetch(`${BASE}/${kind}/${encodeURIComponent(id)}/targets?q=${encodeURIComponent(q.trim().slice(0, 80))}`);
  return ok && Array.isArray(data) ? data : [];
}

export async function transferOwnerAction(kind: TransferKind, id: string, targetId: string, reason: string): Promise<{ ok: boolean; error?: string; owner?: TransferParty }> {
  if (!kindOk(kind)) return { ok: false, error: "Type de bien inconnu." };
  const { ok, data } = await authedFetch(`${BASE}/${kind}/${encodeURIComponent(id)}`, { method: "POST", body: JSON.stringify({ targetId, reason }) });
  if (!ok) return { ok: false, error: errMsg(data, "Changement impossible.") };
  revalidatePath("/admin/immobilier", "layout");
  revalidatePath("/", "layout");
  return { ok: true, owner: data?.owner };
}

export async function listReservables(kind: "residence" | "espace", q?: string, page?: string): Promise<{ total: number; page: number; perPage: number; items: ReservableRow[] } | null> {
  const qs = new URLSearchParams(Object.entries({ q, page }).filter(([, v]) => v) as [string, string][]);
  const { ok, data } = await authedFetch(`${BASE}/items/${kind}?${qs}`);
  return ok ? data : null;
}
