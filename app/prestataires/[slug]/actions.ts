"use server";

import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";

/** Demande envoyée au prestataire depuis sa mini-page. */
export async function sendServiceLeadAction(slug: string, input: { name: string; phone: string; need: string; commune?: string; date?: string; adId?: string }) {
  try {
    const r = await fetch(`${API_URL}/site/service-ads/providers/${encodeURIComponent(slug)}/leads`, {
      method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", Accept: "application/json", ...relayHeaders(true) }, body: JSON.stringify(input),
    });
    const d = await r.json().catch(() => ({}));
    if (r.ok) return { ok: true as const };
    const m = Array.isArray(d?.message) ? d.message[0] : d?.message || d?.error?.message;
    return { ok: false as const, error: r.status === 429 ? "Trop de demandes : réessayez dans une minute." : m || "Envoi impossible. Réessayez." };
  } catch {
    return { ok: false as const, error: "Service indisponible. Réessayez." };
  }
}
