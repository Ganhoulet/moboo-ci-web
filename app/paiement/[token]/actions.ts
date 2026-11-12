"use server";

import { redirect } from "next/navigation";
import { API_URL } from "@/lib/api";

export type PayState = { ok: boolean; message?: string } | null;

/** « Payer » depuis le lien reçu : ouvre le paiement mobile money (Money Fusion). */
export async function payAction(_prev: PayState, formData: FormData): Promise<PayState> {
  const token = String(formData.get("token") || "");
  if (!token) return { ok: false, message: "Lien invalide." };
  let url: string | null = null;
  try {
    const res = await fetch(`${API_URL}/site/billing/pay/${encodeURIComponent(token)}`, { method: "POST", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, message: data?.message || data?.error?.message || "Paiement impossible pour le moment. Réessayez." };
    if (data.paid) return { ok: true };
    url = typeof data.paymentUrl === "string" ? data.paymentUrl : null;
  } catch {
    return { ok: false, message: "Service indisponible. Réessayez dans un instant." };
  }
  if (!url) return { ok: false, message: "Paiement indisponible. Réessayez." };
  redirect(url);
}
