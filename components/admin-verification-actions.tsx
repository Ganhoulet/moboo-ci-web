"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { reviewVerificationAction, revokeVerificationAction, type AdminVerification, type VerificationMeta } from "@/app/admin/verifications/actions";

/**
 * Examen d'une demande : points de contrôle à cocher (obligatoires pour valider),
 * motif de refus type (texte modifiable envoyé à la personne), retrait du badge.
 */
export function VerificationActions({ v, meta }: { v: AdminVerification; meta: VerificationMeta }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [err, setErr] = useState<string | null>(null);
  const items = meta.checks[v.level].filter((c) => !c.selfie || v.selfieUrl);
  const [checks, setChecks] = useState<Record<string, boolean>>(() => ({ ...v.checks }));
  const [mode, setMode] = useState<null | "reject" | "more_info">(null);
  const [reason, setReason] = useState(meta.reasons[0]?.code ?? "other");
  const [note, setNote] = useState(meta.reasons[0]?.text ?? "");
  const allChecked = items.every((c) => checks[c.key]);
  const open = v.status === "pending" || v.status === "more_info";
  const verified = v.level === "business" ? v.account?.businessVerified : v.account?.verified;

  const send = (action: "approve" | "reject" | "more_info") => start(async () => {
    setErr(null);
    const r = await reviewVerificationAction(v.id, action, action === "approve" ? { checks } : { adminNote: note, reasonCode: action === "reject" ? reason : undefined, checks });
    if (!r.ok) setErr(r.error ?? "Action impossible."); else { setMode(null); router.refresh(); }
  });
  const b = "rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-40";

  return (
    <div className="space-y-3">
      {open ? (
        <fieldset className="rounded-md bg-slate-50 p-3">
          <legend className="sr-only">Points de contrôle</legend>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500">Points de contrôle (tous requis pour valider)</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {items.map((c) => (
              <label key={c.key} className="flex items-start gap-2 text-sm text-slate-700">
                <input type="checkbox" className="mt-0.5" checked={!!checks[c.key]} onChange={(e) => setChecks((x) => ({ ...x, [c.key]: e.target.checked }))} />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {mode ? (
        <div className="space-y-2 rounded-md bg-red-50/60 p-3 ring-1 ring-red-100">
          {mode === "reject" ? (
            <label className="block text-xs font-semibold text-slate-700">Motif
              <select className="mt-1 block w-full rounded-md border-slate-300 text-sm" value={reason}
                onChange={(e) => { setReason(e.target.value); setNote(meta.reasons.find((r) => r.code === e.target.value)?.text ?? ""); }}>
                {meta.reasons.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
              </select>
            </label>
          ) : null}
          <label className="block text-xs font-semibold text-slate-700">{mode === "reject" ? "Message envoyé à la personne" : "Informations à demander"}
            <textarea className="mt-1 block w-full rounded-md border-slate-300 text-sm" rows={3} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className={b + " text-slate-600 hover:underline"} onClick={() => setMode(null)}>Annuler</button>
            <button type="button" disabled={pending || !note.trim()} onClick={() => send(mode)} className={b + " bg-red-600 text-white hover:bg-red-700"}>{mode === "reject" ? "Refuser la demande" : "Envoyer la demande de complément"}</button>
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-2">
        {v.status !== "approved" && open ? (
          <button type="button" disabled={pending || !allChecked} title={allChecked ? "" : "Cochez d’abord tous les points de contrôle"} onClick={() => send("approve")} className={b + " bg-emerald-600 text-white hover:bg-emerald-700"}>Valider</button>
        ) : null}
        {v.status === "pending" && !mode ? <button type="button" disabled={pending} onClick={() => { setMode("more_info"); setNote(""); }} className={b + " bg-amber-100 text-amber-800 hover:bg-amber-200"}>Demander un complément</button> : null}
        {open && !mode ? <button type="button" disabled={pending} onClick={() => { setMode("reject"); setNote(meta.reasons.find((r) => r.code === reason)?.text ?? ""); }} className={b + " bg-red-50 text-red-700 hover:bg-red-100"}>Refuser</button> : null}
        {verified && v.account ? (
          <button type="button" disabled={pending} className={b + " text-slate-600 hover:underline"}
            onClick={() => window.confirm(v.level === "business" ? "Retirer le badge « Pro vérifié » ?" : "Retirer le badge « Identité vérifiée » (et « Pro vérifié ») ?")
              && start(async () => { await revokeVerificationAction(v.account!.id, v.level); router.refresh(); })}>
            Retirer le badge
          </button>
        ) : null}
        {err ? <span className="w-full text-right text-xs text-red-600">{err}</span> : null}
      </div>
    </div>
  );
}
