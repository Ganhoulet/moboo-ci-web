"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

/** Mon espace → Bien vérifié Moboo : demandes de visite de contrôle. */
const err = (d: any, fb: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || d?.error?.message || fb;

export async function getMyInspections() {
  const { ok, data } = await authedFetch("/site/me/inspections", { method: "GET" });
  return ok ? data : null;
}
export async function requestInspectionAction(input: { listingId: string; visitDate?: string; contactPhone?: string; note?: string }) {
  const { ok, data } = await authedFetch("/site/me/inspections", { method: "POST", body: JSON.stringify(input) });
  revalidatePath("/mon-espace/bien-verifie");
  return ok ? { ok: true } : { ok: false, error: err(data, "Demande impossible.") };
}
