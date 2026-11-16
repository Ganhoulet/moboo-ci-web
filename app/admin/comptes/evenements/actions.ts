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

const KEYS = ["depositPercent", "optionHours", "soldeDaysBefore", "soldeNoticeDays", "releaseHoursAfterEnd", "freeCancelDays", "halfCancelDays", "halfCancelPercent"] as const;

/** Réglages des réservations d'espaces en ligne + périodes de haute saison. */
export async function saveEventSettingsAction(_prev: R | null, formData: FormData): Promise<R> {
  const patch: Record<string, number> = {};
  for (const k of KEYS) {
    const v = String(formData.get(k) ?? "").trim();
    if (v !== "") patch[k] = Number(v);
  }
  const a = await authedFetch("/site/admin/event-online/settings", { method: "PATCH", body: JSON.stringify(patch) });
  if (!a.ok) return { ok: false, error: err(a.data, "Réglages refusés.") };
  // Une période par ligne : « Nom | début | fin » (MM-JJ chaque année, ou AAAA-MM-JJ).
  const saisons = String(formData.get("saisons") ?? "")
    .split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p.length === 3 && p[0])
    .map(([label, from, to]) => ({ label, from, to }));
  const b = await authedFetch("/site/admin/event-online/saisons", { method: "PUT", body: JSON.stringify({ saisons }) });
  if (!b.ok) return { ok: false, error: err(b.data, "Périodes de haute saison refusées.") };
  revalidatePath("/admin/comptes/evenements/reglages");
  return { ok: true };
}
