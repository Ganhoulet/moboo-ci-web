"use server";

import { authedFetch } from "@/lib/server-api";

/** Formulaire « Être rappelé par un conseiller » des pages professionnelles. */
export async function proLeadAction(form: Record<string, string>): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch("/site/pro-leads", { method: "POST", body: JSON.stringify(form) });
  if (r.ok) return { ok: true };
  const d: any = r.data;
  return { ok: false, error: (Array.isArray(d?.error?.message) ? d.error.message[0] : d?.error?.message ?? d?.message) || "Envoi impossible, réessayez." };
}
