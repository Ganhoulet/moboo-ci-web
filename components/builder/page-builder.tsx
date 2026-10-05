"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { PRO_BLOCKS, newProSection, proBlockDef } from "@/lib/pro-blocks";
import { BLOCKS, blockDef as homeBlockDef, newSection as homeNewSection, type BlockDef, type Section } from "@/lib/page-blocks";
import { discardAction, publishAction, restoreAction, saveDraftAction, type AdminPage } from "@/app/admin/accueil/actions";
import { FieldEditor, type Opt } from "./field-editor";

type Status = { tone: "ok" | "err" | "info"; text: string } | null;

/**
 * Constructeur de la page d'accueil : sections (ajouter, glisser / réordonner,
 * masquer, dupliquer, supprimer), formulaire du bloc choisi, aperçu en direct
 * du brouillon (ordinateur / téléphone), enregistrement automatique, publication.
 */
/** Catalogue de blocs utilisé par le constructeur (accueil par défaut ; espace pros…). */
export interface BuilderCatalog { blocks: BlockDef[]; def: (type: string) => BlockDef | undefined; create: (type: string) => Section }
// Choisi par une clé (une fonction ne peut pas passer d'un composant serveur à un composant client).
const CATALOGS: Record<"home" | "pros", BuilderCatalog> = {
  home: { blocks: BLOCKS, def: homeBlockDef, create: homeNewSection },
  pros: { blocks: PRO_BLOCKS, def: proBlockDef, create: newProSection },
};
export interface SeoMeta { title: string; description: string }

