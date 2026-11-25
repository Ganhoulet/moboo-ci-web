"use server";

import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";

export interface SupportThread {
  id: string; subject: string; status: string;
  client: { name: string } | null;
  manager: { name: string; avatarUrl: string | null } | null;
  messages: { id: string; staff: boolean; body: string; file: string | null; at: string }[];
}
type R = { ok: true; thread: SupportThread } | { ok: false; error: string };
const msg = (d: any, fb: string) => (typeof d?.message === "string" ? d.message : typeof d?.error?.message === "string" ? d.error.message : fb);

/** Lien support (sans connexion) : le jeton signé identifie la demande. */
export async function getSupportThread(token: string): Promise<SupportThread | null> {
  const r = await fetch(`${API_URL}/site/support-link/${encodeURIComponent(token)}`, { cache: "no-store", headers: { Accept: "application/json", ...relayHeaders(true) } }).catch(() => null);
  return r?.ok ? ((await r.json()) as SupportThread) : null;
}

export async function sendSupportMessage(token: string, message: string): Promise<R> {
  const r = await fetch(`${API_URL}/site/support-link/${encodeURIComponent(token)}/messages`, {
    method: "POST", cache: "no-store", headers: { "Content-Type": "application/json", Accept: "application/json", ...relayHeaders(true) }, body: JSON.stringify({ message }),
  }).catch(() => null);
  const d = r ? await r.json().catch(() => null) : null;
  return r?.ok ? { ok: true, thread: d } : { ok: false, error: msg(d, "Envoi impossible, réessayez.") };
}

export async function sendSupportFile(token: string, form: FormData): Promise<R> {
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return { ok: false, error: "Choisissez une capture d’écran." };
  if (file.size > 8 * 1024 * 1024) return { ok: false, error: "Fichier trop lourd (8 Mo maximum)." };
  const body = new FormData();
  body.append("file", file, file.name || "capture.jpg");
  body.append("caption", String(form.get("caption") ?? ""));
  const r = await fetch(`${API_URL}/site/support-link/${encodeURIComponent(token)}/file`, { method: "POST", cache: "no-store", headers: { Accept: "application/json", ...relayHeaders(true) }, body }).catch(() => null);
  const d = r ? await r.json().catch(() => null) : null;
  return r?.ok ? { ok: true, thread: d } : { ok: false, error: msg(d, "Envoi de la capture impossible, réessayez.") };
}
