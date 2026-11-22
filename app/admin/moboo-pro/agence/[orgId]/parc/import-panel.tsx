"use client";

import { useState, useTransition } from "react";
import { importParcAction, type ImportResult } from "../../../parc-actions";

const LABEL = { biens: "biens", locataires: "locataires" } as const;

/** Import d'un fichier CSV (enregistré depuis Excel) : aperçu d'abord, puis confirmation. */
export function ImportPanel({ orgId }: { orgId: string }) {
  const [type, setType] = useState<"biens" | "locataires">("biens");
  const [csv, setCsv] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [preview, setPreview] = useState<ImportResult | null>(null);
  const [done, setDone] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const reset = () => { setPreview(null); setDone(null); setError(null); };
  const onFile = async (f: File | undefined) => {
    reset();
    if (!f) return;
    if (f.size > 3_000_000) { setError("Fichier trop lourd (3 Mo au plus)."); return; }
    if (!/\.(csv|txt)$/i.test(f.name)) { setError("Enregistrez le fichier Excel au format CSV (Fichier › Enregistrer sous › CSV), puis choisissez-le ici."); return; }
    setName(f.name);
    setCsv(await f.text());
  };
  const run = (dryRun: boolean) => start(async () => {
    if (!csv) return;
    setError(null);
    const r = await importParcAction(orgId, type, csv, dryRun);
    if (!r.ok || !r.result) { setError(r.error ?? "Import impossible."); return; }
    if (dryRun) setPreview(r.result); else { setDone(r.result); setPreview(null); setCsv(null); setName(""); }
  });

  return (
    <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <h2 className="font-semibold text-ink">Importer depuis Excel</h2>
      <p className="mt-1 text-xs text-muted">
        Partez du modèle, remplissez-le dans Excel, enregistrez-le en CSV puis choisissez-le ici. Un aperçu s’affiche avant tout enregistrement.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        {(["biens", "locataires"] as const).map((t) => (
          <button key={t} type="button" onClick={() => { setType(t); reset(); }} className={"rounded-full px-3 py-1 font-semibold " + (type === t ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>
            {t === "biens" ? "Biens" : "Locataires"}
          </button>
        ))}
        <a href={`/admin/moboo-pro/modele/${type}`} className="font-semibold text-brand-800 underline">Télécharger le modèle ({LABEL[type]})</a>
      </div>
      <label className="mt-3 block text-sm">
        <span className="sr-only">Fichier CSV</span>
        <input type="file" accept=".csv,text/csv,.txt" onChange={(e) => onFile(e.target.files?.[0])} className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:font-semibold" />
      </label>
      {csv ? (
        <button type="button" disabled={pending} onClick={() => run(true)} className="mt-3 rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {pending && !preview ? "Lecture…" : `Vérifier « ${name} »`}
        </button>
      ) : null}
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      {preview ? (
        <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm ring-1 ring-slate-200">
          <p className="font-semibold text-ink">{preview.valides} {LABEL[type]} prêts à importer sur {preview.total} ligne(s).</p>
          {preview.ignoredColumns.length ? <p className="text-xs text-muted">Colonnes ignorées : {preview.ignoredColumns.join(", ")}</p> : null}
          {preview.errors.length ? (
            <ul className="mt-2 max-h-40 list-disc overflow-auto pl-5 text-xs text-red-700">
              {preview.errors.slice(0, 50).map((e) => <li key={e.ligne}>Ligne {e.ligne} : {e.erreur}</li>)}
              {preview.errors.length > 50 ? <li>… et {preview.errors.length - 50} autre(s)</li> : null}
            </ul>
          ) : null}
          {preview.apercu.length ? (
            <p className="mt-2 text-xs text-slate-600">Exemples : {preview.apercu.map((a) => a.titre ?? `${a.prenom ?? ""} ${a.nom ?? ""}`.trim()).join(" · ")}</p>
          ) : null}
          {preview.valides ? (
            <button type="button" disabled={pending}
              onClick={() => { if (confirm(`Créer ${preview.valides} ${LABEL[type]} dans cette agence ? Les lignes en erreur seront ignorées.`)) run(false); }}
              className="mt-3 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              Importer {preview.valides} {LABEL[type]}
            </button>
          ) : null}
        </div>
      ) : null}
      {done ? <p className="mt-3 text-sm font-semibold text-emerald-700">{done.created} {LABEL[type]} importé(s){done.errors.length ? `, ${done.errors.length} ligne(s) ignorée(s)` : ""}.</p> : null}
    </section>
  );
}
