"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { SETTINGS_TAG } from "@/lib/settings";

const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;

export type FieldType = "bool" | "number" | "text" | "textarea" | "url" | "image" | "enum" | "multi" | "color" | "html" | "emails" | "visual" | "json";

export interface SettingField {
  key: string; label: string; help?: string; type: FieldType;
  default: string | number | boolean | string[];
  min?: number; max?: number; maxLength?: number;
  options?: { value: string; label: string }[];
  public?: boolean; group?: string;
}

export interface SettingSection {
  id: string; label: string; icon: string; description?: string; fields: SettingField[];
  /** Sous-rubrique (modèles d'e-mails sous « Gestion des emails »). */
  parent?: string;
  /** Réglée depuis une page dédiée (pas de rubrique dans le menu). */
  hidden?: boolean;
  email?: { placeholders: string[]; sample: Record<string, string>; admin: boolean };
}

export interface AdminSettings {
  schema: SettingSection[];
  values: Record<string, Record<string, unknown>>;
  updated: { section: string; updatedAt: string; updatedBy: string | null }[];
  smtpConfigured?: boolean;
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

export interface AdminUser { id: string; phone: string; firstName: string | null; lastName: string | null; email: string | null; fixed: boolean; twoFactor?: string[]; lastLoginAt?: string | null; role?: string | null; roleName?: string | null }

export async function listAdmins(): Promise<{ items: AdminUser[]; pendingPhones: string[]; roles: { key: string; name: string }[] } | null> {
  const { ok, data } = await authedFetch("/site/admin/admins", { method: "GET" });
  return ok ? data : null;
}

export async function addAdminAction(phone: string, role?: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch("/site/admin/admins", { method: "POST", body: JSON.stringify({ phone, role }) });
  if (ok) revalidatePath("/admin/administrateurs");
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Ajout impossible.") };
}

export async function removeAdminAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`/site/admin/admins/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (ok) revalidatePath("/admin/administrateurs");
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Retrait impossible.") };
}

export async function resetTwoFactorAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const { ok, data } = await authedFetch(`/site/admin/admins/${encodeURIComponent(id)}/2fa`, { method: "DELETE" });
  if (ok) revalidatePath("/admin/administrateurs");
  return ok ? { ok: true } : { ok: false, error: errMsg(data, "Réinitialisation impossible.") };
}

/* ─── Gestion des emails : aperçu et test ──────────────────────────────── */

export interface EmailPreviewInput {
  template: string;
  audience: "user" | "admin";
  section?: Record<string, unknown>;   // modèle en cours de modification
  emails?: Record<string, unknown>;    // mise en page en cours de modification
  to?: string;
}

export async function previewEmailAction(input: EmailPreviewInput): Promise<{ ok: boolean; subject?: string; html?: string; configured?: boolean; error?: string }> {
  const { ok, data } = await authedFetch("/site/admin/emails/preview", { method: "POST", body: JSON.stringify(input) });
  return ok ? { ok: true, subject: data.subject, html: data.html, configured: data.configured } : { ok: false, error: errMsg(data, "Aperçu indisponible.") };
}

export async function testEmailAction(input: EmailPreviewInput): Promise<{ ok: boolean; message: string }> {
  const { ok, data } = await authedFetch("/site/admin/emails/test", { method: "POST", body: JSON.stringify(input) });
  if (!ok) return { ok: false, message: errMsg(data, "Envoi impossible.") };
  if (!data?.configured) return { ok: false, message: data?.message || "Serveur d’e-mails non configuré." };
  return data.sent ? { ok: true, message: `E-mail de test envoyé à ${data.to}.` } : { ok: false, message: `L’envoi à ${data.to} a échoué (voir les journaux de l’API).` };
}
