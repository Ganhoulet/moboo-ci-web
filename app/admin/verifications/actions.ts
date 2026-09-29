"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export interface AdminVerification {
  id: string; docType: string; fullName: string; note: string | null; status: string; statusLabel: string; adminNote: string | null;
  createdAt: string; reviewedAt: string | null; frontUrl: string | null; backUrl: string | null;
  account: { id: string; name: string; phone: string; email: string | null; accountType: string; username: string | null; verified: boolean } | null;
}

export async function listVerifications(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  const { ok, data } = await authedFetch(`/site/admin/verifications${qs ? `?${qs}` : ""}`, { method: "GET" });
  return ok ? (data as { total: number; page: number; perPage: number; counts: Record<string, number>; items: AdminVerification[] }) : null;
}

export async function reviewVerificationAction(id: string, action: "approve" | "reject" | "more_info", adminNote?: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`/site/admin/verifications/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ action, adminNote }) });
  revalidatePath("/admin/verifications");
  revalidatePath("/", "layout");
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Action impossible.") };
}

export async function revokeVerificationAction(accountId: string): Promise<{ ok: boolean }> {
  const { ok } = await authedFetch(`/site/admin/verifications/accounts/${encodeURIComponent(accountId)}/revoke`, { method: "POST" });
  revalidatePath("/admin/verifications");
  revalidatePath("/", "layout");
  return { ok };
}
