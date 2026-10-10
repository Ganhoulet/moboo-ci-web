"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

export async function getProPageSettings() {
  const r = await authedFetch("/site/admin/pro-profiles/settings", { method: "GET" });
  return r.ok ? r.data : null;
}

export async function saveProPageSettings(v: unknown) {
  const r = await authedFetch("/site/admin/pro-profiles/settings", { method: "PUT", body: JSON.stringify(v) });
  revalidatePath("/admin/immobilier/pages-pros");
  return r.ok ? { ok: true, data: r.data } : { ok: false, error: r.data?.error?.message ?? r.data?.message ?? "Enregistrement impossible." };
}
