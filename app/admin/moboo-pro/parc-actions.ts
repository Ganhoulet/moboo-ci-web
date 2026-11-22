"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

const BASE = "/site/admin/pro-agences";
const errMsg = (d: any) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || (Array.isArray(d?.error?.message) ? d.error.message[0] : d?.error?.message) || "Import impossible.";

export type ParcType = "biens" | "proprietaires" | "locataires" | "baux" | "loyers";
export interface Parc {
  type: ParcType; page: number; perPage: number; total: number;
  counts: Record<ParcType, number>;
  loyers: Record<string, { nombre: number; montant: number }>;
  bauxActifs: number;
  items: Record<string, any>[];
}
export interface ImportResult {
  type: string; dryRun: boolean; total: number; valides: number; created: number;
  errors: { ligne: number; erreur: string }[]; ignoredColumns: string[]; apercu: Record<string, any>[];
}

export async function getParc(orgId: string, type: string, q?: string, page?: number): Promise<Parc | null> {
  const qs = new URLSearchParams({ type, ...(q ? { q } : {}), ...(page && page > 1 ? { page: String(page) } : {}) });
  const { ok, data } = await authedFetch(`${BASE}/${encodeURIComponent(orgId)}/parc?${qs}`, { method: "GET" });
  return ok ? (data as Parc) : null;
}

export async function importParcAction(orgId: string, type: "biens" | "locataires", csv: string, dryRun: boolean): Promise<{ ok: boolean; error?: string; result?: ImportResult }> {
  const { ok, data } = await authedFetch(`${BASE}/${encodeURIComponent(orgId)}/import/${type}`, { method: "POST", body: JSON.stringify({ csv, dryRun }) });
  if (!dryRun) revalidatePath(`/admin/moboo-pro/agence/${orgId}/parc`);
  return ok ? { ok: true, result: data as ImportResult } : { ok: false, error: errMsg(data) };
}
