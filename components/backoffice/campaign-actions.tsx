"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelCampaignAction, deleteCampaignAction, duplicateCampaignAction } from "@/app/admin/centre-marketing/campagnes/actions";

/** Boutons d'une campagne : annuler, dupliquer, supprimer. */
export function CampaignActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const btn = "rounded-md px-3 py-1.5 text-sm font-semibold ring-1 disabled:opacity-50";
  return (
    <div className="flex flex-wrap gap-2">
      {status === "scheduled" || status === "sending" ? (
        <button disabled={pending} onClick={() => confirm("Arrêter cette campagne ? Les messages déjà partis ne sont pas rappelés.") && start(async () => { await cancelCampaignAction(id); router.refresh(); })}
          className={btn + " text-red-700 ring-red-200 hover:bg-red-50"}>{status === "sending" ? "Arrêter l’envoi" : "Annuler la programmation"}</button>
      ) : null}
      <button disabled={pending} onClick={() => start(async () => { const r = await duplicateCampaignAction(id); if (r.id) router.push(`/admin/centre-marketing/campagnes/${r.id}`); })}
        className={btn + " bg-white ring-slate-300 hover:bg-slate-50"}>Dupliquer</button>
      {status === "draft" || status === "scheduled" ? (
        <button disabled={pending} onClick={() => confirm("Supprimer cette campagne ?") && start(async () => { const r = await deleteCampaignAction(id); if (r.ok) router.push("/admin/centre-marketing/campagnes"); })}
          className={btn + " text-red-700 ring-red-200 hover:bg-red-50"}>Supprimer</button>
      ) : null}
    </div>
  );
}
