"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { decideShortStayAction, type ShortStayRow } from "@/app/admin/immobilier/actions";

const UNIT: Record<string, string> = { month: "/ mois", night: "/ nuit", day: "/ jour", week: "/ semaine" };
const ACTIONS = [
  { key: "furnished", label: "Classer en meublé", help: "Passe dans « Meublés » (retirée de « À louer »).", cls: "bg-brand-800 text-white hover:bg-brand-900" },
  { key: "hide", label: "Retirer du site", help: "Masquée : l'annonceur la republie dans Moboo Resi / Event.", cls: "bg-white text-red-700 ring-1 ring-red-200 hover:bg-red-50" },
  { key: "keep", label: "Garder en location", help: "C'est bien une location longue durée : ne plus la proposer ici.", cls: "bg-white text-ink ring-1 ring-slate-300 hover:bg-slate-50" },
] as const;

export function ShortStayReview({ initial, likely }: { initial: ShortStayRow[]; likely: number }) {
  const [items, setItems] = useState(initial);
  const [sel, setSel] = useState<string[]>([]);
  const [onlyLikely, setOnlyLikely] = useState(likely > 0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const shown = items.filter((x) => !onlyLikely || x.likely);
  const allOn = shown.length > 0 && shown.every((x) => sel.includes(x.id));

  const decide = (ids: string[], action: (typeof ACTIONS)[number]["key"]) => start(async () => {
    const r = await decideShortStayAction(ids, action);
    if (!r.ok) return setMsg({ ok: false, text: r.error ?? "Erreur." });
    setItems((xs) => xs.filter((x) => !ids.includes(x.id)));
    setSel((s) => s.filter((id) => !ids.includes(id)));
    setMsg({ ok: true, text: `${r.updated ?? ids.length} annonce(s) traitée(s).` });
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-200">
        <label className="flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={allOn} onChange={() => setSel(allOn ? [] : shown.map((x) => x.id))} /> Tout sélectionner ({shown.length})
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" checked={onlyLikely} onChange={(e) => setOnlyLikely(e.target.checked)} /> Seulement les plus probables (titre ou prix au jour)
        </label>
        <div className="ml-auto flex flex-wrap gap-2">
          {ACTIONS.map((a) => (
            <button key={a.key} type="button" title={a.help} disabled={pending || !sel.length} onClick={() => decide(sel, a.key)}
              className={"rounded-md px-3 py-1.5 text-sm font-semibold disabled:opacity-40 " + a.cls}>{a.label}{sel.length ? ` (${sel.length})` : ""}</button>
          ))}
        </div>
      </div>
      {msg ? <p className={"rounded-lg p-3 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700")}>{msg.text}</p> : null}
      {!shown.length ? <p className="rounded-lg bg-white p-6 text-sm text-muted ring-1 ring-slate-200">Rien à classer pour le moment.</p> : null}
      <ul className="space-y-2">
        {shown.map((x) => (
          <li key={x.id} className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 ring-1 ring-slate-200">
            <input type="checkbox" aria-label={`Sélectionner ${x.title}`} checked={sel.includes(x.id)} onChange={() => setSel((s) => (s.includes(x.id) ? s.filter((i) => i !== x.id) : [...s, x.id]))} />
            {x.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={x.photo} alt="" className="h-14 w-20 shrink-0 rounded-md object-cover" />
            ) : <span className="h-14 w-20 shrink-0 rounded-md bg-slate-100" />}
            <div className="min-w-0 flex-1">
              <Link href={`/admin/immobilier/${x.id}`} className="block truncate font-semibold text-ink hover:underline">{x.title}</Link>
              <p className="text-xs text-muted">
                {x.price ? `${new Intl.NumberFormat("fr-FR").format(x.price)} FCFA ${UNIT[x.priceUnit ?? ""] ?? ""}` : "Prix non indiqué"} · {x.place || "—"} · {x.owner || "—"}
                {!x.visible || x.status !== "ACTIVE" ? " · hors ligne" : ""}
              </p>
              <p className="mt-1 flex flex-wrap gap-1">
                {x.reasons.map((r) => <span key={r} className={"rounded-full px-2 py-0.5 text-[11px] font-semibold " + (r === "description seulement" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-800")}>{r}</span>)}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ACTIONS.map((a) => (
                <button key={a.key} type="button" title={a.help} disabled={pending} onClick={() => decide([x.id], a.key)}
                  className={"rounded-md px-2.5 py-1 text-xs font-semibold disabled:opacity-40 " + a.cls}>{a.label}</button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
