"use server";

import { API_URL } from "@/lib/api";

export interface InvitationInfo { prenom: string; nom: string; email: string; bien: string; type: string; pending: boolean }

export async function getInvitation(token: string): Promise<InvitationInfo | null> {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) return null;
  try {
    const r = await fetch(`${API_URL}/pro/invitation/${encodeURIComponent(token)}`, { cache: "no-store" });
    return r.ok ? ((await r.json()) as InvitationInfo) : null;
  } catch {
    return null;
  }
}

/** Active le compte invité (mot de passe) ou confirme le rattachement d'un compte déjà actif. */
export async function activateInvitationAction(token: string, password: string): Promise<{ ok: boolean; alreadyActive?: boolean; error?: string }> {
  if (!/^[A-Za-z0-9_-]{8,64}$/.test(token)) return { ok: false, error: "Lien invalide." };
  try {
    const r = await fetch(`${API_URL}/pro/invitation/${encodeURIComponent(token)}/activate`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }), cache: "no-store",
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, error: d?.message ?? d?.error?.message ?? "Activation impossible." };
    return { ok: true, alreadyActive: !!d?.already_active };
  } catch {
    return { ok: false, error: "Service momentanément indisponible. Réessayez dans un instant." };
  }
}
