"use server";

import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";
import { searchHelp, type HelpCard } from "@/lib/help";

/** Suggestions pendant la frappe (non enregistrées dans le journal des recherches). */
export async function suggestHelpAction(q: string): Promise<HelpCard[]> {
  if (q.trim().length < 2) return [];
  return (await searchHelp(q, false)).results.slice(0, 6);
}

async function post(path: string, body: unknown) {
  await fetch(`${API_URL}/site/help${path}`, { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", ...relayHeaders(true) }, body: JSON.stringify(body) }).catch(() => null);
}

export async function helpFeedbackAction(slug: string, helpful: boolean) {
  if (/^[a-z0-9-]{1,90}$/.test(slug)) await post(`/article/${slug}/feedback`, { helpful });
}

/** Vue d'un article (une fois par visiteur et par jour, côté navigateur). */
export async function helpViewAction(slug: string) {
  if (!/^[a-z0-9-]{1,90}$/.test(slug)) return;
  await fetch(`${API_URL}/site/help/article/${slug}?view=1`, { cache: "no-store", headers: { Accept: "application/json", ...relayHeaders(true) } }).catch(() => null);
}
