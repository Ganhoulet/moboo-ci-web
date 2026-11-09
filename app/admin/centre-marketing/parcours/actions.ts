"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

export type JourneyChannel = "email" | "whatsapp" | "sms";
export interface JourneyStep { channel?: JourneyChannel; delayHours: number; subject: string; body: string; ctaLabel: string; ctaUrl: string; waTemplate?: string; waVars?: string[]; skipIfClicked?: boolean }
export interface Journey {
  key: string; name: string; enabled: boolean; backfill: boolean; activatedAt: string | null; audiences: string[]; dailyCap: number; paidCap: number; gapDays: number;
  steps: JourneyStep[]; updatedBy: string | null; updatedAt: string | null;
  stages: Record<string, number>; statuses: Record<string, number>; last30: Record<string, number>; paid30: Record<string, number>;
}
export interface JourneyOverview {
  journeys: Journey[]; stages: { key: string; en: string; label: string; hint: string }[]; statusLabels: Record<string, string>;
  audiences: Record<string, string>; emailReady: boolean; maxDailyCap: number; variables: Record<string, string>;
  channels: Record<JourneyChannel, boolean>; stepSamples: Record<"whatsapp" | "sms", Omit<JourneyStep, "ctaUrl">>; callOutcomes: Record<string, string>;
}
export interface ProfileCount { total: number; real: number; generated: number; invalid: number; missing: number; recoverable: number }
export interface JourneyDiagnostic {
  accounts: number; byProfile: Record<string, ProfileCount>; professionals: { total: number; onAny: number; onApps: Record<string, number> };
  legacy: { total: number; linked: number; noEmail: number }; appUsers: { total: number; generatedEmail: number }; devices: Record<string, number>; optedOut: number;
}
export interface SimulationRow { total: number; sendable: number; already: number; noEmail: number; optedOut: number; dailyCap: number; daysFirstEmail: number; sample: { name: string; email: string }[] }
export interface EtabTriage {
  total: number; classifiable: number; unknown: number; counts: { residences: number; espaces: number; les_deux: number };
  samples: { name: string; result: string; furnished: number; event: number; onApp: boolean }[]; autoApplied: number; answered: number;
}
export interface JourneyMessage { id: string; step: number; channel: JourneyChannel; subject: string; status: string; error: string | null; sentAt: string | null; openedAt: string | null; clickedAt: string | null }
export interface JourneyPerson {
  id: string; journeyKey: string; accountId: string; name: string; phone: string; whatsapp: string; address: string | null; source: string; status: string; stage: string; stepsSent: number;
  nextAt: string | null; lastSentAt: string | null; openedAt: string | null; clickedAt: string | null; connectedAt: string | null; subscribedAt: string | null; firstUseAt: string | null;
  ascendedAt: string | null; advocateAt: string | null; promoterAt: string | null; messages: JourneyMessage[];
}
export interface JourneyCall { id: string; journeyKey: string; name: string; phone: string; whatsapp: string; hot: boolean; clickedAt: string | null; callOutcome: string | null; callNote: string | null; calledAt: string | null; calledBy: string | null }
export interface CorrectionContact {
  id: string; name: string; email: string | null; emailState: string; phone: string; whatsapp: string; accountType: string; accountSubtype: string | null;
  oldSiteEmail: string | null; pending: { newEmail: string; createdAt: string } | null;
}
export interface CorrectionHistory { id: string; accountId: string; name: string; oldEmail: string | null; newEmail: string; status: string; requestedBy: string | null; note: string | null; createdAt: string; confirmedAt: string | null }
export interface Paged<T> { total: number; page: number; pages: number; items: T[] }
type Result<T = unknown> = { ok: boolean; error?: string; data?: T };

const BASE = "/site/admin/journeys";
const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Action impossible.";
const done = () => revalidatePath("/admin/centre-marketing/parcours");
const qs = (q: Record<string, string | undefined>) => new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]).toString();
const read = async <T,>(path: string): Promise<T | null> => { const r = await authedFetch(path, { method: "GET" }); return r.ok ? r.data : null; };
const post = async <T,>(path: string, body: unknown, method = "POST"): Promise<Result<T>> => {
  const r = await authedFetch(path, { method, body: JSON.stringify(body) });
  if (r.ok) done();
  return r.ok ? { ok: true, data: r.data } : { ok: false, error: err(r.data) };
};

export async function getJourneyOverview() { return read<JourneyOverview>(BASE); }
export async function getJourneyDiagnostic() { return read<JourneyDiagnostic>(`${BASE}/diagnostic`); }
export async function getJourneySimulation() { return read<Record<string, SimulationRow>>(`${BASE}/simulation`); }
export async function getEtabTriage() { return read<EtabTriage>(`${BASE}/triage`); }
export async function applyTriageAction(confirm: string) { return post<{ applied: number }>(`${BASE}/triage/apply`, { confirm }); }
export async function undoTriageAction() { return post<{ undone: number; kept: number }>(`${BASE}/triage/undo`, {}); }
export async function getJourneyPeople(q: Record<string, string | undefined>) { return read<Paged<JourneyPerson>>(`${BASE}/people?${qs(q)}`); }
export async function getJourneyCalls(q: Record<string, string | undefined>) { return read<Paged<JourneyCall>>(`${BASE}/calls?${qs(q)}`); }
export async function saveCallAction(id: string, outcome: string, note: string) { return post(`${BASE}/entries/${id}/call`, { outcome, note }); }
export async function getCorrectionContacts(q: Record<string, string | undefined>) { return read<Paged<CorrectionContact>>(`/site/admin/email-corrections/contacts?${qs(q)}`); }
export async function getCorrectionHistory() { return read<CorrectionHistory[]>("/site/admin/email-corrections/history"); }

export async function saveJourneyAction(j: Pick<Journey, "key" | "enabled" | "backfill" | "audiences" | "dailyCap" | "paidCap" | "gapDays" | "steps">, confirm: string) { return post(`${BASE}/${j.key}`, { ...j, confirm }, "PUT"); }
export async function previewJourneyAction(key: string, step: number, steps: JourneyStep[]) { return post<{ subject: string; html: string }>(`${BASE}/${key}/preview`, { step, steps }); }
export async function testJourneyAction(key: string, step: number, steps: JourneyStep[], to: string) {
  const r = await post<{ ok: boolean; error?: string }>(`${BASE}/${key}/test`, { step, steps, to });
  return r.ok && r.data?.ok === false ? { ok: false, error: r.data.error } : r;
}
export async function journeyEntryAction(id: string, action: string, value?: boolean) { return post(`${BASE}/entries/${id}/action`, { action, value }); }
export async function requestCorrectionAction(accountId: string, newEmail: string) { return post("/site/admin/email-corrections", { accountId, newEmail }); }
export async function cancelCorrectionAction(id: string) { return post(`/site/admin/email-corrections/${id}/cancel`, {}); }
