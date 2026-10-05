"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

const msg = (d: any, fallback: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || fallback;

/** Noter un agent / une agence (avis certifié, partagé avec l'application). */
export async function submitProReviewAction(ref: string, body: Record<string, unknown>, path: string): Promise<{ ok: boolean; status?: string; message?: string; error?: string }> {
  const { ok, status, data } = await authedFetch(`/site/me/pros/${encodeURIComponent(ref)}/reviews`, { method: "POST", body: JSON.stringify(body) });
  if (status === 401) return { ok: false, error: "Connectez-vous pour donner votre avis." };
  if (!ok) return { ok: false, error: msg(data, "Envoi impossible.") };
  if (path.startsWith("/")) revalidatePath(path);
  return { ok: true, status: data?.status, message: data?.message };
}

/** Réponse publique de l'agent à un avis reçu (Mon espace → Avis). */
export async function replyReviewAction(id: string, reply: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`/site/me/reviews/${encodeURIComponent(id)}/reply`, { method: "POST", body: JSON.stringify({ reply }) });
  if (!ok) return { ok: false, error: msg(data, "Réponse non enregistrée.") };
  revalidatePath("/mon-espace/avis");
  return { ok: true };
}
