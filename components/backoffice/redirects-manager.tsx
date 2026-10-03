"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  clear404Action, createRedirectAction, deleteRedirectAction, ignore404Action, importRedirectsAction, testRedirectAction,
  updateRedirectAction, type NotFoundRow, type RedirectRow,
} from "@/app/admin/seo/redirections/actions";
import { ago } from "./ui";

type Msg = { ok: boolean; text: string } | null;
const field = "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm";

function useRun() {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<Msg>(null);
  const run = (fn: () => Promise<{ ok: boolean; error?: string; data?: any }>, ok: string | ((d: any) => string), after?: () => void) => start(async () => {
    const r = await fn();
    setMsg(r.ok ? { ok: true, text: typeof ok === "function" ? ok(r.data) : ok } : { ok: false, text: r.error ?? "Action impossible." });
    if (r.ok) { after?.(); router.refresh(); }
  });
  return { pending, msg, run, setMsg };
}
const Note = ({ msg }: { msg: Msg }) => (msg ? <p className={"text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null);

/** Ajout, test d'une adresse, import CSV. */
export function RedirectTools() {
  const { pending, msg, run } = useRun();
  const [source, setSource] = useState("");
  const [target, setTarget] = useState("");
  const [code, setCode] = useState(301);
  const [test, setTest] = useState("");
  const [testRes, setTestRes] = useState<string | null>(null);
  const [csv, setCsv] = useState("");
  const [showImport, setShowImport] = useState(false);
  return (
    <div className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <form className="flex flex-wrap items-center gap-2" onSubmit={(e) => { e.preventDefault(); run(() => createRedirectAction({ source, target, code }), "Redirection enregistrée.", () => { setSource(""); setTarget(""); }); }}>
        <input value={source} onChange={(e) => setSource(e.target.value)} required placeholder="Ancienne adresse : /property/villa-cocody/" className={field + " min-w-[14rem] flex-1"} />
        <span className="text-slate-400">→</span>
        <input value={target} onChange={(e) => setTarget(e.target.value)} required placeholder="Nouvelle adresse : /annonces?q=cocody" className={field + " min-w-[14rem] flex-1"} />
        <select value={code} onChange={(e) => setCode(Number(e.target.value))} className={field} aria-label="Type">
          <option value={301}>301 permanente</option><option value={302}>302 temporaire</option>
        </select>
        <button disabled={pending} className="h-10 rounded-md bg-brand-700 px-4 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-60">Ajouter</button>
      </form>
      <form className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3" onSubmit={(e) => {
        e.preventDefault();
        setTestRes(null);
        testRedirectAction(test).then((r) => setTestRes(!r.ok ? `Erreur : ${r.error}` : r.data!.code === 404 ? "Aucune redirection : la page s’affichera si elle existe, sinon 404." : `→ ${r.data!.target} (${r.data!.code}${r.data!.rule ? `, règle : ${r.data!.rule}` : r.data!.source === "manual" ? ", manuelle" : ""})`));
      }}>
        <input value={test} onChange={(e) => setTest(e.target.value)} required placeholder="Tester une ancienne adresse (ex. https://moboo.ci/property/…)" className={field + " min-w-[16rem] flex-1"} />
        <button className="h-10 rounded-md border border-brand-700 px-4 text-sm font-semibold text-brand-800 hover:bg-brand-50">Tester</button>
        <button type="button" onClick={() => setShowImport(!showImport)} className="h-10 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">Importer (CSV)</button>
        {testRes ? <p className="w-full text-sm text-ink">{testRes}</p> : null}
      </form>
      {showImport ? (
        <form className="space-y-2 border-t border-slate-100 pt-3" onSubmit={(e) => { e.preventDefault(); run(() => importRedirectsAction(csv), (d) => `${d?.created ?? 0} redirection(s) importée(s).${d?.errors?.length ? ` ${d.errors.length} ligne(s) ignorée(s) : ${d.errors.join(" · ")}` : ""}`, () => setCsv("")); }}>
          <p className="text-xs text-muted">Une redirection par ligne : <code>ancienne adresse ; nouvelle adresse ; 301</code> (virgule, point-virgule ou tabulation). Le code est facultatif. Un export du plugin WordPress « Redirection » fonctionne aussi.</p>
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={6} className="input font-mono text-xs" placeholder={"/ancienne-page/;/nouvelle-page\n/property/villa-x/;/annonce/…;301"} required />
          <button disabled={pending} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Importer</button>
        </form>
      ) : null}
      <Note msg={msg} />
    </div>
  );
}

