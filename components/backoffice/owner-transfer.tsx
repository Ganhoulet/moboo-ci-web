"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  getTransferCheck, searchTransferTargets, transferOwnerAction, type TransferCheck, type TransferKind, type TransferParty,
} from "@/app/admin/immobilier/transfer-actions";

const TARGET_HINT: Record<TransferKind, string> = {
  listing: "Nom, agence, numéro de téléphone ou e-mail du compte Moboo.ci",
  residence: "Nom, numéro ou e-mail de l’organisation Moboo Resi",
  espace: "Nom ou e-mail du compte Moboo Event",
};

/** Propriétaire d'un bien et bouton « Changer de propriétaire » (motif obligatoire, inscrit au journal). */
export function OwnerTransfer({ kind, id, compact = false }: { kind: TransferKind; id: string; compact?: boolean }) {
  const router = useRouter();
  const [check, setCheck] = useState<TransferCheck | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<TransferParty[]>([]);
  const [target, setTarget] = useState<TransferParty | null>(null);
  const [reason, setReason] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();

  const load = () => getTransferCheck(kind, id).then((r) => (r.ok && r.data ? setCheck(r.data) : setLoadError(r.error ?? "Propriétaire indisponible.")));
  useEffect(() => { void load(); }, [kind, id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!open || q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => { void searchTransferTargets(kind, id, q).then(setResults); }, 300);
    return () => clearTimeout(t);
  }, [q, open, kind, id]);

  const submit = () => {
    if (!target || !check) return;
    if (!confirm(`Donner « ${check.title} » à ${target.name} ?\n\nL’ancien propriétaire n’y aura plus accès.`)) return;
    start(async () => {
      const r = await transferOwnerAction(kind, id, target.id, reason);
      if (!r.ok) { setMsg({ ok: false, text: r.error ?? "Changement impossible." }); return; }
      setMsg({ ok: true, text: `C’est fait : le bien appartient maintenant à ${r.owner?.name ?? target.name}. Le changement est noté dans le journal d’activité.` });
      setOpen(false); setTarget(null); setReason(""); setQ("");
      await load();
      router.refresh();
    });
  };

  const box = compact ? "rounded-md bg-slate-50 p-3 ring-1 ring-slate-200" : "rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5";
  if (loadError) return <div className={box}><p className="text-sm text-red-700">{loadError}</p></div>;
  if (!check) return <div className={box}><p className="text-sm text-muted">Chargement du propriétaire…</p></div>;

  return (
    <section className={box}>
      {compact ? null : <h2 className="font-display text-lg font-bold text-ink">Propriétaire</h2>}
      <p className={compact ? "text-sm" : "mt-2 text-sm"}>
        {check.owner ? <><strong className="text-ink">{check.owner.name}</strong>{check.owner.detail ? <span className="text-muted"> · {check.owner.detail}</span> : null}</> : <span className="text-muted">Aucun compte rattaché.</span>}
      </p>
      {check.blockers.length ? (
        <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Transfert impossible : ce bien a déjà {check.blockers.join(", ")}. Il reste chez son propriétaire actuel pour ne pas mélanger l’argent et les clients de deux comptes.
        </p>
      ) : !open ? (
        <button type="button" onClick={() => { setOpen(true); setMsg(null); }} className="mt-3 rounded-md bg-white px-3 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Changer de propriétaire</button>
      ) : (
        <div className="mt-3 space-y-3">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Nouveau propriétaire</span>
            <input className="input py-2 text-sm" value={q} onChange={(e) => { setQ(e.target.value); setTarget(null); }} placeholder={TARGET_HINT[kind]} autoFocus />
          </label>
          {target ? (
            <p className="rounded-md bg-brand-50 px-3 py-2 text-sm text-brand-900">Choisi : <strong>{target.name}</strong> <span className="text-muted">· {target.detail}</span></p>
          ) : results.length ? (
            <ul className="max-h-60 divide-y divide-slate-100 overflow-auto rounded-md ring-1 ring-slate-200">
              {results.map((p) => (
                <li key={p.id}>
                  <button type="button" onClick={() => setTarget(p)} className="block w-full px-3 py-2 text-left text-sm hover:bg-slate-50">
                    <span className="font-semibold text-ink">{p.name}</span> <span className="text-xs text-muted">· {p.detail}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : q.trim().length >= 2 ? <p className="text-xs text-muted">Aucun compte trouvé.</p> : null}
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Motif (obligatoire)</span>
            <textarea className="input min-h-[64px] text-sm" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ex. Bien repris de moboo.ci rattaché au mauvais agent" maxLength={300} />
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!target || reason.trim().length < 5 || pending} onClick={submit} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">{pending ? "Changement…" : "Confirmer le changement"}</button>
            <button type="button" onClick={() => { setOpen(false); setTarget(null); setQ(""); }} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">Annuler</button>
          </div>
        </div>
      )}
      {msg ? <p className={`mt-2 text-sm ${msg.ok ? "text-emerald-700" : "text-red-700"}`}>{msg.text}</p> : null}
    </section>
  );
}

/** Ligne dépliable de la liste des résidences et espaces. */
export function OwnerTransferToggle({ kind, id }: { kind: TransferKind; id: string }) {
  const [open, setOpen] = useState(false);
  return open ? <OwnerTransfer kind={kind} id={id} compact /> : (
    <button type="button" onClick={() => setOpen(true)} className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Changer de propriétaire</button>
  );
}
