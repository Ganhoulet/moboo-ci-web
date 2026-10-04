"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { migrationAction } from "@/app/admin/migration/actions";

type Action = Parameters<typeof migrationAction>[0];

/** Boutons de la migration WordPress, avec le résultat de la dernière action. */
export function MigrationButtons({ running }: { running: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [out, setOut] = useState<string | null>(null);
  const run = (a: Action, describe: (d: any) => string) => start(async () => {
    const r = await migrationAction(a);
    setOut(r.ok ? describe(r.data) : `Erreur : ${r.error}`);
    router.refresh();
  });
  const b = "rounded-md px-3 py-2 text-sm font-semibold disabled:opacity-50";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={pending} className={b + " bg-white text-ink ring-1 ring-slate-300 hover:bg-slate-50"}
          onClick={() => run("media/scan", (d) => `Analyse : ${d.referenced} photo(s) WordPress citées, ${d.added} nouvelle(s) à copier.`)}>1. Analyser la base</button>
        <button type="button" disabled={pending} className={b + " bg-white text-ink ring-1 ring-slate-300 hover:bg-slate-50"}
          onClick={() => run("media/probe", (d) => d.ok === null ? d.detail : `${d.ok ? "✔" : "✖"} ${d.detail}${d.status ? ` (réponse ${d.status})` : ""}`)}>2. Tester l’accès à WordPress</button>
        {running ? (
          <button type="button" disabled={pending} className={b + " bg-amber-500 text-white hover:bg-amber-600"} onClick={() => run("media/pause", () => "Copie mise en pause.")}>Mettre en pause</button>
        ) : (
          <button type="button" disabled={pending} className={b + " bg-brand-700 text-white hover:bg-brand-800"} onClick={() => run("media/start", () => "Copie lancée : elle avance toute seule (environ 90 photos toutes les 2 minutes) et remplace les adresses à la fin.")}>3. Lancer la copie automatique</button>
        )}
        <button type="button" disabled={pending} className={b + " bg-white text-ink ring-1 ring-slate-300 hover:bg-slate-50"}
          onClick={() => run("media/batch", (d) => `Lot copié : ${d.done} réussie(s), ${d.failed} échec(s), ${d.missing} introuvable(s).`)}>Copier un lot maintenant</button>
        <button type="button" disabled={pending} className={b + " bg-white text-ink ring-1 ring-slate-300 hover:bg-slate-50"}
          onClick={() => run("media/rewrite", (d) => `${d.replaced} adresse(s) remplacée(s)${d.result?.length ? " : " + d.result.map((r: any) => `${r.label} ${r.urls}`).join(", ") : ""}.`)}>Remplacer les adresses</button>
        <button type="button" disabled={pending} className={b + " text-brand-800 hover:underline"} onClick={() => run("media/retry", (d) => `${d.reset} photo(s) en échec ou introuvable(s) remise(s) en file.`)}>Réessayer les échecs</button>
        <button type="button" disabled={pending} className={b + " text-brand-800 hover:underline"} onClick={() => run("users/link", (d) => `Comptes : ${d.created} créé(s), ${d.linked} relié(s), ${d.noPhone} sans numéro, ${d.conflicts} conflit(s).`)}>Relier les comptes en attente</button>
      </div>
      {pending ? <p className="text-sm text-muted">En cours…</p> : out ? <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-800 ring-1 ring-slate-200" role="status">{out}</p> : null}
    </div>
  );
}
