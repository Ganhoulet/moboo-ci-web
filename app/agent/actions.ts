"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { API_URL } from "@/lib/api";
import { setAgentSession, clearAgentSession, type AgentProfile } from "@/lib/agent";

export type AgentLoginState = { ok: boolean; message: string } | null;

export async function agentLoginAction(_prev: AgentLoginState, formData: FormData): Promise<AgentLoginState> {
  const login = String(formData.get("login") || "").trim();
  const password = String(formData.get("password") || "");
  if (!login || !password) return { ok: false, message: "Entrez votre identifiant et mot de passe moboo.ci." };

  try {
    const res = await fetch(`${API_URL}/marketplace/agent/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ login, password }),
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data?.accessToken) {
      return { ok: false, message: data?.message || "Identifiants incorrects." };
    }
    setAgentSession(data.accessToken, data.agent as AgentProfile);
  } catch {
    return { ok: false, message: "Service indisponible. Réessayez plus tard." };
  }
  revalidatePath("/agent");
  redirect("/agent");
}

export async function agentLogoutAction() {
  clearAgentSession();
  redirect("/agent/login");
}
