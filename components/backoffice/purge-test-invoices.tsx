"use client";

import { useTransition } from "react";
import { purgeTestInvoicesAction } from "@/app/admin/immobilier/actions";

/** Back-office → Factures : effacer les essais du mode test. */
export function PurgeTestInvoices() {
  const [pending, start] = useTransition();
  return (
    <button type="button" disabled={pending}
      onClick={() => { if (confirm("Supprimer toutes les factures de test et les forfaits activés par ces tests ?")) start(async () => { const r = await purgeTestInvoicesAction(); if (!r.ok) alert(r.error); }); }}
      className="ml-auto rounded-md bg-white px-3 py-1.5 text-xs font-bold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60">
      {pending ? "Suppression…" : "Supprimer les factures de test"}
    </button>
  );
}
