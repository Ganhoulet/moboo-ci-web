"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

/** Laisser un avis (compte connecté). */
export async function submitReviewAction(input: { targetType: "listing" | "pro"; targetId: string; rating: number; title?: string; comment: string; path: string }): Promise<{ ok: boolean; status?: string; error?: string }> {
  const { path, ...body } = input;
  const { ok, status, data } = await authedFetch("/site/me/reviews", { method: "POST", body: JSON.stringify(body) });
  if (status === 401) return { ok: false, error: "Connectez-vous pour donner votre avis." };
  if (!ok) return { ok: false, error: (Array.isArray(data?.message) ? data.message[0] : data?.message) || "Envoi impossible." };
  if (path.startsWith("/")) revalidatePath(path);
  return { ok: true, status: data?.status };
}
