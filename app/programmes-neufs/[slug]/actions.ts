"use server";

import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";

/** Demande d'information sur un programme neuf (envoyée au promoteur). */
export async function sendProgramLeadAction(slug: string, input: Record<string, unknown>) {
  try {
    const r = await fetch(`${API_URL}/site/programs/${encodeURIComponent(slug)}/leads`, {
      method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", Accept: "application/json", ...relayHeaders(true) }, body: JSON.stringify(input),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true as const };
    const m = Array.isArray(d?.message) ? d.message[0] : d?.message || d?.error?.message;
    return { ok: false as const, error: r.status === 429 ? "Trop de demandes : réessayez dans une minute." : m || "Envoi impossible." };
  } catch {
    return { ok: false as const, error: "Service indisponible. Réessayez." };
  }
}
