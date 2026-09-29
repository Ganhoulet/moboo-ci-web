"use server";

import { authedFetch } from "@/lib/server-api";

// Double authentification du compte connecté (Mon profil, back-office).
export interface TwoFactorStatus {
  offered: boolean; required: boolean; allowTotp: boolean; allowEmail: boolean;
  enabled: boolean; totp: boolean; email: boolean; emailAddress: string | null; backupRemaining: number;
}
type R<T = any> = { ok: boolean; error?: string; data?: T };

const msg = (d: any, f: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || f;
async function call<T>(path: string, body?: unknown, method = "POST"): Promise<R<T>> {
  try {
    const r = await authedFetch(path, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
    return r.ok ? { ok: true, data: r.data as T } : { ok: false, error: msg(r.data, "Action impossible. Réessayez.") };
  } catch {
    return { ok: false, error: "Service indisponible. Réessayez plus tard." };
  }
}

export async function twoFactorStatusAction() { return call<TwoFactorStatus>("/site/auth/2fa", undefined, "GET"); }
export async function totpSetupAction() { return call<{ secret: string; otpauthUrl: string; qr: string }>("/site/auth/2fa/totp/setup", {}); }
export async function totpEnableAction(code: string) { return call<{ backupCodes: string[] | null; status: TwoFactorStatus }>("/site/auth/2fa/totp/enable", { code }); }
export async function emailCodeAction(purpose: "setup" | "manage") { return call<{ email: string }>(`/site/auth/2fa/email/${purpose}/send`, {}); }
export async function emailEnableAction(code: string) { return call<{ backupCodes: string[] | null; status: TwoFactorStatus }>("/site/auth/2fa/email/enable", { code }); }
export async function disableTwoFactorAction(target: "totp" | "email", method: "totp" | "email" | "backup", code: string) {
  return call<TwoFactorStatus>(`/site/auth/2fa/${target}/disable`, { method, code });
}
export async function regenerateBackupAction(method: "totp" | "email" | "backup", code: string) {
  return call<{ backupCodes: string[] }>("/site/auth/2fa/backup", { method, code });
}
