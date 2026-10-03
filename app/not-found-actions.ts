"use server";

import { headers } from "next/headers";
import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";
import "@/lib/client-ip";

/** Journal des 404 (back-office → Redirections et 404). Appelé seulement quand la page 404 est affichée. */
export async function log404Action(path: string, referrer?: string) {
  if (!path.startsWith("/") || path.startsWith("/admin")) return;
  try {
    await fetch(`${API_URL}/site/404`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...relayHeaders(true) },
      body: JSON.stringify({ path: path.slice(0, 500), referrer: referrer?.slice(0, 300) || undefined, userAgent: headers().get("user-agent") ?? undefined }),
      cache: "no-store",
    });
  } catch {
    /* journal facultatif */
  }
}
