"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export interface VerificationFlag { code: string; label: string; severity: "high" | "medium" | "low"; accountId?: string }
export interface AdminVerification {
  id: string; level: "identity" | "business"; docType: string; fullName: string; note: string | null; status: string; statusLabel: string; adminNote: string | null;
  createdAt: string; reviewedAt: string | null; frontUrl: string | null; backUrl: string | null; selfieUrl: string | null;
  docNumber: string | null; docExpiry: string | null; businessName: string | null; businessNumber: string | null;
  flags: VerificationFlag[]; checks: Record<string, boolean>; reasonCode: string | null;
  account: {
    id: string; name: string; phone: string; email: string | null; accountType: string; username: string | null; verified: boolean; businessVerified: boolean;
    phoneVerified: boolean; createdAt: string; personName: string | null; companyName: string | null;
  } | null;
}
export interface VerificationMeta {
  checks: Record<"identity" | "business", { key: string; label: string; selfie?: boolean }[]>;
  reasons: { code: string; label: string; text: string }[];
}

export async function listVerifications(params: Record<string, string | undefined>) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  const { ok, data } = await authedFetch(`/site/admin/verifications${qs ? `?${qs}` : ""}`, { method: "GET" });
  return ok ? (data as { total: number; page: number; perPage: number; counts: Record<string, number>; items: AdminVerification[]; meta: VerificationMeta }) : null;
}

export async function reviewVerificationAction(id: string, action: "approve" | "reject" | "more_info", opts: { adminNote?: string; checks?: Record<string, boolean>; reasonCode?: string } = {}): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`/site/admin/verifications/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ action, ...opts }) });
  revalidatePath("/admin/verifications");
  revalidatePath("/", "layout");
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Action impossible.") };
}

export async function revokeVerificationAction(accountId: string, level: "identity" | "business" = "identity"): Promise<{ ok: boolean }> {
  const { ok } = await authedFetch(`/site/admin/verifications/accounts/${encodeURIComponent(accountId)}/revoke`, { method: "POST", body: JSON.stringify({ level }) });
  revalidatePath("/admin/verifications");
  revalidatePath("/", "layout");
  return { ok };
}
