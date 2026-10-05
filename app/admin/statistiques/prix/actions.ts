"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

export interface PriceRow { city: string; commune: string | null; transaction: "rent" | "sale"; segment: string; label: string; median: number; p25: number; p75: number; count: number; published: boolean }

export async function getAdminPrices(): Promise<{ minSample: number; updatedAt: string; rows: PriceRow[] } | null> {
  const r = await authedFetch("/site/admin/prices", { method: "GET" });
  return r.ok ? r.data : null;
}
export async function refreshPricesAction(): Promise<void> {
  await authedFetch("/site/admin/prices/refresh", { method: "POST" });
  revalidatePath("/admin/statistiques/prix");
}
