"use server";

// Back-office : utilisateurs, modération, signalements, journal, rôles.
import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";

type R<T = unknown> = { ok: boolean; error?: string; data?: T };
const errMsg = (data: any, fallback: string) =>
  (Array.isArray(data?.message) ? data.message[0] : data?.message)
  || (Array.isArray(data?.error?.message) ? data.error.message[0] : data?.error?.message) || fallback;
const qs = (params: Record<string, string | undefined>) => {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
  return s ? `?${s}` : "";
};

async function get<T>(path: string): Promise<T | null> {
  const { ok, data } = await authedFetch(path, { method: "GET" });
  return ok ? (data as T) : null;
}

async function send<T = any>(path: string, method: string, body: unknown, fallback: string, revalidate?: string[]): Promise<R<T>> {
  const { ok, data } = await authedFetch(path, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
  if (!ok) return { ok: false, error: errMsg(data, fallback) };
  for (const p of revalidate ?? []) revalidatePath(p);
  return { ok: true, data };
}

/* ─── Utilisateurs ─────────────────────────────────────────────────────── */

export interface AdminUserRow {
  id: string; appId: number; name: string; phone: string; email: string | null; username: string | null; companyName: string | null;
  accountType: string; city: string | null; commune: string | null; avatarUrl: string | null; status: "active" | "suspended" | "banned";
  verified: boolean; isAdmin: boolean; twoFactor: boolean; createdAt: string; lastLoginAt: string | null; listings: number;
}
export interface AdminUserPage { total: number; page: number; perPage: number; counts: { status: Record<string, number>; type: Record<string, number> }; items: AdminUserRow[] }

export const listUsers = async (params: Record<string, string | undefined>) => get<AdminUserPage>(`/site/admin/users${qs(params)}`);
export const getUser = async (id: string) => get<any>(`/site/admin/users/${encodeURIComponent(id)}`);

const userPath = (id: string) => `/admin/utilisateurs/${id}`;
export const updateUserAction = async (id: string, patch: Record<string, unknown>) =>
  send(`/site/admin/users/${encodeURIComponent(id)}`, "PATCH", patch, "Modification impossible.", [userPath(id)]);
export const suspendUserAction = async (id: string, input: { reason: string; days?: number; until?: string; hideListings?: boolean }) =>
  send(`/site/admin/users/${encodeURIComponent(id)}/suspend`, "POST", input, "Suspension impossible.", [userPath(id), "/", "/admin/utilisateurs"]);
export const banUserAction = async (id: string, reason: string) =>
  send(`/site/admin/users/${encodeURIComponent(id)}/ban`, "POST", { reason }, "Bannissement impossible.", [userPath(id), "/", "/admin/utilisateurs"]);
export const reactivateUserAction = async (id: string) =>
  send<{ restored: number }>(`/site/admin/users/${encodeURIComponent(id)}/reactivate`, "POST", undefined, "Réactivation impossible.", [userPath(id), "/", "/admin/utilisateurs"]);
export const logoutUserAction = async (id: string, sessionId?: string) =>
  send<{ count: number }>(`/site/admin/users/${encodeURIComponent(id)}/logout`, "POST", { sessionId }, "Déconnexion impossible.", [userPath(id)]);
export const resetUser2faAction = async (id: string) =>
  send(`/site/admin/users/${encodeURIComponent(id)}/2fa`, "DELETE", undefined, "Réinitialisation impossible.", [userPath(id)]);
export const setUserVerifiedAction = async (id: string, verified: boolean) =>
  send(`/site/admin/users/${encodeURIComponent(id)}/verified`, "POST", { verified }, "Action impossible.", [userPath(id), "/"]);

/* ─── Notes internes ───────────────────────────────────────────────────── */

export interface AdminNote { id: string; body: string; authorId: string | null; authorName: string | null; createdAt: string }
export const addNoteAction = async (type: "account" | "listing", id: string, body: string) =>
  send<AdminNote>(`/site/admin/notes/${type}/${encodeURIComponent(id)}`, "POST", { body }, "Note non enregistrée.");
export const removeNoteAction = async (noteId: string) =>
  send(`/site/admin/notes/${encodeURIComponent(noteId)}`, "DELETE", undefined, "Suppression impossible.");

/* ─── Modération ───────────────────────────────────────────────────────── */

export interface ModerationSummary { mode: string; pending: number; changes: number; rejected: number; suspended: number; reports: number; rejectReasons: string[] }
export const getModerationSummary = async () => get<ModerationSummary>("/site/admin/moderation/summary");
export const getModerationQueue = async (params: Record<string, string | undefined>) => get<any>(`/site/admin/moderation/listings${qs(params)}`);
export const getReports = async (params: Record<string, string | undefined>) => get<any>(`/site/admin/moderation/reports${qs(params)}`);

export const decideListingAction = async (id: string, decision: "approve" | "reject" | "changes", note?: string) =>
  send(`/site/admin/moderation/listings/${encodeURIComponent(id)}`, "POST", { decision, note }, "Décision impossible.", ["/admin/moderation", "/"]);
export const bulkDecideAction = async (ids: string[], decision: "approve" | "reject" | "changes", note?: string) =>
  send<{ done: number }>("/site/admin/moderation/listings/bulk", "POST", { ids, decision, note }, "Décision impossible.", ["/admin/moderation", "/"]);
export const handleReportAction = async (id: string, input: { status: "resolved" | "dismissed"; resolution?: string; hideListing?: boolean; allOnTarget?: boolean }) =>
  send<{ count: number }>(`/site/admin/moderation/reports/${encodeURIComponent(id)}`, "PATCH", input, "Traitement impossible.", ["/admin/moderation", "/"]);

/* ─── Journal ──────────────────────────────────────────────────────────── */

export interface AuditRow { id: string; actorId: string | null; actorName: string | null; action: string; entityType: string | null; entityId: string | null; summary: string; changes: any; ip: string | null; createdAt: string }
export const getAudit = async (params: Record<string, string | undefined>) =>
  get<{ total: number; page: number; perPage: number; items: AuditRow[]; actors: { id: string; name: string; count: number }[]; entityTypes: { key: string; count: number }[] }>(`/site/admin/audit${qs(params)}`);

/* ─── Rôles ────────────────────────────────────────────────────────────── */

export interface RoleRow { key: string; name: string; description: string; permissions: string[]; builtin: boolean; members: number }
export interface PermissionDef { key: string; label: string; group: string }
export const getRoles = async () => get<{ roles: RoleRow[]; permissions: PermissionDef[] }>("/site/admin/roles");
export const createRoleAction = async (input: { name: string; description?: string; permissions: string[] }) =>
  send<RoleRow>("/site/admin/roles", "POST", input, "Création impossible.", ["/admin/roles"]);
export const updateRoleAction = async (key: string, input: { name?: string; description?: string; permissions?: string[] }) =>
  send(`/site/admin/roles/${encodeURIComponent(key)}`, "PUT", input, "Enregistrement impossible.", ["/admin/roles"]);
export const deleteRoleAction = async (key: string) =>
  send(`/site/admin/roles/${encodeURIComponent(key)}`, "DELETE", undefined, "Suppression impossible.", ["/admin/roles"]);
export const setAdminRoleAction = async (id: string, role: string) =>
  send(`/site/admin/admins/${encodeURIComponent(id)}/role`, "PUT", { role }, "Changement impossible.", ["/admin/administrateurs", "/admin/roles"]);

/* ─── Suppressions de compte ───────────────────────────────────────────── */

export interface DeletionRow { id: string; accountId: string | null; phone: string; email: string | null; scope: "site" | "app" | "pro"; reason: string | null; reasonLabel: string | null; details: string | null; status: string; scheduledAt: string | null; handledBy: string | null; handledAt: string | null; createdAt: string }
export const getDeletions = async (status?: string) => get<{ items: DeletionRow[]; counts: Record<string, number> }>(`/site/admin/deletions${qs({ status })}`);
export const markDeletionDoneAction = async (id: string) => send(`/site/admin/deletions/${encodeURIComponent(id)}/done`, "POST", undefined, "Action impossible.", ["/admin/utilisateurs/suppressions"]);
export const cancelUserDeletionAction = async (id: string) => send(`/site/admin/users/${encodeURIComponent(id)}/deletion/cancel`, "POST", undefined, "Annulation impossible.", [`/admin/utilisateurs/${id}`, "/admin/utilisateurs/suppressions"]);
export const purgeUserAction = async (id: string) => send(`/site/admin/users/${encodeURIComponent(id)}/deletion/purge`, "POST", undefined, "Suppression impossible.", [`/admin/utilisateurs/${id}`, "/admin/utilisateurs/suppressions"]);
