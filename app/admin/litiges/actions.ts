"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import type { DisputeMessage, MyBooking, MyDispute } from "@/app/mon-espace/reservations/actions";

const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;
const qs = (p: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(p).filter(([, v]) => v) as [string, string][]).toString();
  return s ? `?${s}` : "";
};

export type AdminBooking = Omit<MyBooking, "host"> & { host: { userId: string | null; name: string | null; phone: string | null } };
export interface AdminDisputeRow extends MyDispute { overdue: boolean; escrowFrozen: boolean; guest: { id: string; name: string; phone: string } | null }
export interface AdminDispute extends MyDispute {
  overdue: boolean;
  guest: { id: string; name: string; phone: string; email: string | null; verified: boolean } | null;
  host: { name: string; phone: string | null; email: string | null } | null;
  booking: AdminBooking | null;
  escrow: { id: string; reference: string; status: string; amount: number; payoutStatus: string; refunded: number | null; managerPayout: number | null; commission: number | null } | null;
  messages: (DisputeMessage & { internal: boolean; audience: "all" | "guest" | "host" | "team" })[];
  meta: { resolutions: Record<string, string>; statuses: Record<string, string>; hostReplyHours: number };
}

export async function getDisputeCounts() {
  const { ok, data } = await authedFetch("/site/admin/disputes/counts", { method: "GET" });
  return ok ? (data as { open: number; overdue: number }) : null;
}

export async function listAdminBookings(p: Record<string, string | undefined>) {
  const { ok, data } = await authedFetch(`/site/admin/bookings${qs(p)}`, { method: "GET" });
  return ok ? (data as { total: number; page: number; perPage: number; items: AdminBooking[] }) : null;
}

export async function listAdminDisputes(p: Record<string, string | undefined>) {
  const { ok, data } = await authedFetch(`/site/admin/disputes${qs(p)}`, { method: "GET" });
  return ok ? (data as { total: number; page: number; counts: Record<string, number>; items: AdminDisputeRow[] }) : null;
}

export async function getAdminDispute(id: string) {
  const { ok, data } = await authedFetch(`/site/admin/disputes/${encodeURIComponent(id)}`, { method: "GET" });
  return ok ? (data as AdminDispute) : null;
}

export async function disputeMessageAction(id: string, input: { to: "guest" | "host_out" | "host_in" | "internal"; body: string; askReply?: boolean; visible?: boolean }) {
  const { ok, data } = await authedFetch(`/site/admin/disputes/${encodeURIComponent(id)}/messages`, { method: "POST", body: JSON.stringify(input) });
  revalidatePath(`/admin/litiges/${id}`);
  revalidatePath("/admin/litiges");
  return ok ? { ok: true as const } : { ok: false as const, error: errMsg(data, "Envoi impossible.") };
}

export async function disputeDecisionAction(id: string, input: { action: "resolve" | "reject"; resolution?: string; refundAmount?: number; refundRef?: string; note: string }) {
  const { ok, data } = await authedFetch(`/site/admin/disputes/${encodeURIComponent(id)}/decision`, { method: "POST", body: JSON.stringify(input) });
  revalidatePath(`/admin/litiges/${id}`);
  revalidatePath("/admin/litiges");
  revalidatePath("/admin", "layout");
  return ok ? { ok: true as const } : { ok: false as const, error: errMsg(data, "Décision impossible.") };
}
