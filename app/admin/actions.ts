"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { SETTINGS_TAG } from "@/lib/settings";

const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export type FieldType = "bool" | "number" | "text" | "textarea" | "url" | "image" | "enum" | "multi";

export interface SettingField {
  key: string; label: string; help?: string; type: FieldType;
  default: string | number | boolean | string[];
  min?: number; max?: number; maxLength?: number;
  options?: { value: string; label: string }[];
  public?: boolean; group?: string;
}

export interface SettingSection { id: string; label: string; icon: string; description?: string; fields: SettingField[] }

export interface AdminSettings {
  schema: SettingSection[];
  values: Record<string, Record<string, unknown>>;
  updated: { section: string; updatedAt: string; updatedBy: string | null }[];
}

export async function getAdminSettings(): Promise<AdminSettings | null> {
  const { ok, data } = await authedFetch("/site/admin/settings", { method: "GET" });
  return ok ? (data as AdminSettings) : null;
}

export async function getOverview(): Promise<Record<string, number> | null> {
  const { ok, data } = await authedFetch("/site/admin/overview", { method: "GET" });
  return ok ? data : null;
}

/** Le site public relit les réglages tout de suite (cache vidé). */
function refreshSite() {
  revalidateTag(SETTINGS_TAG);
  revalidatePath("/", "layout");
}

export async function saveSettingsAction(section: string, values: Record<string, unknown>): Promise<{ ok: boolean; values?: Record<string, unknown>; error?: string }> {
  const { ok, data } = await authedFetch(`/site/admin/settings/${encodeURIComponent(section)}`, {
    method: "PUT",
    body: JSON.stringify({ values }),
  });
  if (!ok) return { ok: false, error: errMsg(data, "Enregistrement impossible.") };
  refreshSite();
  return { ok: true, values: data };
}

export async function resetSectionAction(section: string): Promise<{ ok: boolean; values?: Record<string, unknown>; error?: string }> {
  const { ok, data } = await authedFetch(`/site/admin/settings/${encodeURIComponent(section)}`, { method: "DELETE" });
  if (!ok) return { ok: false, error: errMsg(data, "Réinitialisation impossible.") };
  refreshSite();
  return { ok: true, values: data };
}

export interface AdminUser { id: string; phone: string; firstName: string | null; lastName: string | null; email: string | null; fixed: boolean }

export async function listAdmins(): Promise<{ items: AdminUser[]; pendingPhones: string[] } | null> {
  const { ok, data } = await authedFetch("/site/admin/admins", { method: "GET" });
  return ok ? data : null;
}

export async function addAdminAction(phone: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch("/site/admin/admins", { method: "POST", body: JSON.stringify({ phone }) });
  if (ok) revalidatePath("/admin/administrateurs");
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Ajout impossible.") };
}

export async function removeAdminAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`/site/admin/admins/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (ok) revalidatePath("/admin/administrateurs");
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Retrait impossible.") };
}
