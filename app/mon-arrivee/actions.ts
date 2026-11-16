"use server";

import { revalidatePath } from "next/cache";
import { API_URL } from "@/lib/api";

/** « Êtes-vous bien arrivé ? » : réponse depuis la page d'arrivée (lien reçu, sans connexion). */
export async function answerArrivalByToken(token: string, answer: "arrived" | "absent" | "problem", note?: string) {
  try {
    const res = await fetch(`${API_URL}/site/stays/arrival/${encodeURIComponent(token)}/answer`, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ answer, note }), cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    revalidatePath(`/mon-arrivee/${token}`);
    if (res.ok) return { ok: true as const };
    const m = data?.error?.message ?? data?.message;
    return { ok: false as const, error: (Array.isArray(m) ? m[0] : m) || "Envoi impossible." };
  } catch {
    return { ok: false as const, error: "Connexion impossible, réessayez." };
  }
}

/** Voyageur en route : distance au logement pour l'équipe Moboo (avec son accord). */
export async function sharePositionByToken(token: string, lat: number, lng: number) {
  try {
    await fetch(`${API_URL}/site/stays/arrival/${encodeURIComponent(token)}/position`, {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ lat, lng }), cache: "no-store",
    });
  } catch { /* le guidage reste utilisable sans envoi */ }
  return { ok: true as const };
}
