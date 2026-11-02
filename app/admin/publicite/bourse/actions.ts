"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

/** Back-office → Publicité → Bourse des demandes. */
export async function getLeadMarketAdmin() {
  const { ok, data } = await authedFetch("/site/admin/lead-market", { method: "GET" });
  return ok ? data : null;
}
export async function refundPurchaseAction(id: string) {
  const { ok } = await authedFetch(`/site/admin/lead-market/purchases/${id}/refund`, { method: "POST", body: "{}" });
  revalidatePath("/admin/publicite/bourse");
  return { ok };
}
export async function leadStatusAction(id: string, status: string) {
  const { ok } = await authedFetch(`/site/admin/lead-market/leads/${id}/status`, { method: "POST", body: JSON.stringify({ status }) });
  revalidatePath("/admin/publicite/bourse");
  return { ok };
}
