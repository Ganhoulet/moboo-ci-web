"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

export interface NudgeRule {
  key: string; name: string; trigger: string; delayLabel: string; target: string; enabled: boolean; delayDays: number; cooldownDays: number;
  channels: string[]; accountTypes: string[]; subject: string; body: string; ctaLabel: string; smsBody: string; waTemplate: string; waVars: string[];
  updatedAt: string; updatedBy: string | null; defaults: { subject: string; body: string; ctaLabel: string; smsBody: string; waTemplate: string; waVars: string[] };
}
export interface NudgeOverview {
  pros: number; segments: { actif: number; inactif: number; sans_annonce: number }; expiring: number; pending: number;
  last30: { sent: number; clicked: number; converted: number }; byRule: Record<string, { sent: number; converted: number }>;
  rules: NudgeRule[]; variables: Record<string, string>; channels: Record<string, boolean>; gapDays: number; conversionDays: number;
}
export interface ProRow {
  id: string; name: string; type: string; typeLabel: string; phone: string; email: string | null; zone: string; verified: boolean;
  createdAt: string; lastLoginAt: string | null; segment: string; active: number; total: number; lastListingAt: string | null;
  expiring: number; views30: number; inquiries30: number; pending: number; zoneSearches: number; lastNudgeAt: string | null;
}
export interface NudgeRow {
  id: string; accountId: string; name: string; ruleKey: string; channels: string[]; subject: string; target: string; status: string;
  error: string | null; createdBy: string | null; sentAt: string | null; clickedAt: string | null; convertedAt: string | null; createdAt: string;
}
export interface ManualNudge {
  accountIds: string[]; ruleKey?: string; channels: string[]; subject?: string; body?: string; smsBody?: string; ctaLabel?: string; target?: string; waTemplate?: string; waVars?: string[];
}

const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Action impossible.";
const done = () => revalidatePath("/admin/centre-marketing/relances");

export async function getNudgeOverview(): Promise<NudgeOverview | null> {
  const r = await authedFetch("/site/admin/nudges", { method: "GET" });
  return r.ok ? r.data : null;
}
export async function listPros(q: { segment?: string; search?: string; type?: string; page?: string }): Promise<{ total: number; page: number; pages: number; items: ProRow[] } | null> {
  const p = new URLSearchParams(Object.entries(q).filter(([, v]) => v) as [string, string][]);
  const r = await authedFetch(`/site/admin/nudges/pros?${p}`, { method: "GET" });
  return r.ok ? r.data : null;
}
export async function listNudges(accountId?: string): Promise<NudgeRow[]> {
  const r = await authedFetch(`/site/admin/nudges/history${accountId ? `?accountId=${encodeURIComponent(accountId)}` : ""}`, { method: "GET" });
  return r.ok ? r.data.items : [];
}
export async function saveRuleAction(rule: NudgeRule): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`/site/admin/nudges/rules/${encodeURIComponent(rule.key)}`, { method: "PUT", body: JSON.stringify(rule) });
  if (r.ok) done();
  return r.ok ? { ok: true } : { ok: false, error: err(r.data) };
}
export async function runNudgesAction(dryRun: boolean): Promise<{ ok: boolean; error?: string; data?: { queued: number; rules: Record<string, { eligible: number; queued: number; sample: { id: string; name: string; zone: string }[] }> } }> {
  const r = await authedFetch("/site/admin/nudges/run", { method: "POST", body: JSON.stringify({ dryRun }) });
  if (r.ok && !dryRun) done();
  return r.ok ? { ok: true, data: r.data } : { ok: false, error: err(r.data) };
}
export async function previewNudgeAction(body: ManualNudge & { accountId: string }): Promise<{ ok: boolean; error?: string; data?: { subject: string; body: string; sms: string; ctaLabel: string; target: string } }> {
  const r = await authedFetch("/site/admin/nudges/preview", { method: "POST", body: JSON.stringify(body) });
  return r.ok ? { ok: true, data: r.data } : { ok: false, error: err(r.data) };
}
export async function sendNudgeAction(body: ManualNudge): Promise<{ ok: boolean; error?: string; queued?: number }> {
  const r = await authedFetch("/site/admin/nudges/send", { method: "POST", body: JSON.stringify(body) });
  if (r.ok) done();
  return r.ok ? { ok: true, queued: r.data.queued } : { ok: false, error: err(r.data) };
}
export async function testNudgeAction(body: Partial<NudgeRule> & { ruleKey?: string; to: string; accountId?: string; testChannel?: string; target?: string }): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch("/site/admin/nudges/test", { method: "POST", body: JSON.stringify(body) });
  return r.ok ? r.data : { ok: false, error: err(r.data) };
}
