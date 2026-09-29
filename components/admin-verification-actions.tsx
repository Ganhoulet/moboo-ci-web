"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewVerificationAction, revokeVerificationAction } from "@/app/admin/verifications/actions";

export function VerificationActions({ id, status, accountId, verified }: { id: string; status: string; accountId: string | null; verified: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const act = (action: "approve" | "reject" | "more_info") => {
    let note: string | undefined;
    if (action !== "approve") {
      const n = window.prompt(action === "reject" ? "Raison du refus (envoyée au professionnel) :" : "Informations à demander :");
      if (!n) return;
      note = n;
    }
    start(async () => {
      setErr(null);
      const r = await reviewVerificationAction(id, action, note);
      if (!r.ok) setErr(r.error ?? "Action impossible."); else router.refresh();
    });
  };
  const b = "rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-40";
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {status !== "approved" ? <button type="button" disabled={pending} onClick={() => act("approve")} className={b + " bg-emerald-600 text-white hover:bg-emerald-700"}>Valider</button> : null}
      {status === "pending" ? <button type="button" disabled={pending} onClick={() => act("more_info")} className={b + " bg-amber-100 text-amber-800 hover:bg-amber-200"}>Demander un complément</button> : null}
      {status !== "rejected" && status !== "approved" ? <button type="button" disabled={pending} onClick={() => act("reject")} className={b + " bg-red-50 text-red-700 hover:bg-red-100"}>Refuser</button> : null}
      {verified && accountId ? <button type="button" disabled={pending} onClick={() => window.confirm("Retirer le badge « Vérifié » de ce compte ?") && start(async () => { await revokeVerificationAction(accountId); router.refresh(); })} className={b + " text-slate-600 hover:underline"}>Retirer le badge</button> : null}
      {err ? <span className="w-full text-right text-xs text-red-600">{err}</span> : null}
    </div>
  );
}
