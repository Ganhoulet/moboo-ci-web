"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import type { ConversionSignal } from "@/lib/signals";

const msg = (d: any, f: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || (Array.isArray(d?.error?.message) ? d.error.message[0] : d?.error?.message) || f;
const B = "/site/admin/signals";

export interface CenterOverview {
  week: { furnished: number; furnishedByChannel: Record<string, number>; events: number; declared: number; inquiries: number; closed: number };
  activePromotions: number; onlineNow: number;
  activity: { text: string; ago: string; href: string | null; kind: string }[];
}
export interface Target { type: "residence" | "espace" | "listing"; id: string; label: string; zone: string | null; units?: { id: string; label: string }[] }
export interface Promotion { id: string; targetType: string; targetId: string; targetLabel: string; title: string; discountPct: number | null; conditions: string | null; startsAt: string; endsAt: string; active: boolean; views: number }
export interface Declared { id: string; targetType: string; label: string; zone: string | null; checkIn: string; checkOut: string; guests: number | null; note: string | null; status: string; declaredBy: string | null; createdAt: string; residenceId: string | null; espaceId: string | null }

export async function getCenterOverview(): Promise<CenterOverview | null> {
  const r = await authedFetch(B, { method: "GET" });
  return r.ok ? r.data : null;
}
export async function searchTargetsAction(q: string): Promise<Target[]> {
  const r = await authedFetch(`${B}/targets?q=${encodeURIComponent(q)}`, { method: "GET" });
  return r.ok ? r.data.items : [];
}
export async function previewAction(type: string, id: string): Promise<ConversionSignal[]> {
  const r = await authedFetch(`${B}/preview/${encodeURIComponent(type)}/${encodeURIComponent(id)}`, { method: "GET" });
  return r.ok ? r.data.items : [];
}

export async function listPromotions(): Promise<Promotion[]> {
  const r = await authedFetch(`${B}/promotions`, { method: "GET" });
  return r.ok ? r.data.items : [];
}
export async function savePromotionAction(id: string | null, body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(id ? `${B}/promotions/${encodeURIComponent(id)}` : `${B}/promotions`, { method: id ? "PATCH" : "POST", body: JSON.stringify(body) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Enregistrement impossible.") };
  revalidatePath("/admin/centre-marketing", "layout");
  return { ok: true };
}
export async function removePromotionAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`${B}/promotions/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!r.ok) return { ok: false, error: msg(r.data, "Suppression impossible.") };
  revalidatePath("/admin/centre-marketing", "layout");
  return { ok: true };
}

export async function listDeclared(): Promise<Declared[]> {
  const r = await authedFetch(`${B}/bookings`, { method: "GET" });
  return r.ok ? r.data.items : [];
}
export async function declareBookingAction(body: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`${B}/bookings`, { method: "POST", body: JSON.stringify(body) });
  if (!r.ok) return { ok: false, error: msg(r.data, "Déclaration impossible.") };
  revalidatePath("/admin/centre-marketing", "layout");
  return { ok: true };
}
export async function cancelDeclaredAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`${B}/bookings/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!r.ok) return { ok: false, error: msg(r.data, "Annulation impossible.") };
  revalidatePath("/admin/centre-marketing", "layout");
  return { ok: true };
}
