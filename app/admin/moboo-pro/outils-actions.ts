"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

const BASE = "/site/admin/pro-outils";
const errMsg = (d: any) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || (Array.isArray(d?.error?.message) ? d.error.message[0] : d?.error?.message) || "Action impossible.";

export interface MandatRequest {
  id: number; wpId: number | null; ownerName: string; ownerPhone: string; ownerEmail: string | null; propertyLabel: string; zone: string;
  message: string | null; status: string; note: string | null; createdAt: string; updatedAt: string;
}
export interface ProDepart {
  id: number; organizationId: string; agency: string; propertyTitle: string; zone: string; commune: string; departDate: string | null;
  contactName: string; contactPhone: string; message: string | null; createdAt: string;
}

export async function getMandatRequests(status?: string): Promise<{ items: MandatRequest[]; counts: Record<string, number> } | null> {
  const { ok, data } = await authedFetch(`${BASE}/mandat-requests${status ? `?status=${encodeURIComponent(status)}` : ""}`, { method: "GET" });
  return ok ? data : null;
}

export async function getProDeparts(): Promise<ProDepart[] | null> {
  const { ok, data } = await authedFetch(`${BASE}/departs`, { method: "GET" });
  return ok && Array.isArray(data) ? data : null;
}

export async function setMandatRequestAction(id: number, status: string, note?: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`${BASE}/mandat-requests/${id}`, { method: "POST", body: JSON.stringify({ status, ...(note !== undefined ? { note } : {}) }) });
  revalidatePath("/admin/moboo-pro/demandes-gestion");
  return ok ? { ok: true } : { ok: false, error: errMsg(data) };
}
