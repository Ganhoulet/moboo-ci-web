"use server";

import { authedFetch } from "@/lib/server-api";

export interface LoginTestResult {
  error?: string;
  mobooCi?: { account: { foundBy: string | null; hasPassword: boolean; active: boolean } | null; sitePasswordMatches: boolean | null; legacyPasswordMatches: boolean; legacyLogin: string | null; legacyLinkedToSameAccount: boolean; lockedNow: boolean; failuresCounted: number; result: string };
  mobooPro?: string;
}

/** Test de connexion : le mot de passe part à l'API (HTTPS), n'est ni enregistré ni renvoyé. */
export async function loginTestAction(identifier: string, password: string): Promise<LoginTestResult> {
  const { ok, data } = await authedFetch("/site/admin/login-test", { method: "POST", body: JSON.stringify({ identifier, password }) });
  return ok ? (data as LoginTestResult) : { error: (data as any)?.message ?? "Test indisponible." };
}
