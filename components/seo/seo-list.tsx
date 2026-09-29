"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { importBundledAction, importSeoPagesAction, type SeoRow } from "@/app/admin/seo/actions";
import { parseWordPressExport } from "@/lib/wp-import";

const dot = (ok: boolean, warn = false) => <span className={"inline-block h-2.5 w-2.5 rounded-full " + (ok ? "bg-emerald-500" : warn ? "bg-amber-400" : "bg-red-500")} />;

/** Pages SEO : liste, filtres, import de l'ancien moboo.ci (WordPress). */
export function SeoList({ items, bundledCount }: { items: SeoRow[]; bundledCount: number }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<"all" | "landing" | "override">("all");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [pending, start] = useTransition();
  const file = useRef<HTMLInputElement>(null);

  const list = useMemo(() => items.filter((x) => (kind === "all" || x.kind === kind) && (!q || `${x.title} ${x.slug} ${x.focusKeyword ?? ""}`.toLowerCase().includes(q.toLowerCase()))), [items, q, kind]);
  const report = (r: { ok: boolean; error?: string; created?: number; updated?: number; skipped?: number; errors?: unknown[] }) =>
    setMsg(r.ok ? { ok: true, text: `Import terminé : ${r.created ?? 0} créée(s), ${r.updated ?? 0} mise(s) à jour, ${r.skipped ?? 0} déjà présente(s)${r.errors?.length ? `, ${r.errors.length} en erreur` : ""}.` } : { ok: false, text: r.error ?? "Import impossible." });

  const importXml = (f: File) => start(async () => {
    setMsg(null);
    try {
      const pages = parseWordPressExport(await f.text());
      if (!pages.length) return setMsg({ ok: false, text: "Aucune page d’annonces trouvée dans ce fichier." });
      const total = { ok: true, created: 0, updated: 0, skipped: 0, errors: [] as unknown[] };
      for (let i = 0; i < pages.length; i += 15) {
        const r = await importSeoPagesAction(pages.slice(i, i + 15), overwrite);
        if (!r.ok) return report(r);
        total.created += r.created ?? 0; total.updated += r.updated ?? 0; total.skipped += r.skipped ?? 0; total.errors.push(...(r.errors ?? []));
      }
      report(total); router.refresh();
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : "Fichier illisible." });
    }
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Pages SEO</h1>
          <p className="text-sm text-muted">Pages « Maisons à louer Cocody », « Terrains à vendre Abidjan »… et SEO des pages du site, avec analyse façon Yoast.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/seo/nouvelle?type=page" className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-semibold">SEO d’une page du site</Link>
          <Link href="/admin/seo/nouvelle" className="rounded-md bg-accent-600 px-5 py-2 text-sm font-bold text-white hover:bg-accent-700">+ Nouvelle page SEO</Link>
        </div>
      </div>

      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <p className="font-semibold text-ink">Reprendre les pages de l’ancien moboo.ci (WordPress)</p>
        <p className="mt-1 text-sm text-muted">Mêmes adresses, titres et méta-descriptions Yoast, mots-clés et textes : le référencement acquis est conservé.</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button type="button" disabled={pending} onClick={() => start(async () => { setMsg(null); report(await importBundledAction(overwrite)); router.refresh(); })}
            className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{pending ? "Import…" : `Importer les ${bundledCount} pages de l’export du 29/09`}</button>
          <button type="button" disabled={pending} onClick={() => file.current?.click()} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold disabled:opacity-60">Importer un autre export WordPress (.xml)</button>
          <input ref={file} type="file" accept=".xml,text/xml" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) importXml(f); }} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" className="accent-brand-700" checked={overwrite} onChange={(e) => setOverwrite(e.target.checked)} />Remplacer les pages déjà importées</label>
        </div>
        {msg ? <p className={"mt-3 text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Rechercher une page…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex rounded-full bg-white p-1 text-sm font-semibold shadow-sm ring-1 ring-slate-200">
          {([["all", "Toutes"], ["landing", "Pages SEO"], ["override", "Pages du site"]] as const).map(([k, l]) => (
            <button key={k} type="button" onClick={() => setKind(k)} className={"rounded-full px-3 py-1 " + (kind === k ? "bg-ink text-white" : "text-slate-600")}>{l}</button>
          ))}
        </div>
        <span className="text-sm text-muted">{list.length} page(s)</span>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            <tr><th className="px-4 py-3">Page</th><th className="px-4 py-3">Mot-clé</th><th className="px-4 py-3" title="Titre SEO, méta-description, texte">SEO</th><th className="px-4 py-3">Texte</th><th className="px-4 py-3">Liens accueil</th><th className="px-4 py-3">État</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {list.map((x) => {
              const tl = (x.seoTitle || x.title).length, ml = (x.metaDescription ?? "").length;
              return (
                <tr key={x.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/seo/${x.id}`} className="font-semibold text-ink hover:underline">{x.title}</Link>
                    <p className="text-xs text-muted">{x.kind === "landing" ? `/${x.slug}` : `Page du site : ${x.slug}`}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{x.focusKeyword || <span className="text-red-600">—</span>}</td>
                  <td className="px-4 py-3"><span className="flex gap-1.5" title={`Titre ${tl} car. · Méta ${ml} car.`}>{dot(tl >= 30 && tl <= 60, tl > 0)}{dot(ml >= 120 && ml <= 156, ml > 0)}{dot(!!x.focusKeyword)}</span></td>
                  <td className="px-4 py-3">{x.words >= 600 ? dot(true) : x.words >= 300 ? dot(false, true) : dot(false)} <span className="ml-1 text-xs text-muted">{x.words} mots</span></td>
                  <td className="px-4 py-3 text-xs text-muted">{x.kind === "landing" ? [x.hubTab, x.hubColumn].filter(Boolean).join(" › ") || "—" : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + (x.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600")}>{x.status === "published" ? "Publiée" : "Brouillon"}</span>
                    {x.noindex ? <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">noindex</span> : null}
                  </td>
                </tr>
              );
            })}
            {!list.length ? <tr><td colSpan={6} className="px-4 py-10 text-center text-muted">Aucune page. Importez celles de l’ancien site ou créez-en une.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
