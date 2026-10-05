"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

export interface ProLead {
  id: string; audience: string; name: string; phone: string; email: string | null; company: string | null; city: string | null;
  message: string | null; source: string; status: string; note: string | null; handledBy: string | null; createdAt: string;
}

export async function listProLeads(status?: string): Promise<{ items: ProLead[]; counts: Record<string, number>; audiences: Record<string, string> } | null> {
  const r = await authedFetch(`/site/admin/pro-leads${status ? `?status=${encodeURIComponent(status)}` : ""}`, { method: "GET" });
  return r.ok ? r.data : null;
}
export async function updateProLeadAction(id: string, data: { status?: string; note?: string }): Promise<{ ok: boolean }> {
  const r = await authedFetch(`/site/admin/pro-leads/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(data) });
  if (r.ok) revalidatePath("/admin/professionnels", "layout");
  return { ok: r.ok };
}
