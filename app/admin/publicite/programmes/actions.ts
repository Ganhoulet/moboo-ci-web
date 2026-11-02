"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

/** Back-office → Publicité → Programmes neufs. */
const err = (d: any, fb: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || d?.error?.message || fb;

export async function getProgramsAdmin() {
  const { ok, data } = await authedFetch("/site/admin/programs", { method: "GET" });
  return ok ? data : null;
}
export async function saveProgramAction(input: Record<string, unknown>, id?: string) {
  const { ok, data } = await authedFetch(id ? `/site/admin/programs/${id}` : "/site/admin/programs", { method: id ? "PUT" : "POST", body: JSON.stringify(input) });
  revalidatePath("/admin/publicite/programmes");
  revalidatePath("/programmes-neufs");
  return ok ? { ok: true, slug: data?.slug as string } : { ok: false, error: err(data, "Enregistrement impossible.") };
}
export async function programLeadStatusAction(id: string, status: string) {
  const { ok } = await authedFetch(`/site/admin/programs/leads/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
  revalidatePath("/admin/publicite/programmes");
  return { ok };
}
