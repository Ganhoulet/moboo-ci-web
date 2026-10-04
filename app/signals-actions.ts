"use server";

import { apiPost } from "@/lib/api";
import { getActivity, getSignals, type SignalTarget } from "@/lib/signals";

/** Présence du visiteur sur une fiche, puis signaux à jour (personnes en ligne comprises). */
export async function presenceAction(type: SignalTarget, id: string, visitor: string, dates?: { checkIn?: string; checkOut?: string }) {
  const key = `${type === "residence" ? "res" : type === "espace" ? "esp" : "lst"}:${id}`;
  try { await apiPost("/site/signals/presence", { key, v: visitor }); } catch { /* best-effort */ }
  return getSignals(type, id, { v: visitor, ...dates });
}

export async function activityAction() {
  return getActivity();
}
