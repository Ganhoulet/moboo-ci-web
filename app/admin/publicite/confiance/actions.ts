"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

/** Back-office → Biens vérifiés & diaspora. */
export async function getTrustAdmin() {
  const [a, b] = await Promise.all([authedFetch("/site/admin/trust/inspections", { method: "GET" }), authedFetch("/site/admin/trust/diaspora", { method: "GET" })]);
  return a.ok && b.ok ? { inspections: a.data, diaspora: b.data } : null;
}
export async function inspectionAction(id: string, action: string, input: { visitDate?: string; note?: string } = {}) {
  const { ok } = await authedFetch(`/site/admin/trust/inspections/${id}/${action}`, { method: "POST", body: JSON.stringify(input) });
  revalidatePath("/admin/publicite/confiance");
  return { ok };
}
export async function diasporaStatusAction(id: string, status: string) {
  const { ok } = await authedFetch(`/site/admin/trust/diaspora/${id}`, { method: "PUT", body: JSON.stringify({ status }) });
  revalidatePath("/admin/publicite/confiance");
  return { ok };
}
