"use server";

import { API_URL } from "@/lib/api";
import { relayHeaders } from "@/lib/relay";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";

/** Lien de publication rapide (groupes WhatsApp) : page publique, photos et IA sans compte. */
const err = (d: any, fb: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || d?.error?.message || fb;

async function pub(path: string, init: RequestInit = {}) {
  try {
    const res = await fetch(`${API_URL}/site/quick/${path}`, { ...init, headers: { "Content-Type": "application/json", Accept: "application/json", ...relayHeaders(true), ...(init.headers ?? {}) }, cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { message: "Service indisponible. Réessayez." } };
  }
}

export async function getQuickPage(slug: string) {
  const r = await pub(encodeURIComponent(slug));
  return r.ok ? r.data : null;
}

export async function quickUploadAction(slug: string, image: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const r = await pub(`${encodeURIComponent(slug)}/upload`, { method: "POST", body: JSON.stringify({ image }) });
  return r.ok ? { ok: true, url: r.data.url } : { ok: false, error: err(r.data, "Envoi de la photo impossible.") };
}

export async function quickExtractAction(slug: string, text: string): Promise<{ ok: boolean; fields?: any; error?: string }> {
  const r = await pub(`${encodeURIComponent(slug)}/extract`, { method: "POST", body: JSON.stringify({ text }) });
  return r.ok ? { ok: true, fields: r.data.fields } : { ok: false, error: err(r.data, "Lecture du message impossible : remplissez à la main.") };
}

export async function quickPublishAction(slug: string, input: { listing: Record<string, unknown>; photos: string[] }) {
  if (!getSession()) return { ok: false as const, error: "Connectez-vous d'abord." };
  const { ok, data } = await authedFetch(`/site/quick/${encodeURIComponent(slug)}/publish`, { method: "POST", body: JSON.stringify(input) });
  return ok ? { ok: true as const, data } : { ok: false as const, error: err(data, "Publication impossible. Réessayez.") };
}