export function RedirectTable({ items }: { items: RedirectRow[] }) {
  const { pending, msg, run } = useRun();
  const [edit, setEdit] = useState<{ id: string; target: string } | null>(null);
  if (!items.length) return <p className="rounded-lg bg-white p-8 text-center text-sm text-muted ring-1 ring-slate-200">Aucune redirection.</p>;
  return (
    <div className="space-y-2">
      <Note msg={msg} />
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[56rem] text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr><th className="px-3 py-2.5">Ancienne adresse</th><th className="px-3 py-2.5">Nouvelle adresse</th><th className="px-3 py-2.5">Type</th><th className="px-3 py-2.5 text-right">Visites</th><th className="px-3 py-2.5" /></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((r) => (
              <tr key={r.id} className={r.active ? "" : "opacity-50"}>
                <td className="max-w-[18rem] px-3 py-2 font-mono text-xs"><span className="break-all">{r.source}</span>
                  <span className="mt-0.5 block font-sans text-[11px] text-muted">{r.auto ? `Automatique — ${r.note ?? ""}` : r.note ?? (r.createdBy ? `par ${r.createdBy}` : "")}</span></td>
                <td className="max-w-[18rem] px-3 py-2 font-mono text-xs">
                  {edit?.id === r.id ? (
                    <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); run(() => updateRedirectAction(r.id, { target: edit.target }), "Enregistré.", () => setEdit(null)); }}>
                      <input autoFocus value={edit.target} onChange={(e) => setEdit({ ...edit, target: e.target.value })} className="h-8 flex-1 rounded border border-slate-300 px-2" />
                      <button className="rounded bg-brand-700 px-2 text-white">OK</button>
                    </form>
                  ) : <a href={r.target} target="_blank" rel="noopener" className="break-all text-brand-800 hover:underline">{r.target}</a>}
                </td>
                <td className="px-3 py-2 text-xs"><span className={"rounded-full px-2 py-0.5 font-semibold " + (r.code === 301 ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-800")}>{r.code}</span></td>
                <td className="px-3 py-2 text-right text-xs">{r.hits.toLocaleString("fr-FR")}<span className="block text-muted">{r.lastHitAt ? ago(r.lastHitAt) : "—"}</span></td>
                <td className="whitespace-nowrap px-3 py-2 text-right text-xs">
                  <button type="button" disabled={pending} onClick={() => setEdit({ id: r.id, target: r.target })} className="font-semibold text-brand-800 hover:underline">Modifier</button>
                  <button type="button" disabled={pending} onClick={() => run(() => updateRedirectAction(r.id, { active: !r.active }), r.active ? "Désactivée." : "Activée.")} className="ml-2 font-semibold text-slate-600 hover:underline">{r.active ? "Désactiver" : "Activer"}</button>
                  <button type="button" disabled={pending} onClick={() => window.confirm(`Supprimer la redirection ${r.source} ?`) && run(() => deleteRedirectAction(r.id), "Supprimée.")} className="ml-2 font-semibold text-red-600 hover:underline">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Pages introuvables : créer la redirection (suggestion pré-remplie) ou ignorer. */
export function NotFoundTable({ items, view }: { items: NotFoundRow[]; view: string }) {
  const { pending, msg, run } = useRun();
  const [targets, setTargets] = useState<Record<string, string>>({});
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Note msg={msg} />
        {items.length ? (
          <button type="button" disabled={pending} onClick={() => window.confirm("Vider cette liste ? Les adresses réapparaîtront si elles sont de nouveau demandées.") && run(() => clear404Action(view), (d) => `${d?.count ?? 0} adresse(s) retirée(s).`)}
            className="ml-auto text-xs font-semibold text-slate-500 hover:text-red-600">Vider la liste</button>
        ) : null}
      </div>
      {!items.length ? <p className="rounded-lg bg-white p-8 text-center text-sm text-muted ring-1 ring-slate-200">Aucune page introuvable ici. 🎉</p> : (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <table className="w-full min-w-[56rem] text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-3 py-2.5">Adresse demandée</th><th className="px-3 py-2.5 text-right">Fois</th><th className="px-3 py-2.5">Rediriger vers</th><th className="px-3 py-2.5" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((r) => {
                const t = targets[r.id] ?? r.suggestion;
                return (
                  <tr key={r.id} className="align-top">
                    <td className="max-w-[20rem] px-3 py-2"><span className="break-all font-mono text-xs text-ink">{r.path}</span>
                      <span className="mt-0.5 block text-[11px] text-muted">dernière fois {ago(r.lastSeenAt)}{r.referrer ? ` · venant de ${r.referrer.replace(/^https?:\/\//, "").slice(0, 50)}` : ""}</span></td>
                    <td className="px-3 py-2 text-right font-semibold">{r.hits}</td>
                    <td className="px-3 py-2">
                      {view !== "ignored" ? (
                        <form className="flex gap-1" onSubmit={(e) => { e.preventDefault(); run(() => createRedirectAction({ source: r.path, target: t }), `Redirection ${r.path} → ${t} créée.`); }}>
                          <input value={t} onChange={(e) => setTargets({ ...targets, [r.id]: e.target.value })} className="h-8 min-w-[12rem] flex-1 rounded border border-slate-300 px-2 font-mono text-xs" />
                          <button disabled={pending} className="rounded bg-brand-700 px-2.5 text-xs font-semibold text-white hover:bg-brand-800">Rediriger</button>
                        </form>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right text-xs">
                      <button type="button" disabled={pending} onClick={() => run(() => ignore404Action(r.id, view !== "ignored"), view === "ignored" ? "Réactivée." : "Ignorée.")} className="font-semibold text-slate-500 hover:text-ink">{view === "ignored" ? "Réactiver" : "Ignorer"}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
