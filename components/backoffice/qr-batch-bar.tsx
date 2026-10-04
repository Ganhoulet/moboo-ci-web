"use client";

import { useEffect, useState } from "react";

/**
 * Barre d'impression groupée des Affiches QR : compte les cases cochées du
 * formulaire « qr-batch » (agents / agences : name=r, annonces : name=l),
 * « Tout sélectionner » par section, format et option « toutes leurs annonces ».
 */
export function QrBatchBar() {
  const [n, setN] = useState({ r: 0, l: 0 });
  useEffect(() => {
    const form = document.getElementById("qr-batch") as HTMLFormElement | null;
    if (!form) return;
    const count = () => {
      const boxes = Array.from(document.querySelectorAll<HTMLInputElement>('input[type=checkbox][form="qr-batch"]'));
      setN({ r: boxes.filter((b) => b.checked && b.name === "r").length, l: boxes.filter((b) => b.checked && b.name === "l").length });
    };
    count();
    document.addEventListener("change", count);
    return () => document.removeEventListener("change", count);
  }, []);
  const total = n.r + n.l;
  return (
    <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-lg bg-ink p-3 text-white shadow-xl">
      <span className="text-sm font-semibold">
        {total ? <>{n.r} agent{n.r > 1 ? "s" : ""} / agence{n.r > 1 ? "s" : ""} · {n.l} annonce{n.l > 1 ? "s" : ""} sélectionné{total > 1 ? "s" : ""}</> : "Cochez les comptes et les annonces à imprimer ensemble"}
      </span>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="annonces" value="1" form="qr-batch" defaultChecked className="h-4 w-4" />
        avec toutes leurs annonces
      </label>
      <select name="f" form="qr-batch" defaultValue="A4" aria-label="Format" className="rounded-md px-2 py-1.5 text-sm text-ink">
        <option value="A3">A3</option><option value="A4">A4</option><option value="A5">A5</option>
      </select>
      <button type="submit" form="qr-batch" disabled={!total} className="ml-auto rounded-md bg-[#FE6600] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40">
        Imprimer la sélection
      </button>
    </div>
  );
}

/** « Tout sélectionner / Tout désélectionner » pour une section (name=r ou name=l). */
export function QrSelectAll({ name }: { name: string }) {
  const [on, setOn] = useState(false);
  const toggle = () => {
    const next = !on;
    document.querySelectorAll<HTMLInputElement>(`input[type=checkbox][form="qr-batch"][name="${name}"]`).forEach((b) => { b.checked = next; });
    document.dispatchEvent(new Event("change"));
    setOn(next);
  };
  return (
    <button type="button" onClick={toggle} className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50">
      {on ? "Tout désélectionner" : "Tout sélectionner"}
    </button>
  );
}

/** Barre d'impression groupée des affiches des pages SEO (cases name=seo). */
export function SeoBatchBar() {
  const [n, setN] = useState(0);
  useEffect(() => {
    const count = () => setN(document.querySelectorAll('input[type=checkbox][form="qr-batch"][name="seo"]:checked').length);
    count();
    document.addEventListener("change", count);
    return () => document.removeEventListener("change", count);
  }, []);
  return (
    <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-lg bg-ink p-3 text-white shadow-xl">
      <span className="text-sm font-semibold">{n ? `${n} page${n > 1 ? "s" : ""} sélectionnée${n > 1 ? "s" : ""}` : "Cochez les pages à imprimer ensemble (modèle par défaut)"}</span>
      <input name="emplacement" form="qr-batch" placeholder="Emplacement (ex. Carrefour Siporex)" aria-label="Emplacement"
        className="min-w-[14rem] flex-1 rounded-md px-3 py-1.5 text-sm text-ink" />
      <select name="f" form="qr-batch" defaultValue="A4" aria-label="Format" className="rounded-md px-2 py-1.5 text-sm text-ink">
        <option value="A3">A3</option><option value="A4">A4</option><option value="A5">A5</option>
      </select>
      <button type="submit" form="qr-batch" disabled={!n} className="rounded-md bg-[#FE6600] px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40">Imprimer la sélection</button>
    </div>
  );
}
