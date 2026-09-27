"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { getSession } from "@/lib/session";
import type { SavedSearch, SearchParams } from "@/lib/searches";

export type SaveResult = { ok: boolean; message: string };

/** Liste des recherches du compte connecté (pour /compte). */
export async function listSearches(): Promise<SavedSearch[]> {
  if (!getSession()) return [];
  const { ok, data } = await authedFetch("/site/searches", { method: "GET" });
  return ok && Array.isArray(data) ? (data as SavedSearch[]) : [];
}

/** Enregistre les filtres courants comme recherche (depuis /annonces). */
export async function saveSearchAction(params: SearchParams): Promise<SaveResult> {
  if (!getSession()) {
    return { ok: false, message: "Connectez-vous pour enregistrer une recherche." };
  }
  const clean: SearchParams = {};
  if (params.transaction) clean.transaction = params.transaction;
  if (params.q) clean.q = params.q;
  if (params.propertyType) clean.propertyType = params.propertyType;
  if (params.priceMin) clean.priceMin = params.priceMin;
  if (params.priceMax) clean.priceMax = params.priceMax;

  const { ok } = await authedFetch("/site/searches", {
    method: "POST",
    body: JSON.stringify({ params: clean, alertsEnabled: true }),
  });
  if (!ok) return { ok: false, message: "Enregistrement impossible. Réessayez." };
  revalidatePath("/compte");
  return { ok: true, message: "Recherche enregistrée ! Vous serez alerté des nouveaux biens." };
}

export async function deleteSearchAction(id: string): Promise<void> {
  await authedFetch(`/site/searches/${encodeURIComponent(id)}`, { method: "DELETE" });
  revalidatePath("/compte");
}

export async function toggleAlertAction(id: string, alertsEnabled: boolean): Promise<void> {
  await authedFetch(`/site/searches/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ alertsEnabled }),
  });
  revalidatePath("/compte");
}
