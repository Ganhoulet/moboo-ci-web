"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setErrorStatusAction, type ErrorRow } from "@/app/admin/sante/actions";
import { ago } from "./ui";

const APP: Record<string, string> = { site: "Site", api: "API", resi: "Moboo Resi", event: "Moboo Event" };

export function ErrorList({ items }: { items: ErrorRow[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const set = (id: string, status: "OPEN" | "RESOLVED" | "IGNORED") => start(async () => { await setErrorStatusAction(id, status); router.refresh(); });
  if (!items.length) return <p className="rounded-lg bg-white p-6 text-center text-sm text-muted ring-1 ring-slate-200">Aucune erreur ici. 🎉</p>;
  return (
    <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      {items.map((e) => (
        <li key={e.id} className="p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="mr-2 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-bold text-slate-600">{APP[e.app] ?? e.app}</span>
                <span className="font-semibold text-ink">{e.errorType}</span>
                {e.zone ? <span className="ml-2 font-mono text-xs text-muted">{e.zone}</span> : null}
              </p>
              <p className="mt-1 break-words text-sm text-slate-700">{e.message.slice(0, 400)}</p>
              <p className="mt-1 text-xs text-muted">
                <strong className="text-ink">{e.count.toLocaleString("fr-FR")}</strong> fois · dernière {ago(e.lastSeenAt)} · première {ago(e.firstSeenAt)}
                {e.appVersion ? ` · version ${e.appVersion}` : ""}{e.platform ? ` · ${e.platform}` : ""}
              </p>
              {e.stackTrace ? (
                <details className="mt-1 text-xs"><summary className="cursor-pointer font-semibold text-brand-800">Détail technique</summary>
                  <pre className="mt-1 max-h-60 overflow-auto whitespace-pre-wrap rounded bg-slate-50 p-2 text-[11px] text-slate-600">{e.stackTrace}</pre>
                </details>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-1.5 text-xs">
              {e.status !== "RESOLVED" ? <button type="button" disabled={pending} onClick={() => set(e.id, "RESOLVED")} className="rounded-md bg-emerald-600 px-2.5 py-1.5 font-semibold text-white hover:bg-emerald-700">Corrigée</button> : null}
              {e.status !== "IGNORED" ? <button type="button" disabled={pending} onClick={() => set(e.id, "IGNORED")} className="rounded-md border border-slate-300 px-2.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-50">Ignorer</button> : null}
              {e.status !== "OPEN" ? <button type="button" disabled={pending} onClick={() => set(e.id, "OPEN")} className="rounded-md border border-slate-300 px-2.5 py-1.5 font-semibold text-slate-600 hover:bg-slate-50">Rouvrir</button> : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
