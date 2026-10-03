"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cancelUserDeletionAction, markDeletionDoneAction, purgeUserAction } from "@/app/admin/backoffice-actions";

type Act = () => Promise<{ ok: boolean; error?: string }>;

function useAct() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const run = (fn: Act, question?: string) => (!question || window.confirm(question)) && start(async () => {
    const r = await fn();
    if (r.ok) { setErr(null); router.refresh(); } else setErr(r.error ?? "Action impossible.");
  });
  return { pending, err, run };
}

/** Fiche utilisateur : compte en cours de suppression. */
export function UserDeletionActions({ id, canPurge }: { id: string; canPurge: boolean }) {
  const { pending, err, run } = useAct();
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <button type="button" disabled={pending} onClick={() => run(() => cancelUserDeletionAction(id), "Annuler la suppression et réactiver ce compte ?")}
        className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700">Annuler la suppression</button>
      {canPurge ? (
        <button type="button" disabled={pending} onClick={() => run(() => purgeUserAction(id), "Supprimer DÉFINITIVEMENT ce compte maintenant ? Les données personnelles seront effacées : c’est irréversible.")}
          className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50">Supprimer définitivement maintenant</button>
      ) : null}
      {err ? <span className="text-sm text-red-600">{err}</span> : null}
    </div>
  );
}

/** Demande manuelle (application / Moboo Pro) traitée. */
export function DeletionDone({ id }: { id: string }) {
  const { pending, err, run } = useAct();
  return (
    <>
      <button type="button" disabled={pending} onClick={() => run(() => markDeletionDoneAction(id), "Confirmer que le compte a bien été supprimé dans l’application concernée ?")}
        className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800">Marquer comme traitée</button>
      {err ? <span className="ml-2 text-sm text-red-600">{err}</span> : null}
    </>
  );
}
