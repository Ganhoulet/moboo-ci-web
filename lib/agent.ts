// Espace agent — session serveur (cookies httpOnly) + appels authentifiés.
// Utilisé par des server components / server actions uniquement.
import { cookies } from "next/headers";
import { API_URL } from "./api";

const AT = "moboo_agent_at";
const PROFILE = "moboo_agent";

const baseCookie = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

export interface AgentProfile {
  id: string;
  mobooId: number;
  name: string;
  kind: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
}

export function setAgentSession(token: string, agent: AgentProfile) {
  const jar = cookies();
  jar.set(AT, token, { ...baseCookie, maxAge: 60 * 60 * 8 });
  jar.set(PROFILE, JSON.stringify(agent), { ...baseCookie, maxAge: 60 * 60 * 8 });
}

export function clearAgentSession() {
  const jar = cookies();
  jar.delete(AT);
  jar.delete(PROFILE);
}

export function getAgent(): AgentProfile | null {
  const raw = cookies().get(PROFILE)?.value;
  if (!raw) return null;
  try { return JSON.parse(raw) as AgentProfile; } catch { return null; }
}

export function getAgentToken(): string | null {
  return cookies().get(AT)?.value ?? null;
}

/** GET authentifié à l'espace agent. Retourne les données ou null (session expirée). */
export async function agentGet<T>(path: string): Promise<T | null> {
  const token = getAgentToken();
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}${path}`, {
      headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
