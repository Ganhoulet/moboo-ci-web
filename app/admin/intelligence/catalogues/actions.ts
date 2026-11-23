"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import type { Catalogue } from "../types";

export async function listCatalogues(): Promise<Catalogue[] | null> {
  const r = await authedFetch("/site/admin/intelligence/catalogues", { method: "GET", cache: "no-store" });
  return r.ok ? r.data.items : null;
}

export interface ImportResult { valides: number; nbErreurs: number; erreurs: { ligne: number; erreurs: string[] }[]; enregistre: boolean; apercu: Record<string, unknown>[] }

/** Import du catalogue d'une agence (aperçu d'abord : dryRun). */
export async function importCatalogue(input: { source: string; plateforme: string; csv: string; dryRun: boolean }): Promise<{ ok: true; data: ImportResult } | { ok: false; error: string }> {
  const r = await authedFetch("/site/admin/intelligence/catalogues/import", { method: "POST", body: JSON.stringify(input) });
  if (!r.ok) return { ok: false, error: r.data?.message ?? "Import impossible." };
  if (!input.dryRun) revalidatePath("/admin/intelligence/catalogues");
  return { ok: true, data: r.data };
}

export async function deleteCatalogue(form: FormData): Promise<void> {
  const key = String(form.get("key") ?? "");
  if (key) await authedFetch(`/site/admin/intelligence/catalogues/${encodeURIComponent(key)}`, { method: "DELETE" });
  revalidatePath("/admin/intelligence/catalogues");
}
