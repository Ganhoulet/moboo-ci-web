"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { LAYOUTS_TAG, type LayoutsConfig, type ResultLayout } from "@/lib/result-layouts";

export interface LayoutsView { config: LayoutsConfig; presets: ResultLayout[] }
const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Enregistrement impossible.";

export async function getLayoutsAdmin(): Promise<LayoutsView | null> {
  const r = await authedFetch("/site/admin/result-layouts", { method: "GET" });
  return r.ok ? r.data : null;
}

export async function saveLayoutsAction(config: LayoutsConfig): Promise<{ ok: boolean; error?: string; view?: LayoutsView }> {
  const r = await authedFetch("/site/admin/result-layouts", { method: "PUT", body: JSON.stringify(config) });
  if (!r.ok) return { ok: false, error: err(r.data) };
  revalidateTag(LAYOUTS_TAG);
  revalidatePath("/annonces");
  revalidatePath("/", "layout");
  return { ok: true, view: r.data };
}
