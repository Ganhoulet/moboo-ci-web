"use server";

import { authedFetch } from "@/lib/server-api";

type Res<T = any> = { ok: true; data: T } | { ok: false; error: string };

const msg = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message[0] : d?.error?.message ?? d?.message) || "Envoi impossible, réessayez.";

async function post<T = any>(path: string, body: unknown): Promise<Res<T>> {
  const r = await authedFetch(`/site/services${path}`, { method: "POST", body: JSON.stringify(body ?? {}) });
  return r.ok ? { ok: true, data: r.data as T } : { ok: false, error: msg(r.data) };
}

/** Pages des services Moboo : formulaires (avec ou sans compte connecté). */
export async function edlRequestAction(form: Record<string, string>) { return post("/edl", form); }
export async function loyerEstimateAction(form: Record<string, string>) { return post("/loyer", form); }
export async function foncierEstimateAction(form: Record<string, string>) { return post("/foncier", form); }
export async function serviceLeadAction(service: string, form: { full_name: string; phone: string; data: Record<string, unknown> }) {
  return post(`/lead/${encodeURIComponent(service)}`, form);
}
export async function solvencyRequestAction(form: Record<string, string>) { return post<{ ref: string; channel: string; ttlMin: number }>("/solvabilite", form); }
export async function solvencyConfirmAction(ref: string, code: string) { return post(`/solvabilite/${encodeURIComponent(ref)}/confirm`, { code }); }
export async function solvencyResendAction(ref: string) { return post<{ channel: string }>(`/solvabilite/${encodeURIComponent(ref)}/resend`, {}); }
export async function missionRequestAction(service: string, form: Record<string, unknown>) { return post<{ id: number; dispatch: string }>(`/mission/${encodeURIComponent(service)}`, form); }
