"use client";

import { useState } from "react";
import { importCatalogue, type ImportResult } from "./actions";

const MODELE = "reference;transaction;type;chambres;prix;ville;commune;quartier;statut;date_publication;plateforme\nA-102;location;Appartement;2;250000;Abidjan;Cocody;Angré;disponible;2026-11-20;IvoireDomi\nV-17;vente;Villa;4;150000000;Abidjan;Cocody;Riviera 3;disponible;;\n";

/** Import du catalogue Excel d'une agence : aperçu, puis enregistrement. */
export function ImportForm() {
  const [source, setSource] = useState("");
  const [plateforme, setPlateforme] = useState("");
  const [csv, setCsv] = useState("");
  const [fichier, setFichier] = useState("");
  const [res, setRes] = useState<ImportResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const envoyer = async (dryRun: boolean) => {
    setBusy(true); setErr(null);
    const r = await importCatalogue({ source, plateforme, csv, dryRun });
    setBusy(false);
    if (r.ok) setRes(r.data); else { setErr(r.error); setRes(null); }
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Nom de la source (agence)
          <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Ex. : Agence Lagune Immobilier" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="text-sm font-medium">Site où ces annonces sont aussi publiées (facultatif)
          <input value={plateforme} onChange={(e) => setPlateforme(e.target.value)} placeholder="Ex. : IvoireDomi, CoinAfrique" className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <input type="file" accept=".csv,text/csv" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { setFichier(f.name); setCsv(await f.text()); setRes(null); } }} />
        <a download="modele-catalogue.csv" href={`data:text/csv;charset=utf-8,${encodeURIComponent("﻿" + MODELE)}`} className="font-semibold text-brand-800 hover:underline">Télécharger le modèle Excel</a>
      </div>
      <p className="text-xs text-muted">Colonnes : référence, transaction (location ou vente), type, chambres, prix, ville, commune, quartier, statut (disponible, loué, vendu, retiré), date de publication, site. Enregistrez depuis Excel au format CSV. Un nouvel import de la même agence met à jour ses annonces (même référence).</p>
      <div className="flex gap-2">
        <button disabled={busy || !csv || source.trim().length < 2} onClick={() => envoyer(true)} className="rounded-md bg-white px-4 py-2 text-sm font-semibold ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50">Aperçu{fichier ? ` de ${fichier}` : ""}</button>
        <button disabled={busy || !res || res.enregistre || res.valides === 0} onClick={() => envoyer(false)} className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">Importer {res && !res.enregistre ? `${res.valides} annonce(s)` : ""}</button>
      </div>
      {err ? <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">{err}</p> : null}
      {res ? (
        <div className={"rounded-md p-3 text-sm " + (res.enregistre ? "bg-emerald-50 text-emerald-800" : "bg-slate-50 text-slate-700")}>
          <p className="font-semibold">{res.enregistre ? `${res.valides} annonce(s) importée(s).` : `${res.valides} ligne(s) valide(s), ${res.nbErreurs} ligne(s) à corriger.`}</p>
          {res.erreurs.length ? <ul className="mt-1 list-disc pl-5 text-xs">{res.erreurs.slice(0, 10).map((e) => <li key={e.ligne}>Ligne {e.ligne} : {e.erreurs.join(", ")}</li>)}</ul> : null}
        </div>
      ) : null}
    </div>
  );
}
