"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { mergeZoneAction, unmergeZoneAction } from "@/app/admin/seo/generateur/actions";

function useRun() {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const run = (fn: () => Promise<{ ok: boolean; error?: string; renamed?: number; merged?: number; redirects?: number }>) =>
    start(async () => {
      const r = await fn();
      setMsg(r.ok ? (r.renamed !== undefined ? `${r.renamed} renommée(s), ${r.merged} fusionnée(s), ${r.redirects} redirection(s)` : "Fait") : r.error ?? "Échec");
      if (r.ok) router.refresh();
    });
  return { msg, pending, run };
}

const btn = "rounded-md px-3 py-1.5 text-xs font-semibold disabled:opacity-50";

/** Fusionne une zone dans une autre (pages, annuaire, redirections 301). */
export function MergeZoneButton({ from, to }: { from: string; to: string }) {
  const { msg, pending, run } = useRun();
  return (
    <span className="flex items-center gap-2">
      {msg ? <span className="text-xs text-muted">{msg}</span> : null}
      <button type="button" disabled={pending} className={btn + " bg-brand-600 text-white hover:bg-brand-700"}
        onClick={() => { if (confirm(`Fusionner « ${from} » dans « ${to} » ? Les anciennes adresses seront redirigées.`)) run(() => mergeZoneAction(from, to)); }}>
        {pending ? "Fusion…" : "Fusionner"}
      </button>
    </span>
  );
}

export function UnmergeZoneButton({ from }: { from: string }) {
  const { msg, pending, run } = useRun();
  return (
    <span className="flex items-center gap-2">
      {msg ? <span className="text-xs text-muted">{msg}</span> : null}
      <button type="button" disabled={pending} className={btn + " bg-white text-ink ring-1 ring-slate-300 hover:bg-slate-50"} onClick={() => run(() => unmergeZoneAction(from))}>
        {pending ? "…" : "Annuler la fusion"}
      </button>
    </span>
  );
}

/** Applique tout de suite les fusions en attente (sinon : contrôle de nuit). */
export function ApplyMergesButton({ count }: { count: number }) {
  const { msg, pending, run } = useRun();
  return (
    <span className="flex items-center gap-2">
      {msg ? <span className="text-xs text-muted">{msg}</span> : null}
      <button type="button" disabled={pending} className={btn + " bg-brand-600 text-white hover:bg-brand-700"} onClick={() => run(() => mergeZoneAction())}>
        {pending ? "Fusion…" : `Fusionner les ${count} page(s) maintenant`}
      </button>
    </span>
  );
}
