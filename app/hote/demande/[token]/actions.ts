"use server";

import { API_URL } from "@/lib/api";

export type DecisionState = { ok: boolean; state?: string; already?: boolean; message?: string } | null;

/** Réponse de l'hôte depuis le lien reçu (e-mail, WhatsApp, SMS). */
export async function decideAction(_prev: DecisionState, formData: FormData): Promise<DecisionState> {
  const token = String(formData.get("token") || "");
  const decision = String(formData.get("decision") || "");
  const reason = String(formData.get("reason") || "").slice(0, 200);
  if (!token || !["accept", "refuse"].includes(decision)) return { ok: false, message: "Choix invalide." };
  try {
    const res = await fetch(`${API_URL}/marketplace/host-decision/${encodeURIComponent(token)}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, reason }), cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: data?.message || data?.error?.message || "Réponse impossible. Réessayez ou répondez depuis l’application Moboo Resi." };
    return { ok: true, state: data.state, already: !!data.already };
  } catch {
    return { ok: false, message: "Service indisponible. Réessayez dans un instant." };
  }
}