export function PageBuilder({ initial, meta, types, focus, slug = "home", title = "Page d’accueil", previewPath = "/", catalogKey = "home", seo }: {
  initial: Section[]; meta: AdminPage | null; types: Opt[]; focus?: string;
  slug?: string; title?: string; previewPath?: string; catalogKey?: "home" | "pros"; seo?: SeoMeta;
}) {
  const catalog = CATALOGS[catalogKey];
  const blockDef = catalog.def;
  const newSection = catalog.create;
  const [seoMeta, setSeoMeta] = useState<SeoMeta | undefined>(seo);
  const doc = (secs: Section[]) => ({ sections: secs, ...(seoMeta ? { meta: seoMeta } : {}) });
  const [sections, setSections] = useState<Section[]>(initial);
  const [selected, setSelected] = useState<string | null>(focus && initial.some((s) => s.id === focus) ? focus : initial[0]?.id ?? null);
  const [library, setLibrary] = useState(false);
  const [preview, setPreview] = useState<"off" | "desktop" | "mobile">("desktop");
  const [status, setStatus] = useState<Status>(null);
  const [dirtyPublished, setDirtyPublished] = useState(!!meta?.dirty);
  const [hasPrevious, setHasPrevious] = useState(!!meta?.hasPrevious);
  const [publishedAt, setPublishedAt] = useState(meta?.publishedAt ?? null);
  const [pending, start] = useTransition();
  const [frameKey, setFrameKey] = useState(0);
  const [drag, setDrag] = useState<number | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRender = useRef(true);
  const current = sections.find((s) => s.id === selected) ?? null;
  const def = current ? blockDef(current.type) : null;

  // Enregistrement automatique du brouillon (1,2 s après la dernière modification), puis aperçu rechargé.
  const saveNow = useCallback(async (secs: Section[]) => {
    const r = await saveDraftAction(slug, doc(secs));
    if (r.ok) { setDirtyPublished(true); setStatus({ tone: "info", text: "Brouillon enregistré" }); setFrameKey((k) => k + 1); }
    else setStatus({ tone: "err", text: r.error ?? "Enregistrement impossible." });
    return r.ok;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, seoMeta]);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setStatus({ tone: "info", text: "Modifications non enregistrées…" });
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => { void saveNow(sections); }, 1200);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [sections, seoMeta, saveNow]);

  const update = (id: string, patch: Partial<Section>) => setSections((ss) => ss.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const setProp = (key: string, v: unknown) => current && update(current.id, { props: { ...current.props, [key]: v } });
  const move = (from: number, to: number) => setSections((ss) => {
    if (to < 0 || to >= ss.length) return ss;
    const a = [...ss]; const [x] = a.splice(from, 1); a.splice(to, 0, x); return a;
  });
  const add = (type: string) => {
    const s = newSection(type);
    setSections((ss) => {
      const i = ss.findIndex((x) => x.id === selected);
      const a = [...ss]; a.splice(i >= 0 ? i + 1 : a.length, 0, s); return a;
    });
    setSelected(s.id); setLibrary(false);
  };
  const duplicate = (s: Section) => {
    const copy = { ...newSection(s.type), props: structuredClone(s.props), enabled: s.enabled };
    setSections((ss) => { const i = ss.findIndex((x) => x.id === s.id); const a = [...ss]; a.splice(i + 1, 0, copy); return a; });
    setSelected(copy.id);
  };
  const remove = (s: Section) => {
    if (!window.confirm(`Supprimer la section « ${sectionTitle(s)} » ?`)) return;
    setSections((ss) => ss.filter((x) => x.id !== s.id));
    if (selected === s.id) setSelected(null);
  };

  const publish = () => start(async () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const r = await publishAction(slug, doc(sections));
    if (r.ok) { setDirtyPublished(false); setHasPrevious(!!r.page?.hasPrevious); setPublishedAt(r.page?.publishedAt ?? null); setStatus({ tone: "ok", text: `${title} : publiée, les visiteurs voient la nouvelle version.` }); }
    else setStatus({ tone: "err", text: r.error ?? "Publication impossible." });
  });
  const restore = () => {
    if (!window.confirm("Revenir à la publication précédente ? Le brouillon actuel sera remplacé.")) return;
    start(async () => {
      const r = await restoreAction(slug);
      if (r.ok && r.page?.draft?.sections) { firstRender.current = true; setSections(r.page.draft.sections); setDirtyPublished(false); setFrameKey((k) => k + 1); setStatus({ tone: "ok", text: "Publication précédente restaurée." }); }
      else setStatus({ tone: "err", text: r.error ?? "Restauration impossible." });
    });
  };
  const discard = () => {
    if (!window.confirm("Abandonner les modifications non publiées ?")) return;
    start(async () => {
      const r = await discardAction(slug);
      if (r.ok && r.page?.draft?.sections) { firstRender.current = true; setSections(r.page.draft.sections); setDirtyPublished(false); setFrameKey((k) => k + 1); setStatus({ tone: "ok", text: "Modifications abandonnées." }); }
      else setStatus({ tone: "info", text: "Rien à abandonner (aucune version publiée)." });
    });
  };

  const width = preview === "mobile" ? "w-[390px]" : "w-full";
  const libraryGroups = useMemo(() => catalog.blocks, [catalog]);

  return (
    <div className="space-y-4">
      {/* Barre d'actions */}
      <div className="sticky top-16 z-30 flex flex-wrap items-center gap-2 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div className="mr-auto min-w-0">
          <h1 className="font-display text-xl font-extrabold text-ink">{title}</h1>
          <p className="text-xs text-muted">
            {dirtyPublished ? <span className="font-semibold text-amber-700">Modifications non publiées</span> : <span className="text-emerald-700">À jour avec le site</span>}
            {publishedAt ? ` · publiée le ${new Date(publishedAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}` : " · présentation par défaut (jamais publiée)"}
          </p>
        </div>
        {status ? <span className={"text-xs font-medium " + (status.tone === "err" ? "text-red-600" : status.tone === "ok" ? "text-emerald-700" : "text-slate-500")}>{status.text}</span> : null}
        <div className="flex rounded-full bg-slate-100 p-0.5 text-xs font-semibold">
          {(["desktop", "mobile", "off"] as const).map((m) => (
            <button key={m} type="button" onClick={() => setPreview(m)} className={"rounded-full px-3 py-1.5 " + (preview === m ? "bg-white text-ink shadow" : "text-slate-500")}>
              {m === "desktop" ? "🖥 Ordinateur" : m === "mobile" ? "📱 Téléphone" : "Masquer l’aperçu"}
            </button>
          ))}
        </div>
        <a href={`${previewPath}?apercu=1`} target="_blank" className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50">Ouvrir l’aperçu ↗</a>
        {hasPrevious ? <button type="button" disabled={pending} onClick={restore} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Version précédente</button> : null}
        {dirtyPublished && publishedAt ? <button type="button" disabled={pending} onClick={discard} className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Annuler les modifications</button> : null}
        <button type="button" disabled={pending} onClick={publish} className="rounded-md bg-accent-600 px-5 py-2 text-sm font-bold text-white hover:bg-accent-700 disabled:opacity-60">{pending ? "…" : "Publier"}</button>
      </div>

      <div className={"grid gap-4 " + (preview === "off" ? "xl:grid-cols-[20rem_minmax(0,1fr)]" : "xl:grid-cols-[18rem_24rem_minmax(0,1fr)]")}>
        {/* Sections */}
        <aside className="h-fit space-y-3">
        {seoMeta ? (
          <details className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <summary className="cursor-pointer text-sm font-semibold text-ink">🔎 Référencement (Google)</summary>
            <label className="mt-3 block text-xs font-semibold text-slate-500">Titre de la page ({seoMeta.title.length}/65)
              <input className="input mt-1 text-sm" value={seoMeta.title} maxLength={90} onChange={(e) => setSeoMeta({ ...seoMeta, title: e.target.value })} />
            </label>
            <label className="mt-2 block text-xs font-semibold text-slate-500">Description ({seoMeta.description.length}/160)
              <textarea className="input mt-1 text-sm" rows={4} value={seoMeta.description} maxLength={300} onChange={(e) => setSeoMeta({ ...seoMeta, description: e.target.value })} />
            </label>
            <div className="mt-2 rounded-md bg-slate-50 p-2 text-xs">
              <p className="truncate text-[#1a0dab]">{seoMeta.title}</p>
              <p className="text-emerald-700">moboo.ci{previewPath}</p>
              <p className="line-clamp-2 text-slate-600">{seoMeta.description}</p>
            </div>
          </details>
        ) : null}
        <div className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2.5">
            <p className="text-sm font-semibold text-ink">Sections ({sections.length})</p>
            <button type="button" onClick={() => setLibrary((v) => !v)} className="rounded-full bg-brand-700 px-3 py-1 text-xs font-bold text-white hover:bg-brand-800">+ Ajouter</button>
          </div>
          {library ? (
            <div className="grid max-h-[60vh] grid-cols-1 gap-1.5 overflow-y-auto border-b border-slate-100 p-2">
              {libraryGroups.map((b) => (
                <button key={b.type} type="button" onClick={() => add(b.type)} className="flex items-start gap-2 rounded-md p-2 text-left hover:bg-brand-50">
                  <span className="text-xl">{b.icon}</span>
                  <span><span className="block text-sm font-semibold text-ink">{b.label}</span><span className="block text-xs text-muted">{b.description}</span></span>
                </button>
              ))}
            </div>
          ) : null}
          <ul className="max-h-[70vh] overflow-y-auto p-1.5">
            {sections.map((s, i) => {
              const d = blockDef(s.type);
              return (
                <li key={s.id} draggable onDragStart={() => setDrag(i)} onDragOver={(e) => e.preventDefault()}
                  onDrop={() => { if (drag !== null && drag !== i) move(drag, i); setDrag(null); }}
                  className={"group flex items-center gap-2 rounded-md px-2 py-2 text-sm " + (selected === s.id ? "bg-brand-50 ring-1 ring-brand-200" : "hover:bg-slate-50") + (drag === i ? " opacity-40" : "")}>
                  <span className="cursor-grab select-none text-slate-400" title="Glisser pour déplacer">⋮⋮</span>
                  <button type="button" onClick={() => setSelected(s.id)} className={"min-w-0 flex-1 text-left " + (s.enabled ? "" : "opacity-50")}>
                    <span className="mr-1">{d?.icon}</span>
                    <span className="font-semibold text-ink">{d?.label}</span>
                    <span className="block truncate text-xs text-muted">{sectionTitle(s)}</span>
                  </button>
                  <span className="flex shrink-0 items-center gap-1 text-xs">
                    <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="px-0.5 text-slate-400 hover:text-ink disabled:opacity-20" aria-label="Monter">▲</button>
                    <button type="button" onClick={() => move(i, i + 1)} disabled={i === sections.length - 1} className="px-0.5 text-slate-400 hover:text-ink disabled:opacity-20" aria-label="Descendre">▼</button>
                    <button type="button" onClick={() => update(s.id, { enabled: !s.enabled })} title={s.enabled ? "Masquer" : "Afficher"} className="px-0.5">{s.enabled ? "👁" : "🚫"}</button>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        </aside>

        {/* Formulaire du bloc */}
        <section className="h-fit rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          {current && def ? (
            <>
              <div className="flex items-start justify-between gap-2 border-b border-slate-100 p-4">
                <div>
                  <p className="font-semibold text-ink">{def.icon} {def.label}</p>
                  <p className="text-xs text-muted">{def.description}</p>
                </div>
                <div className="flex shrink-0 gap-2 text-xs font-semibold">
                  <button type="button" onClick={() => duplicate(current)} className="text-brand-800 hover:underline">Dupliquer</button>
                  <button type="button" onClick={() => remove(current)} className="text-red-600 hover:underline">Supprimer</button>
                </div>
              </div>
              <div className="space-y-4 p-4">
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={current.enabled} onChange={(e) => update(current.id, { enabled: e.target.checked })} className="h-4 w-4 accent-brand-700" />
                  Section visible sur le site
                </label>
                {def.fields.map((f) => (
                  <div key={f.key}>
                    {f.type !== "bool" ? <p className="mb-1 text-sm font-semibold text-ink">{f.label}</p> : null}
                    <FieldEditor f={f} value={current.props[f.key]} onChange={(v) => setProp(f.key, v)} types={types} />
                    {f.help ? <p className="mt-1 text-xs text-muted">{f.help}</p> : null}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="p-8 text-center text-sm text-muted">Choisissez une section à gauche, ou ajoutez-en une.</p>
          )}
        </section>

        {/* Aperçu en direct du brouillon */}
        {preview !== "off" ? (
          <section className="overflow-hidden rounded-lg bg-slate-200 shadow-sm ring-1 ring-slate-300 xl:sticky xl:top-36 xl:h-[calc(100dvh-10rem)]">
            <div className="flex h-full min-h-[70vh] justify-center overflow-hidden">
              <iframe key={frameKey} title="Aperçu du brouillon" src={`${previewPath}?apercu=1${selected ? `#section-${selected}` : ""}`} className={`${width} h-full min-h-[70vh] bg-white`} />
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function sectionTitle(s: Section) {
  const p = s.props ?? {};
  return String(p.title || p.eyebrow || (s.type === "richText" ? String(p.html ?? "").replace(/<[^>]+>/g, " ").trim().slice(0, 40) : "") || s.type);
}
