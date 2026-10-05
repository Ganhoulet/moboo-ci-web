"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteHelpAction, restoreHelpAction, saveHelpAction, uploadHelpImageAction, type HelpInput } from "@/app/admin/aide/actions";
import type { HelpAudience } from "@/lib/help";
import { HelpBody } from "@/components/help/help-body";
import { fileToDataUri } from "@/lib/file-data-uri";

const input = "mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand-600 focus:outline-none";
const label = "block text-xs font-semibold uppercase tracking-wide text-slate-500";

/** Éditeur d'un article d'aide : texte simple + barre d'outils + capture d'écran + aperçu fidèle. */
export function HelpEditor({ audiences, initial, hasOriginal, builtin, stats }: {
  audiences: HelpAudience[]; initial: HelpInput; hasOriginal?: boolean; builtin?: boolean; stats?: { views: number; yes: number; no: number };
}) {
  const router = useRouter();
  const [a, setA] = useState(initial);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const area = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const set = <K extends keyof HelpInput>(k: K, v: HelpInput[K]) => setA((x) => ({ ...x, [k]: v }));
  const au = audiences.find((x) => x.key === a.audience);

  /** Insère du texte à la position du curseur (ou autour de la sélection). */
  const insert = (before: string, after = "", placeholder = "") => {
    const t = area.current;
    if (!t) return;
    const s = t.selectionStart, e = t.selectionEnd;
    const sel = a.body.slice(s, e) || placeholder;
    const next = a.body.slice(0, s) + before + sel + after + a.body.slice(e);
    set("body", next);
    requestAnimationFrame(() => { t.focus(); t.setSelectionRange(s + before.length, s + before.length + sel.length); });
  };
  const block = (text: string) => insert(`${a.body && !a.body.endsWith("\n\n") ? "\n\n" : ""}${text}\n\n`);

  const upload = (f: File) => start(async () => {
    try {
      const data = await fileToDataUri(f, 1600);
      const r = await uploadHelpImageAction(data);
      if (!r.ok || !r.url) return setMsg({ ok: false, text: r.error ?? "Envoi impossible." });
      block(`![Légende de la capture](${r.url})`);
      setMsg({ ok: true, text: "Capture ajoutée : modifiez sa légende entre crochets." });
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || "Image illisible." });
    }
  });

  const save = (status?: string) => start(async () => {
    const r = await saveHelpAction({ ...a, ...(status ? { status } : {}) });
    if (!r.ok) return setMsg({ ok: false, text: r.error ?? "Erreur." });
    setMsg({ ok: true, text: "Enregistré : visible sur le site d’ici une minute." });
    if (status) set("status", status);
    if (!a.id && r.id) router.replace(`/admin/aide/${r.id}`);
    else router.refresh();
  });

  const tool = "rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/aide" className="text-sm text-brand-700 hover:underline">← Centre d’aide</Link>
          <h1 className="font-display text-2xl font-extrabold text-ink">{a.id ? a.title || "Article" : "Nouvel article"}</h1>
          {stats ? <p className="text-sm text-muted">{stats.views} lecture(s) · 👍 {stats.yes} · 👎 {stats.no}{a.slug ? <> · <a href={`/aide/article/${a.slug}`} target="_blank" className="font-semibold text-brand-700 underline">voir sur le site</a></> : null}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          {a.id && hasOriginal ? <button type="button" disabled={pending} onClick={() => { if (confirm("Remettre le texte d’origine ? Vos modifications seront perdues.")) start(async () => { const r = await restoreHelpAction(a.id!); if (r.ok) location.reload(); else setMsg({ ok: false, text: r.error ?? "Erreur." }); }); }} className="rounded-md bg-white px-3 py-2 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Texte d’origine</button> : null}
          {a.id ? <button type="button" disabled={pending} onClick={() => { if (confirm(builtin ? "Archiver cet article ? Il sera retiré du site (restaurable)." : "Supprimer cet article ?")) start(async () => { const r = await deleteHelpAction(a.id!); if (r.ok) router.push("/admin/aide"); else setMsg({ ok: false, text: r.error ?? "Erreur." }); }); }} className="rounded-md bg-white px-3 py-2 font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50">{builtin ? "Archiver" : "Supprimer"}</button> : null}
          <button type="button" disabled={pending} onClick={() => save("draft")} className="rounded-md bg-white px-3 py-2 font-semibold ring-1 ring-slate-300 hover:bg-slate-50">Brouillon</button>
          <button type="button" disabled={pending} onClick={() => save("published")} className="rounded-md bg-brand-700 px-4 py-2 font-semibold text-white hover:bg-brand-800">Publier</button>
        </div>
      </div>
      {msg ? <p className={"rounded-md px-3 py-2 text-sm " + (msg.ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}>{msg.text}</p> : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="space-y-4 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block"><span className={label}>Type</span>
              <select value={a.kind} onChange={(e) => set("kind", e.target.value as "guide" | "faq")} className={input}><option value="guide">Guide pas à pas</option><option value="faq">Question fréquente</option></select>
            </label>
            <label className="block sm:col-span-2"><span className={label}>Public</span>
              <select value={a.audience} onChange={(e) => set("audience", e.target.value)} className={input}>{audiences.map((x) => <option key={x.key} value={x.key}>{x.title}</option>)}</select>
            </label>
          </div>
          <label className="block"><span className={label}>{a.kind === "faq" ? "Question" : "Titre"}</span><input value={a.title} onChange={(e) => set("title", e.target.value)} className={input} placeholder={a.kind === "faq" ? "Ex. Comment changer mon numéro ?" : "Ex. Publier votre bien en quelques minutes"} /></label>
          {a.kind === "guide" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block"><span className={label}>Rubrique</span>
                <input list="help-cats" value={a.category} onChange={(e) => set("category", e.target.value)} className={input} />
                <datalist id="help-cats">{(au?.categories ?? []).map((c) => <option key={c} value={c} />)}</datalist>
              </label>
              <label className="block"><span className={label}>Résumé (une ligne)</span><input value={a.summary} maxLength={240} onChange={(e) => set("summary", e.target.value)} className={input} /></label>
            </div>
          ) : null}
          <div>
            <span className={label}>{a.kind === "faq" ? "Réponse" : "Contenu"}</span>
            <div className="mt-1 flex flex-wrap gap-1 rounded-t-md border border-b-0 border-slate-300 bg-slate-50 p-1">
              <button type="button" className={tool} onClick={() => block("## Titre de section")}>Titre</button>
              <button type="button" className={tool} onClick={() => insert("**", "**", "texte en gras")}><b>G</b></button>
              <button type="button" className={tool} onClick={() => block("1. Première étape\n2. Deuxième étape\n3. Troisième étape")}>Étapes 1-2-3</button>
              <button type="button" className={tool} onClick={() => block("- Premier point\n- Deuxième point")}>Liste</button>
              <button type="button" className={tool} onClick={() => insert("[", "](/aide/article/adresse-de-l-article)", "texte du lien")}>Lien</button>
              <button type="button" className={tool} onClick={() => block("> Astuce : votre conseil ici.")}>💡 Astuce</button>
              <button type="button" className={tool} onClick={() => block("> Attention : point important.")}>⚠️ Attention</button>
              <button type="button" className={tool + " text-brand-800"} onClick={() => file.current?.click()}>🖼 Capture d’écran</button>
              <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
            </div>
            <textarea ref={area} value={a.body} onChange={(e) => set("body", e.target.value)} rows={22} className="w-full rounded-b-md border border-slate-300 px-3 py-2 font-mono text-[13px] leading-relaxed focus:border-brand-600 focus:outline-none" />
            <p className="mt-1 text-[11px] text-muted">Une ligne vide sépare les blocs. « ## » titre · « 1. » étapes · « - » liste (deux espaces devant pour une sous-liste) · **gras** · [lien](/page) · ![légende](adresse de l’image) · « {">"} Astuce : … » ou « {">"} Attention : … ».</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block"><span className={label}>Adresse (après /aide/article/)</span><input value={a.slug} disabled={builtin} onChange={(e) => set("slug", e.target.value)} placeholder="automatique d’après le titre" className={input + " font-mono disabled:bg-slate-50"} /></label>
            <label className="block"><span className={label}>Ordre d’affichage</span><input type="number" value={a.sort} onChange={(e) => set("sort", Number(e.target.value))} className={input} /></label>
          </div>
        </section>
        <section className="rounded-lg bg-white p-6 shadow-sm ring-1 ring-slate-200 xl:sticky xl:top-20 xl:max-h-[calc(100vh-6rem)] xl:self-start xl:overflow-y-auto">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Aperçu</p>
          <p className="mt-3 text-sm font-semibold text-accent-700">{a.kind === "faq" ? "Question fréquente" : "Guide"} · {au?.title}</p>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-ink">{a.title || "Titre"}</h2>
          {a.summary && a.kind === "guide" ? <p className="mt-2 text-slate-600">{a.summary}</p> : null}
          <div className="mt-4"><HelpBody body={a.body || "Le contenu s’affiche ici."} /></div>
        </section>
      </div>
    </div>
  );
}
