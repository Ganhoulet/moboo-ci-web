"use server";

import { redirect } from "next/navigation";
import { apiPost } from "@/lib/api";
import { setSession } from "@/lib/session";

/** Nouveau mot de passe depuis le lien envoyé avec un conseiller Moboo : le client est connecté. */
export async function recoverAction(token: string, password: string, confirm: string): Promise<{ ok: boolean; error?: string }> {
  if (password.length < 8) return { ok: false, error: "8 caractères minimum." };
  if (password !== confirm) return { ok: false, error: "Les deux mots de passe ne sont pas identiques." };
  const { ok, data } = await apiPost<any>("/site/auth/recover", { token, password });
  if (!ok || !data?.accessToken) return { ok: false, error: typeof data?.error?.message === "string" ? data.error.message : data?.message ?? "Lien expiré : demandez-en un nouveau à votre conseiller Moboo." };
  setSession(data, data.account);
  redirect("/mon-espace?mdp=1");
}
