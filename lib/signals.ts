// Centre marketing : signaux de conversion (façon Booking), calculés par l'API
// sur des données réelles. Lecture sans cache : présence et activité changent vite.
import { API_URL } from "./api";
import { relayHeaders } from "./relay";

export type SignalTone = "urgent" | "social" | "deal" | "info" | "trust";
export interface ConversionSignal { key: string; tone: SignalTone; icon: string; text: string }
export interface CardSignal { text: string; tone: SignalTone; icon: string }
export type SignalTarget = "residence" | "espace" | "listing";

async function get<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API_URL}${path}`, { cache: "no-store", headers: { Accept: "application/json", ...relayHeaders(false) }, signal: AbortSignal.timeout(3500) });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

export async function getSignals(type: SignalTarget, id: string, q: { checkIn?: string; checkOut?: string; v?: string } = {}) {
  const qs = new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]).toString();
  return (await get<{ items: ConversionSignal[] }>(`/site/signals/${type}/${encodeURIComponent(id)}${qs ? `?${qs}` : ""}`))?.items ?? [];
}

/** Un message court par carte des résultats (ids : lst-…, res-…, esp-…). */
export async function getCardSignals(ids: string[]): Promise<Record<string, CardSignal>> {
  if (!ids.length) return {};
  return (await get<{ items: Record<string, CardSignal> }>(`/site/signals/cards?ids=${encodeURIComponent(ids.slice(0, 120).join(","))}`))?.items ?? {};
}

export interface ActivityFeed { enabled: boolean; intervalSec: number; max: number; items: { text: string; ago: string; href: string | null; kind: string }[] }
export const getActivity = () => get<ActivityFeed>("/site/signals/activity");

/** Couleurs par tonalité (fiches et cartes). */
export const TONE_CLASS: Record<SignalTone, string> = {
  urgent: "bg-red-50 text-red-800 ring-red-200",
  social: "bg-amber-50 text-amber-900 ring-amber-200",
  deal: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  info: "bg-sky-50 text-sky-800 ring-sky-200",
  trust: "bg-slate-50 text-slate-700 ring-slate-200",
};
