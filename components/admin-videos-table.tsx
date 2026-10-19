"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteVideosAction, type AdminVideo } from "@/app/admin/application/actions";

const STATUS: Record<string, string> = { ACTIVE: "En ligne", SOLD: "Vendue", RENTED: "Louée", DISABLED: "Expirée / hors ligne", DELETED: "Supprimée" };
const PROVIDER: Record<string, string> = { r2: "R2", bunny: "Bunny", youtube: "YouTube" };
const date = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—");
const ago = (d: string | null) => (d ? Math.floor((Date.now() - new Date(d).getTime()) / 86_400_000) : null);

/** Liste des vidéos avec cases à cocher et « Supprimer la sélection ». */
export function AdminVideosTable({ items, total }: { items: AdminVideo[]; total: number }) {
  const router = useRouter();
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const all = items.length > 0 && items.every((x) => sel.has(x.id));
  const toggle = (id: string) => setSel((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const size = items.filter((x) => sel.has(x.id)).reduce((s, x) => s + (x.size ?? 0), 0);

  function remove() {
    if (!sel.size || !confirm(`Supprimer ${sel.size} vidéo(s) ? Elles seront effacées chez le fournisseur et retirées des annonces (galerie automatique comprise). Action définitive.`)) return;
    start(async () => {
      const r = await deleteVideosAction([...sel]);
      setMsg(r.ok ? `${r.removed} vidéo(s) supprimée(s).` : r.error ?? "Suppression impossible.");
      setSel(new Set());
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 px-4 py-2.5 text-sm">
        <label className="flex items-center gap-2 font-semibold text-slate-700">
          <input type="checkbox" checked={all} onChange={() => setSel(all ? new Set() : new Set(items.map((x) => x.id)))} /> Tout cocher
        </label>
        <span className="text-muted">{total} vidéo(s){sel.size ? ` · ${sel.size} sélectionnée(s)${size ? `, ${(size / 1024 / 1024).toFixed(1)} Mo` : ""}` : ""}</span>
        <button type="button" disabled={!sel.size || pending} onClick={remove}
          className="ml-auto rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-40">
          {pending ? "Suppression…" : "Supprimer la sélection"}
        </button>
      </div>
      {msg ? <p className="border-b border-slate-100 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">{msg}</p> : null}
      {items.length ? (
        <ul className="divide-y divide-slate-100">
          {items.map((x) => (
            <li key={x.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <input type="checkbox" checked={sel.has(x.id)} onChange={() => toggle(x.id)} aria-label={`Sélectionner ${x.title}`} />
              <a href={x.url ?? "#"} target="_blank" rel="noreferrer" className="block h-14 w-24 shrink-0 overflow-hidden rounded-md bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {x.thumbnail ? <img src={x.thumbnail} alt="" className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-xl">🎬</span>}
              </a>
              <div className="min-w-0 flex-1">
                <a href={`/annonce/${x.id}`} target="_blank" rel="noreferrer" className="block truncate font-semibold text-ink hover:underline">{x.title}</a>
                <p className="text-xs text-muted">
                  {x.transaction === "rent" ? "Location" : "Vente"} · {x.city} · {STATUS[x.status] ?? x.status}{x.featured ? " · ⭐ vedette / vitrine" : ""}
                </p>
                <p className="text-xs text-muted">
                  {PROVIDER[x.provider] ?? x.provider}
                  {x.uploadedAt ? ` · envoyée le ${date(x.uploadedAt)} (${ago(x.uploadedAt)} j)` : ""}
                  {x.size ? ` · ${(x.size / 1024 / 1024).toFixed(1)} Mo` : ""}{x.length ? ` · ${x.length} s` : ""}
                  {x.videoStatus && x.videoStatus !== "ready" ? ` · ${x.videoStatus === "failed" ? "échec" : "en traitement"}` : ""}
                </p>
                {x.keep ? <p className="text-xs font-semibold text-emerald-700">L’annonceur a choisi de la garder</p>
                  : x.deleteOn ? <p className="text-xs font-semibold text-amber-700">Retrait automatique prévu le {date(x.deleteOn)}{x.notifiedAt ? " (annonceur prévenu)" : ""}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="p-8 text-center text-sm text-muted">Aucune vidéo.</p>}
    </div>
  );
}
