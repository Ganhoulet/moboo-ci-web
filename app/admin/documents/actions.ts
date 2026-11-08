"use server";

import { revalidatePath } from "next/cache";
import { authedFetch } from "@/lib/server-api";
import { blankDoc, TEMPLATES } from "@/lib/documents/templates";
import type { DocData, DocFormat, DocFull, DocKind, DocMeta, DocRow } from "@/lib/documents/types";

const err = (d: any) => (Array.isArray(d?.error?.message) ? d.error.message.join(" ") : d?.error?.message ?? d?.message) || "Action impossible.";
const BASE = "/site/admin/documents";

export async function listDocuments(): Promise<DocRow[] | null> {
  const r = await authedFetch(BASE, { method: "GET" });
  return r.ok ? r.data.items : null;
}
export async function getDocument(id: string): Promise<DocFull | null> {
  const r = await authedFetch(`${BASE}/${encodeURIComponent(id)}`, { method: "GET" });
  return r.ok ? r.data : null;
}

/** Crée un document depuis une page blanche ou un modèle ; renvoie son identifiant. */
export async function createDocumentAction(input: { template?: string; title?: string; kind?: DocKind; format?: DocFormat }): Promise<{ ok: boolean; id?: string; error?: string }> {
  const tpl = TEMPLATES.find((t) => t.key === input.template);
  const body = {
    title: input.title?.trim() || tpl?.title || "Nouveau document", kind: input.kind ?? tpl?.kind ?? "autre", format: input.format ?? tpl?.format ?? "A4",
    edition: 1, editionDate: new Date().toLocaleDateString("fr-FR", { month: "long", year: "numeric", timeZone: "Africa/Abidjan" }),
    status: "draft", template: tpl?.key ?? null, data: tpl ? tpl.build() : blankDoc(),
  };
  const r = await authedFetch(BASE, { method: "POST", body: JSON.stringify(body) });
  if (r.ok) revalidatePath("/admin/documents");
  return r.ok ? { ok: true, id: r.data.id } : { ok: false, error: err(r.data) };
}

export async function saveDocumentAction(id: string, meta: DocMeta, data: DocData): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`${BASE}/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify({ ...meta, data }) });
  return r.ok ? { ok: true } : { ok: false, error: err(r.data) };
}

/** « edition » : édition suivante en brouillon ; « copy » : simple copie. */
export async function duplicateDocumentAction(id: string, mode: "edition" | "copy"): Promise<{ ok: boolean; id?: string; error?: string }> {
  const r = await authedFetch(`${BASE}/${encodeURIComponent(id)}/duplicate`, { method: "POST", body: JSON.stringify({ mode }) });
  if (r.ok) revalidatePath("/admin/documents");
  return r.ok ? { ok: true, id: r.data.id } : { ok: false, error: err(r.data) };
}

export async function deleteDocumentAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const r = await authedFetch(`${BASE}/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (r.ok) revalidatePath("/admin/documents");
  return r.ok ? { ok: true } : { ok: false, error: err(r.data) };
}

export async function uploadDocImageAction(dataUri: string): Promise<{ ok: boolean; url?: string; error?: string }> {
  const r = await authedFetch("/site/me/uploads", { method: "POST", body: JSON.stringify({ image: dataUri, kind: "document" }) });
  return r.ok ? { ok: true, url: r.data.url } : { ok: false, error: err(r.data) };
}
