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

/** L'équipe Moboo corrige les réglages d'une salle : suppléments, heures des créneaux, options, visites. */
export async function saveSpaceRulesAction(id: string, _prev: R | null, formData: FormData): Promise<R> {
  const n = (k: string) => { const v = String(formData.get(k) ?? "").trim(); return v === "" ? null : Number(v); };
  const h = (k: string) => String(formData.get(k) ?? "").trim();
  const options = String(formData.get("options") ?? "")
    .split("\n").map((l) => l.split("|").map((x) => x.trim())).filter((p) => p.length >= 2 && p[0])
    .map(([nom, prix, unite], i) => ({ id: `opt${i + 1}`, nom, prix: Number(String(prix).replace(/\D/g, "")), unite: /invit/i.test(unite ?? "") ? "par_invite" : "forfait" }));
  const body = {
    weekendPercent: n("weekendPercent") ?? 0, saisonPercent: n("saisonPercent") ?? 0,
    invitesInclus: n("invitesInclus"), prixParInviteSup: n("prixParInviteSup") ?? 0,
    creneaux: {
      matinee: { debut: h("matinee.debut"), fin: h("matinee.fin") },
      apres_midi: { debut: h("apres_midi.debut"), fin: h("apres_midi.fin") },
      soiree: { debut: h("soiree.debut"), fin: h("soiree.fin") },
    },
    options,
    visites: { actif: formData.get("visites.actif") === "on", jours: formData.getAll("visites.jours").map(Number), debut: h("visites.debut"), fin: h("visites.fin"), dureeMin: n("visites.dureeMin") ?? 30 },
  };
  const { ok, data } = await authedFetch(`/site/admin/event-online/espaces/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify(body) });
  if (!ok) return { ok: false, error: err(data, "Réglages refusés.") };
  revalidatePath(`/admin/comptes/evenements/salles/${id}`);
  return { ok: true };
}
