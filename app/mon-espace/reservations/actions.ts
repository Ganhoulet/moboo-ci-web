"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export type Stage = "requested" | "accepted" | "confirmed" | "ongoing" | "completed" | "cancelled" | "no_show";
/** Révélé une fois la réservation confirmée (acompte payé) : façon Airbnb. */
export interface BookingAccess {
  code: string | null; codeLabel: string; address: string | null; latitude: number | null; longitude: number | null; mapsUrl: string | null;
  /** Guidage Waze (null sans coordonnées GPS ; absent des anciennes réponses). */
  wazeUrl?: string | null;
  hostPhone: string | null; checkInTime: string | null; checkOutTime: string | null; instructions: string | null;
  wifiName: string | null; wifiPassword: string | null; houseRules: string | null;
}

export interface MyBooking {
  key: string; kind: "stay" | "event"; ref: string; title: string; place: string; photo: string | null; href: string | null;
  start: string; end: string; nights: number | null; guests: number; amount: number; deposit: number; paid: number;
  stage: Stage; stageLabel: string; payUrl: string | null;
  /** Demande acceptée : payer l'acompte avant cette date, sinon elle est annulée. */
  payBefore?: string | null;
  escrow: { status: string; amount: number; payoutStatus: string; refunded: number | null } | null;
  canCancel: boolean; canDispute: boolean; dispute: { id: string; number: string; status: string; statusLabel: string } | null;
  guest: { name: string; phone: string }; host: { name: string | null };
  cancellationReason: string | null; createdAt: string;
  access?: BookingAccess | null;
  /** Code d'arrivée jamais saisi : le client dit s'il est arrivé (à partir du jour d'arrivée). */
  arrival?: { canAnswer: boolean; answer: string | null } | null;
  /** Réservation payée : annulation avant le jour d'arrivée, remboursée ou non. */
  cancelPolicy?: { refund: "full" | "none"; freeUntil: string | null } | null;
}
export interface MyBookingDetail extends MyBooking {
  windowDays: number; categories: { key: string; label: string }[]; outcomes: Record<string, string>;
}
export interface DisputeMessage { id: string; author: string; authorName: string; body: string; files: { name: string; url: string | null }[]; createdAt: string }
export interface MyDispute {
  id: string; number: string; kind: string; key: string; title: string; category: string; categoryLabel: string; description: string;
  desiredOutcome: string; desiredOutcomeLabel: string; amountClaimed: number | null; status: string; statusLabel: string; open: boolean;
  respondBy: string | null; resolution: string | null; resolutionLabel: string | null; refundAmount: number | null; refundRef: string | null;
  resolutionNote: string | null; closedAt: string | null; createdAt: string; updatedAt: string; messages?: DisputeMessage[];
}

export async function listMyBookings() {
  const { ok, data } = await authedFetch("/site/me/bookings", { method: "GET" });
  return ok ? (data as { items: MyBooking[]; disputesEnabled: boolean; windowDays: number }) : null;
}

export async function getMyBooking(key: string) {
  const { ok, data } = await authedFetch(`/site/me/bookings/${encodeURIComponent(key)}`, { method: "GET" });
  return ok ? (data as MyBookingDetail) : null;
}

export async function getMyDispute(id: string) {
  const { ok, data } = await authedFetch(`/site/me/disputes/${encodeURIComponent(id)}`, { method: "GET" });
  return ok ? (data as MyDispute) : null;
}

const done = (ok: boolean, data: any, fallback: string) => {
  revalidatePath("/mon-espace/reservations", "layout");
  return ok ? { ok: true as const, data } : { ok: false as const, error: errMsg(data, fallback) };
};

export async function cancelBookingAction(key: string) {
  const { ok, data } = await authedFetch(`/site/me/bookings/${encodeURIComponent(key)}/cancel`, { method: "POST" });
  return done(ok, data, "Annulation impossible.");
}

export async function openDisputeAction(key: string, input: { category: string; description: string; desiredOutcome: string; amountClaimed?: number; files?: string[] }) {
  const { ok, data } = await authedFetch(`/site/me/bookings/${encodeURIComponent(key)}/dispute`, { method: "POST", body: JSON.stringify(input) });
  return done(ok, data, "Envoi impossible.");
}

export async function replyDisputeAction(id: string, input: { body: string; files?: string[] }) {
  const { ok, data } = await authedFetch(`/site/me/disputes/${encodeURIComponent(id)}/messages`, { method: "POST", body: JSON.stringify(input) });
  return done(ok, data, "Envoi impossible.");
}

export async function withdrawDisputeAction(id: string) {
  const { ok, data } = await authedFetch(`/site/me/disputes/${encodeURIComponent(id)}/withdraw`, { method: "POST" });
  return done(ok, data, "Action impossible.");
}

export type ArrivalAnswer = "arrived" | "absent" | "problem";

/** « Êtes-vous bien arrivé ? » : réponse depuis Mes réservations. */
export async function answerArrivalAction(key: string, answer: ArrivalAnswer, note?: string) {
  const { ok, data } = await authedFetch(`/site/me/bookings/${encodeURIComponent(key)}/arrival`, { method: "POST", body: JSON.stringify({ answer, note }) });
  return done(ok, data, "Envoi impossible.");
}

/** Voyageur en route : distance au logement pour l'équipe Moboo (avec son accord). */
export async function sharePositionAction(key: string, lat: number, lng: number) {
  await authedFetch(`/site/me/bookings/${encodeURIComponent(key)}/position`, { method: "POST", body: JSON.stringify({ lat, lng }) }).catch(() => null);
  return { ok: true as const };
}
