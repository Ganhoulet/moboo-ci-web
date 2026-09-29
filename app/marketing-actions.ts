"use server";

import { apiPost } from "@/lib/api";

/** Statistiques d'une créa (vue, clic, « ne plus afficher ») — relayées par le serveur du site. */
export async function trackCampaignAction(id: string, event: "view" | "click" | "dismiss") {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  try { await apiPost(`/site/marketing/${id}/track`, { event }); } catch { /* best-effort */ }
}
