"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createFicheAction } from "@/app/admin/fiches/actions";

export function NewFicheButton() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  return (
    <div className="text-right">
      <button type="button" disabled={pending} onClick={() => start(async () => {
        const r = await createFicheAction();
        if (r.ok && r.id) router.push(`/admin/fiches/${r.id}`); else setError(r.error ?? "Création impossible.");
      })} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">{pending ? "Création…" : "Nouvelle fiche"}</button>
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
