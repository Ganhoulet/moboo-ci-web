"use client";

import { useState, useTransition } from "react";
import { importAgencyLinksAction } from "@/app/admin/immobilier/actions";

/** Bouton « Reprendre les équipes de moboo.ci » (agent → agence, données WordPress déjà importées). */
export function AgencyLinksImport() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const run = () => start(async () => {
    const r = await importAgencyLinksAction();
    if (!r.ok || !r.data) return setMsg(r.error ?? "Reprise impossible.");
    const d = r.data;
    setMsg(d.total
      ? `${d.linked} agent(s) relié(s), ${d.already} déjà relié(s)` +
        (d.otherAgency ? `, ${d.otherAgency} déjà dans une autre agence` : "") +
        (d.agencyMissing ? `, ${d.agencyMissing} sans compte d’agence sur le site` : "") +
        (d.agencyNotCompany ? `, ${d.agencyNotCompany} dont l’agence n’est pas un compte « Agence »` : "") + "."
      : "Aucun lien agent → agence dans les comptes repris de moboo.ci (l’extension de migration ne les a pas envoyés).");
  });
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 text-sm ring-1 ring-slate-200">
      <button type="button" onClick={run} disabled={pending} className="rounded-md bg-brand-800 px-4 py-2 font-semibold text-white disabled:opacity-50">
        {pending ? "Reprise…" : "Reprendre les équipes de moboo.ci"}
      </button>
      <span className="text-muted">{msg ?? "Relie chaque agent repris de WordPress à son agence, dans « Mon équipe ». Sans doublon, rejouable."}</span>
    </div>
  );
}
