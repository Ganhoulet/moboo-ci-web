"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

export interface ApiPartner {
  accountId: string; name: string; phone: string | null; accountType: string | null; enabled: boolean; rateLimit: number; note: string;
  webhook: boolean; createdAt: string; activeKeys: number; lastUsedAt: string | null; requests30d: number; errors30d: number; syncedListings: number;
}

const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Action impossible.";

export async function getApiPartners(): Promise<ApiPartner[] | null> {
  const r = await authedFetch("/site/admin/api-partners", { method: "GET" });
  return r.ok ? r.data.items : null;
}

export async function grantAction(_: unknown, form: FormData): Promise<{ ok: boolean; message: string }> {
  const r = await authedFetch("/site/admin/api-partners", {
    method: "POST",
    body: JSON.stringify({ account: String(form.get("account") ?? ""), rateLimit: Number(form.get("rateLimit") || 120), note: String(form.get("note") ?? "") }),
  });
  revalidatePath("/admin/immobilier/api-partenaires");
  return r.ok ? { ok: true, message: "Accès ouvert : l’agence crée ses clés dans Mon espace → API & intégrations." } : { ok: false, message: err(r.data) };
}

export async function toggleAction(accountId: string, enabled: boolean): Promise<void> {
  await authedFetch(`/site/admin/api-partners/${encodeURIComponent(accountId)}`, { method: "PATCH", body: JSON.stringify({ enabled }) });
  revalidatePath("/admin/immobilier/api-partenaires");
}

export async function rateAction(accountId: string, form: FormData): Promise<void> {
  await authedFetch(`/site/admin/api-partners/${encodeURIComponent(accountId)}`, { method: "PATCH", body: JSON.stringify({ rateLimit: Number(form.get("rateLimit") || 120) }) });
  revalidatePath("/admin/immobilier/api-partenaires");
}
