"use server";

import { redirect } from "next/navigation";
import { authedFetch } from "@/lib/server-api";
import { getAssist, restoreStash } from "@/lib/assist";

/** Bandeau « Terminer » : clôt l'accès assisté (récapitulatif au client) et rend sa session à l'account manager. */
export async function endAssistAction() {
  const info = getAssist();
  if (info) await authedFetch("/site/me/assist/end", { method: "POST", body: "{}" }).catch(() => null);
  restoreStash();
  redirect(info ? `/admin/comptes/site/${info.accountId}?assist=fin` : "/admin/comptes");
}
