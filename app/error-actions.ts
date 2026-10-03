"use server";

import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";
import "@/lib/client-ip";

/** Erreur affichée à un visiteur → back-office « Santé du site » (+ alerte e-mail à la 1re occurrence). */
export async function reportErrorAction(input: { message?: string; digest?: string; path?: string; stack?: string }) {
  try {
    await fetch(`${API_URL}/site/errors`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...relayHeaders(true) },
      body: JSON.stringify({ ...input, version: (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || undefined }),
      cache: "no-store",
    });
  } catch {
    /* surveillance facultative */
  }
}
