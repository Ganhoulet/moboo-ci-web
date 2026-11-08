"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteDocumentAction, duplicateDocumentAction } from "@/app/admin/documents/actions";

/** Nouvelle édition, copie et suppression, depuis la liste des documents. */
export function DocumentListActions({ id, title, edition }: { id: string; title: string; edition: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const dup = (mode: "edition" | "copy") => start(async () => {
    const r = await duplicateDocumentAction(id, mode);
    if (r.ok && r.id) router.push(`/admin/documents/${r.id}`); else setError(r.error ?? "Erreur.");
  });
  const a = "font-semibold text-brand-700 hover:underline disabled:opacity-40";
  return (
    <span className="flex flex-wrap justify-end gap-x-3 gap-y-1 text-sm">
      <button type="button" disabled={pending} className={a} onClick={() => dup("edition")}>Édition n° {edition + 1}</button>
      <button type="button" disabled={pending} className={a} onClick={() => dup("copy")}>Copier</button>
      <button type="button" disabled={pending} className="font-semibold text-red-600 hover:underline disabled:opacity-40" onClick={() => { if (confirm(`Supprimer « ${title} » ?`)) start(async () => { const r = await deleteDocumentAction(id); if (r.ok) router.refresh(); else setError(r.error ?? "Erreur."); }); }}>Supprimer</button>
      {error ? <span role="alert" className="w-full text-right text-xs text-red-600">{error}</span> : null}
    </span>
  );
}
