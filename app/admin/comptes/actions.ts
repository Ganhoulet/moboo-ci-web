"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

/** Account managers (back-office → Suivi des comptes). */
export async function getAm<T = any>(path: string): Promise<T | null> {
  const { ok, data } = await authedFetch(`/site/admin/am${path}`, { method: "GET" });
  return ok ? (data as T) : null;
}

type R = { ok: boolean; error?: string; paymentUrl?: string | null };
const err = (d: any, fb: string) => (typeof d?.error?.message === "string" ? d.error.message : typeof d?.message === "string" ? d.message : fb);

async function send(path: string, method: string, body?: unknown): Promise<R & { data?: any }> {
  const { ok, data } = await authedFetch(`/site/admin/am${path}`, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (!ok) return { ok: false, error: err(data, "Action impossible.") };
  revalidatePath("/admin/comptes", "layout");
  return { ok: true, data };
}

export async function confirmBookingAction(key: string, note: string): Promise<R> {
  const r = await send(`/bookings/${encodeURIComponent(key)}/confirm`, "POST", { hostAgreed: true, note });
  return { ok: r.ok, error: r.error, paymentUrl: r.data?.paymentUrl ?? null };
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
