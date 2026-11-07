"use server";

import { authedFetch } from "@/lib/server-api";

/** Onglet « Publier une annonce » : les 5 écrans du lien de publication rapide, pour un membre connecté. */
const err = (d: any, fb: string) => (Array.isArray(d?.message) ? d.message[0] : d?.message) || d?.error?.message || fb;

export async function getQuickMemberPage() {
  const { ok, data } = await authedFetch("/site/quick-member", { method: "GET" });
  return ok ? data : null;
}

export async function quickMemberUploadAction(image: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const { ok, data } = await authedFetch("/site/quick-member/upload", { method: "POST", body: JSON.stringify({ image }) });
  return ok ? { ok: true, url: data.url } : { ok: false, error: err(data, "Envoi de la photo impossible.") };
}

export async function quickMemberExtractAction(text: string): Promise<{ ok: boolean; fields?: any; error?: string }> {
  const { ok, data } = await authedFetch("/site/quick-member/extract", { method: "POST", body: JSON.stringify({ text }) });
  return ok ? { ok: true, fields: data.fields } : { ok: false, error: err(data, "Lecture du message impossible : remplissez à la main.") };
}

export async function quickMemberPublishAction(input: { listing: Record<string, unknown>; photos: string[] }) {
  const { ok, data } = await authedFetch("/site/quick-member/publish", { method: "POST", body: JSON.stringify(input) });
  return ok ? { ok: true as const, data } : { ok: false as const, error: err(data, "Publication impossible. Réessayez.") };
}
