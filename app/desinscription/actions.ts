"use server";

import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";

export async function unsubscribeAction(c: string, a: string, s: string): Promise<{ ok: boolean; address?: string; error?: string }> {
  try {
    const r = await fetch(`${API_URL}/site/unsubscribe`, {
      method: "POST", cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json", ...relayHeaders(true) },
      body: JSON.stringify({ c, a, s }),
    });
    const d = await r.json().catch(() => ({}));
    return r.ok ? { ok: true, address: d.address } : { ok: false, error: d?.error?.message ?? "Lien invalide." };
  } catch {
    return { ok: false, error: "Service indisponible, réessayez plus tard." };
  }
}
