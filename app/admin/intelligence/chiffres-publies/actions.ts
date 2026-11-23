"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import type { Reference } from "../types";

export async function listReferences(): Promise<Reference[] | null> {
  const r = await authedFetch("/site/admin/intelligence/references", { method: "GET", cache: "no-store" });
  return r.ok ? r.data.items : null;
}

export async function addReference(_prev: { error?: string; ok?: boolean } | null, form: FormData): Promise<{ error?: string; ok?: boolean }> {
  const body = Object.fromEntries([...form.entries()].map(([k, v]) => [k, String(v)]));
  const r = await authedFetch("/site/admin/intelligence/references", { method: "POST", body: JSON.stringify(body) });
  if (!r.ok) return { error: r.data?.message ?? "Enregistrement impossible." };
  revalidatePath("/admin/intelligence/chiffres-publies");
  return { ok: true };
}

export async function deleteReference(form: FormData): Promise<void> {
  const id = Number(form.get("id"));
  if (id > 0) await authedFetch(`/site/admin/intelligence/references/${id}`, { method: "DELETE" });
  revalidatePath("/admin/intelligence/chiffres-publies");
}
