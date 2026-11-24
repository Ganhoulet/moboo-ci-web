"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createFreePageAction, deleteFreePageAction, type FreeRow } from "@/app/admin/pages-site/actions";

const toPath = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

/** Pages libres façon WordPress : créer (titre + adresse), modifier sur le site, supprimer. */
export function FreePagesManager({ rows }: { rows: FreeRow[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [path, setPath] = useState("");
  const [touched, setTouched] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, start] = useTransition();
  const finalPath = touched ? toPath(path) : toPath(title);

  const create = () => start(async () => {
    const r = await createFreePageAction(title.trim(), finalPath);
    if (r.ok && r.slug) { window.location.href = `/pages/${r.slug.slice(6)}?modifier=1`; return; }
    setMsg({ ok: false, text: r.error ?? "Création impossible." });
  });
  const remove = (row: FreeRow) => {
    if (!window.confirm(`Supprimer définitivement la page « ${row.title} » ? Pour la cacher sans la perdre, laissez-la non publiée ou masquez ses blocs.`)) return;
    start(async () => {
      const r = await deleteFreePageAction(row.slug);
      setMsg(r.ok ? { ok: true, text: "Page supprimée." } : { ok: false, text: r.error ?? "Erreur" });
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <div id="nouvelle" className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="font-semibold text-ink">Créer une page</p>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
          <input className="input text-sm" placeholder="Titre (ex. À propos de Moboo)" value={title} onChange={(e) => setTitle(e.target.value)} />
          <label className="flex items-center rounded-md ring-1 ring-slate-300 text-sm">
            <span className="pl-3 text-slate-500">moboo.ci/pages/</span>
            <input className="min-w-0 flex-1 rounded-md px-1 py-2 outline-none" placeholder="a-propos" value={touched ? path : finalPath} onChange={(e) => { setTouched(true); setPath(e.target.value); }} />
          </label>
          <button type="button" onClick={create} disabled={busy || !title.trim() || !finalPath} className="rounded-md bg-ink px-4 py-2 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-40">{busy ? "…" : "Créer et modifier"}</button>
        </div>
        <p className="mt-2 text-xs text-muted">La page est créée en brouillon et s’ouvre directement en mode modification. Les visiteurs ne la voient qu’après « Publier ».</p>
        {msg ? <p className={"mt-2 text-sm " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
      </div>
      {rows.length ? (
        <ul className="divide-y divide-slate-100 rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          {rows.map((r) => (
            <li key={r.slug} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{r.title}</p>
                <p className="text-xs text-muted">moboo.ci/pages/{r.path} · {r.published ? `en ligne${r.publishedAt ? ` depuis le ${new Date(r.publishedAt).toLocaleDateString("fr-FR")}` : ""}` : "brouillon (pas encore publiée)"}{r.published && r.dirty ? " · modifications non publiées" : ""}</p>
              </div>
              <a href={`/pages/${r.path}`} target="_blank" rel="noreferrer" className="text-sm font-semibold text-brand-700 hover:underline">Voir ↗</a>
              <a href={`/pages/${r.path}?modifier=1`} className="rounded-md bg-accent-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-700">✎ Modifier sur la page</a>
              <a href={`/admin/pages-site/${r.slug}`} className="rounded-md px-3 py-1.5 text-sm font-semibold text-ink ring-1 ring-slate-300 hover:bg-slate-50">Constructeur</a>
              <button type="button" onClick={() => remove(r)} disabled={busy} className="text-sm font-semibold text-red-600 hover:underline">Supprimer</button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">Aucune page libre pour le moment.</p>}
    </div>
  );
}
