// Accès assisté (account manager dans le compte d'un client, avec son accord).
// La session de l'account manager est mise de côté pendant l'accès, puis restaurée.
import { cookies } from "next/headers";
import type { SiteAccount } from "./api";

export const ASSIST = "moboo_assist";
const STASH = { at: "moboo_am_at", rt: "moboo_am_rt", profile: "moboo_am_profile" };
const base = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" };

export interface AssistInfo { id: string; accountId: string; name: string; endsAt: string }

export function getAssist(): AssistInfo | null {
  const raw = cookies().get(ASSIST)?.value;
  if (!raw) return null;
  try { return JSON.parse(raw) as AssistInfo; } catch { return null; }
}

export function hasStash() {
  return !!cookies().get(STASH.at)?.value;
}

/** Ouvre l'accès : session de l'account manager mise de côté, session du client (sans renouvellement). */
export function startAssist(token: { accessToken: string; expiresIn: number }, account: SiteAccount, info: AssistInfo) {
  const jar = cookies();
  const keep = (from: string, to: string) => { const v = jar.get(from)?.value; if (v) jar.set(to, v, { ...base, maxAge: 60 * 60 * 6 }); };
  keep("moboo_at", STASH.at); keep("moboo_rt", STASH.rt); keep("moboo_profile", STASH.profile);
  jar.delete("moboo_rt");
  jar.set("moboo_at", token.accessToken, { ...base, maxAge: token.expiresIn });
  jar.set("moboo_profile", JSON.stringify(account), { ...base, maxAge: token.expiresIn });
  jar.set(ASSIST, JSON.stringify(info), { ...base, maxAge: token.expiresIn });
}

/** Fin de l'accès : la session de l'account manager revient. */
export function restoreStash() {
  const jar = cookies();
  const back = (from: string, to: string) => { const v = jar.get(from)?.value; if (v) jar.set(to, v, { ...base, maxAge: 60 * 60 * 24 * 30 }); else jar.delete(to); jar.delete(from); };
  back(STASH.at, "moboo_at"); back(STASH.rt, "moboo_rt"); back(STASH.profile, "moboo_profile");
  jar.delete(ASSIST);
}
