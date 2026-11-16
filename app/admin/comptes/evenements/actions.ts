"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

type R = { ok: boolean; error?: string };
const err = (d: any, fb: string) => (typeof d?.error?.message === "string" ? d.error.message : typeof d?.message === "string" ? d.message : fb);

/** Débloque la part de l'hôte sans code du jour J (événement confirmé autrement). */
export async function releaseEventAction(id: string): Promise<R> {
  const { ok, data } = await authedFetch(`/site/admin/event-online/events/${encodeURIComponent(id)}/debloquer`, { method: "POST" });
  if (!ok) return { ok: false, error: err(data, "Déblocage impossible.") };
  revalidatePath("/admin/comptes/evenements");
  return { ok: true };
}

/** Annulation décidée par l'équipe Moboo : client remboursé à 100 %. */
export async function cancelEventAction(id: string, motif: string): Promise<R> {
  const { ok, data } = await authedFetch(`/site/admin/event-online/events/${encodeURIComponent(id)}/annuler`, { method: "POST", body: JSON.stringify({ motif }) });
  if (!ok) return { ok: false, error: err(data, "Annulation impossible.") };
  revalidatePath("/admin/comptes/evenements");
  return { ok: true };
}
