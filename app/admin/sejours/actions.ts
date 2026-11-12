"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

/** Back-office → Séjours : visites « Vérifié sur place » et kits Google Business. */

export interface AdminCheck {
  id: string; name: string; place: string; hasGps: boolean; state: "a_faire" | "valide" | "expiree" | "masquee";
  check: null | {
    visitedAt: string; agentName: string; videoUrl: string | null; photos: string[]; gpsChecked: boolean; conformity: string;
    power: string | null; water: string | null; wifiMbps: number | null; aircon: string | null; security: string | null; parking: boolean | null;
    notes: string | null; status: string;
  };
}

const err = (d: any, f: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || f;

export async function listChecks(q?: string) {
  const { ok, data } = await authedFetch(`/site/admin/stays/checks${q ? `?q=${encodeURIComponent(q)}` : ""}`, { method: "GET" });
  return ok ? (data as AdminCheck[]) : null;
}

export async function saveCheckAction(residenceId: string, body: Record<string, unknown>) {
  const { ok, data } = await authedFetch(`/site/admin/stays/checks/${encodeURIComponent(residenceId)}`, { method: "PUT", body: JSON.stringify(body) });
  if (!ok) return { ok: false as const, error: err(data, "Enregistrement impossible.") };
  revalidatePath("/admin/sejours/visites");
  revalidatePath(`/residence/${residenceId}`);
  return { ok: true as const };
}

export async function deleteCheckAction(residenceId: string) {
  const { ok, data } = await authedFetch(`/site/admin/stays/checks/${encodeURIComponent(residenceId)}`, { method: "DELETE" });
  if (!ok) return { ok: false as const, error: err(data, "Suppression impossible.") };
  revalidatePath("/admin/sejours/visites");
  return { ok: true as const };
}

export async function listKits() {
  const { ok, data } = await authedFetch("/site/admin/stays/gbp-kits", { method: "GET" });
  return ok ? (data as { id: string; name: string; place: string; kit: string }[]) : null;
}
