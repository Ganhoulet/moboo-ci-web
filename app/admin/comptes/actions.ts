"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { startAssist } from "@/lib/assist";
import { authedFetch } from "@/lib/server-api";

/** Account managers (back-office → Suivi des comptes). */
export async function getAm<T = any>(path: string): Promise<T | null> {
  const { ok, data } = await authedFetch(`/site/admin/am${path}`, { method: "GET" });
  return ok ? (data as T) : null;
}

type R = { ok: boolean; error?: string; paymentUrl?: string | null; sentBy?: string | null };
const err = (d: any, fb: string) => (typeof d?.error?.message === "string" ? d.error.message : typeof d?.message === "string" ? d.message : fb);

async function send(path: string, method: string, body?: unknown): Promise<R & { data?: any }> {
  const { ok, data } = await authedFetch(`/site/admin/am${path}`, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (!ok) return { ok: false, error: err(data, "Action impossible.") };
  revalidatePath("/admin/comptes", "layout");
  return { ok: true, data };
}

export async function confirmBookingAction(key: string, note: string): Promise<R> {
  const r = await send(`/bookings/${encodeURIComponent(key)}/confirm`, "POST", { hostAgreed: true, note });
  return { ok: r.ok, error: r.error, paymentUrl: r.data?.paymentUrl ?? null, sentBy: r.data?.sentBy ?? null };
}
/** Renvoyer au client le lien de paiement d'un séjour accepté (WhatsApp, sinon SMS). */
export async function sendPaymentLinkAction(key: string): Promise<R> {
  const r = await send(`/bookings/${encodeURIComponent(key)}/payment-link`, "POST", {});
  return { ok: r.ok, error: r.error, paymentUrl: r.data?.paymentUrl ?? null, sentBy: r.data?.sentBy ?? null };
}
export async function declineBookingAction(key: string, reason: string): Promise<R> {
  return send(`/bookings/${encodeURIComponent(key)}/decline`, "POST", { reason });
}
export async function bookingContactAction(key: string, type: "call" | "whatsapp", outcome: string, body = ""): Promise<R> {
  return send(`/bookings/${encodeURIComponent(key)}/contact`, "POST", { type, outcome, body });
}
export async function addActivityAction(kind: string, id: string, input: { type: string; body: string; outcome?: string; dueAt?: string }): Promise<R> {
  return send(`/accounts/${kind}/${encodeURIComponent(id)}/activities`, "POST", input);
}
export async function taskDoneAction(id: string, done: boolean): Promise<R> {
  return send(`/tasks/${encodeURIComponent(id)}`, "PATCH", { done });
}
export async function assignAction(kind: string, id: string, managerId: string | null): Promise<R> {
  return send(`/accounts/${kind}/${encodeURIComponent(id)}/manager`, "PUT", { managerId });
}

export async function saveTeamAction(id: string | null, input: { name: string; zones: string; leadId: string | null; members: string[] }): Promise<R> {
  return send(id ? `/teams/${encodeURIComponent(id)}` : "/teams", id ? "PUT" : "POST", input);
}
export async function deleteTeamAction(id: string): Promise<R> {
  return send(`/teams/${encodeURIComponent(id)}`, "DELETE");
}
export async function saveMemberAction(id: string, input: Record<string, unknown>): Promise<R> {
  return send(`/members/${encodeURIComponent(id)}`, "PUT", input);
}
export async function distributeAction(): Promise<R & { data?: any }> {
  return send("/distribute", "POST", {});
}
export async function runAlertsAction(): Promise<R & { data?: any }> {
  return send("/alerts/run", "POST", {});
}
export async function changeDatesAction(key: string, input: { start: string; end: string; note: string }): Promise<R & { data?: any }> {
  return send(`/bookings/${encodeURIComponent(key)}/dates`, "POST", { ...input, hostAgreed: true, guestAgreed: true });
}
export async function disputeReplyAction(kind: string, id: string, disputeId: string, body: string): Promise<R> {
  return send(`/accounts/${kind}/${encodeURIComponent(id)}/disputes/${encodeURIComponent(disputeId)}/reply`, "POST", { body, hostAgreed: true });
}
export async function sendRecoAction(kind: string, id: string, input: { code: string; itemId: string; channel: string; message: string }): Promise<R & { data?: any }> {
  return send(`/accounts/${kind}/${encodeURIComponent(id)}/recommendations/send`, "POST", input);
}
export async function dismissRecoAction(kind: string, id: string, input: { code: string; itemId: string; note?: string }): Promise<R> {
  return send(`/accounts/${kind}/${encodeURIComponent(id)}/recommendations/dismiss`, "POST", input);
}

// ─── Accès au compte d'un client ───
export async function requestAssistAction(accountId: string): Promise<R & { data?: any }> {
  return send(`/accounts/site/${encodeURIComponent(accountId)}/assist`, "POST", {});
}
export async function openAssistAction(sessionId: string, code: string, accountId: string, name: string): Promise<R> {
  const { ok, data } = await authedFetch(`/site/admin/am/assist/${encodeURIComponent(sessionId)}/verify`, { method: "POST", body: JSON.stringify({ code }) });
  if (!ok) return { ok: false, error: err(data, "Code refusé.") };
  startAssist({ accessToken: data.accessToken, expiresIn: data.expiresIn }, data.account, { id: data.sessionId, accountId, name, endsAt: new Date(data.endsAt).toISOString() });
  redirect("/mon-espace");
}
export async function recoveryAction(accountId: string): Promise<R & { data?: any }> {
  return send(`/accounts/site/${encodeURIComponent(accountId)}/recovery`, "POST", {});
}
export async function phoneChangeAction(accountId: string, newPhone: string, reason: string): Promise<R> {
  return send(`/accounts/site/${encodeURIComponent(accountId)}/phone-change`, "POST", { newPhone, reason });
}
export async function decidePhoneAction(id: string, approve: boolean, note = ""): Promise<R> {
  return send(`/phone-changes/${encodeURIComponent(id)}/decide`, "POST", { approve, note });
}
export async function saveGoalsAction(managerId: string, period: string, goals: Record<string, number | null>): Promise<R> {
  return send("/goals", "PUT", { managerId, period, goals });
}
