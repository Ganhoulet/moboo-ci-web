"use client";

import { useState, useTransition } from "react";
import { solvencyCode } from "@/app/admin/services/actions";

/** Sans SMS : génère un code à dicter au candidat (après avoir recueilli son accord par téléphone). */
export function SolvencyCodeButton({ ref_ }: { ref_: string }) {
  const [res, setRes] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (res) return <p className="mt-1 text-xs">{res}</p>;
  return (
    <button type="button" disabled={pending}
      onClick={() => { if (confirm("Appelez d’abord le candidat pour recueillir son accord. Générer un code à lui dicter ?")) start(async () => { const r = await solvencyCode(ref_); setRes(r.ok ? `Code : ${r.data?.code} (valable ${r.data?.ttlMin} min)` : r.error ?? "Erreur."); }); }}
      className="mt-1 rounded-md px-2 py-1 text-xs font-semibold ring-1 ring-slate-300 disabled:opacity-50">Générer un code</button>
  );
}
