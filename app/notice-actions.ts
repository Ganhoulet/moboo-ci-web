"use server";

import { authedFetch } from "@/lib/server-api";

/** Vue, clic, fermeture ou lecture d'une information (compte connecté facultatif). */
export async function trackNotice(id: string, event: "view" | "click" | "dismiss" | "read") {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await authedFetch(`/site/notices/${id}/event`, { method: "POST", body: JSON.stringify({ event }) }).catch(() => null);
}

export async function readAllNotices() {
  await authedFetch("/site/me/notices/read-all", { method: "POST", body: "{}" }).catch(() => null);
}
