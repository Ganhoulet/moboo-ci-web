"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { getZoneDataAction, saveDocumentAction } from "@/app/admin/documents/actions";
import { applyZone, hasZoneBlocks, type ZoneOption } from "@/lib/documents/zone";
import { docCss } from "@/components/documents/doc-css";
import { DocPageView, type Wrap } from "@/components/documents/doc-render";
import { BLOCK_CATALOG, buildToc, flatBlocks, KIND_LABEL, newBlock, newPage, uid, type Block, type BlockType, type DocData, type DocFull, type DocKind, type DocMeta, type DocPage } from "@/lib/documents/types";
import { BlockForm, Field, inputCls } from "./block-form";

const NOT_IN_COLUMNS: BlockType[] = ["cover", "back", "columns", "toc", "zoneListings"];
const btn = "rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40";
const icon = "rounded px-1.5 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-200 disabled:opacity-30";

type ListFn = (list: Block[]) => Block[];
const walk = (list: Block[], fn: ListFn): Block[] =>
  fn(list).map((b) => (b.type === "columns" ? { ...b, left: walk(b.left, fn), right: walk(b.right, fn) } : b));
const cloneBlock = (b: Block): Block => {
  const c = JSON.parse(JSON.stringify(b)) as Block;
  const fresh = (x: Block): Block => (x.type === "columns" ? { ...x, id: uid(), left: x.left.map(fresh), right: x.right.map(fresh) } : { ...x, id: uid() });
  return fresh(c);
};

function pageName(p: DocPage) {
  for (const b of flatBlocks(p.blocks)) {
    if (b.type === "cover") return "Couverture";
    if (b.type === "back") return "Quatrième de couverture";
    if (b.type === "toc") return "Sommaire";
    if (b.type === "heading" && b.title) return b.title;
  }
  return p.section || "Page sans titre";
}
const blockLabel = (t: BlockType) => BLOCK_CATALOG.flatMap((g) => g.items).find((i) => i.type === t)?.label ?? "Bloc libre";

/** Éditeur par pages : pages à gauche, page réelle au centre, réglages du bloc à droite. */
export function DocumentEditor({ doc, zones }: { doc: DocFull; zones: ZoneOption[] }) {
  const router = useRouter();
  const [meta, setMeta] = useState<DocMeta>({ title: doc.title, kind: doc.kind, format: doc.format, edition: doc.edition, editionDate: doc.editionDate, status: doc.status, zone: doc.zone, template: doc.template });
  const [data, setData] = useState<DocData>(doc.data);
  const [cur, setCur] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [zoom, setZoom] = useState(doc.format === "A5" ? 0.9 : 0.68);
  const [save, setSave] = useState<{ state: "saved" | "dirty" | "saving" | "error"; error?: string }>({ state: "saved" });
  const [overflow, setOverflow] = useState(false);
  const [colSide, setColSide] = useState<"left" | "right">("left");
  const stage = useRef<HTMLDivElement>(null);
  const history = useRef<{ data: DocData; at: number }[]>([]);
  const latest = useRef({ meta, data });
  latest.current = { meta, data };

  const page = data.pages[Math.min(cur, data.pages.length - 1)];
  const toc = useMemo(() => buildToc(data.pages), [data.pages]);
  const selected = sel ? flatBlocks(page.blocks).find((b) => b.id === sel) ?? null : null;

  const change = useCallback((next: (d: DocData) => DocData) => {
    setData((d) => {
      const h = history.current;
      if (!h.length || Date.now() - h[h.length - 1].at > 900) { h.push({ data: d, at: Date.now() }); if (h.length > 60) h.shift(); }
      return next(d);
    });
    setSave({ state: "dirty" });
  }, []);
  const setM = <K extends keyof DocMeta>(k: K, v: DocMeta[K]) => { setMeta((m) => ({ ...m, [k]: v })); setSave({ state: "dirty" }); };
  const editPage = (fn: (p: DocPage) => DocPage) => change((d) => ({ ...d, pages: d.pages.map((p) => (p.id === page.id ? fn(p) : p)) }));
  const editBlocks = (fn: ListFn) => editPage((p) => ({ ...p, blocks: walk(p.blocks, fn) }));

  const persist = useCallback(async () => {
    setSave({ state: "saving" });
    const snapshot = latest.current;
    const r = await saveDocumentAction(doc.id, snapshot.meta, snapshot.data);
    if (!r.ok) return setSave({ state: "error", error: r.error });
    setSave((s) => (latest.current === snapshot || (latest.current.data === snapshot.data && latest.current.meta === snapshot.meta) ? { state: "saved" } : s));
  }, [doc.id]);

  // Enregistrement automatique, 2,5 secondes après la dernière modification.
  useEffect(() => {
    if (save.state !== "dirty") return;
    const t = setTimeout(persist, 2500);
    return () => clearTimeout(t);
  }, [save.state, data, meta, persist]);
  useEffect(() => {
    const leave = (e: BeforeUnloadEvent) => { if (save.state === "dirty" || save.state === "saving") e.preventDefault(); };
    window.addEventListener("beforeunload", leave);
    return () => window.removeEventListener("beforeunload", leave);
  }, [save.state]);

  // Contenu trop long pour la page : signalé en direct (une page imprimée ne déborde jamais sur la suivante).
  useEffect(() => {
    const check = () => { const el = stage.current?.querySelector<HTMLElement>(".pc"); setOverflow(!!el && el.scrollHeight > el.clientHeight + 2); };
    check();
    const imgs = stage.current?.querySelectorAll("img") ?? [];
    imgs.forEach((i) => i.addEventListener("load", check));
    return () => imgs.forEach((i) => i.removeEventListener("load", check));
  }, [data, cur, meta.format]);

  const [zoneMsg, setZoneMsg] = useState<{ busy?: boolean; ok?: boolean; text?: string }>({});
  const refreshZone = async (slug: string) => {
    if (!slug) return;
    setZoneMsg({ busy: true });
    const r = await getZoneDataAction(slug);
    if (!r.ok || !r.data) return setZoneMsg({ ok: false, text: r.error ?? "Données indisponibles." });
    const z = r.data;
    change((d) => applyZone(d, z));
    setM("zone", slug);
    setZoneMsg({ ok: true, text: `Données de ${z.zone.name} chargées.` });
  };

  const undo = () => {
    const h = history.current.pop();
    if (h) { setData(h.data); setSave({ state: "dirty" }); }
  };
  const addBlock = (type: BlockType) => {
    const b = newBlock(type);
    const allowed = !NOT_IN_COLUMNS.includes(type);
    const parent = sel ? page.blocks.find((x) => x.id === sel || (x.type === "columns" && flatBlocks([x]).some((y) => y.id === sel))) : undefined;
    if (selected?.type === "columns" && allowed) {
      editBlocks((l) => l.map((x) => (x.id === selected.id && x.type === "columns" ? { ...x, [colSide]: [...x[colSide], b] } : x)));
    } else if (sel && (allowed || parent?.id === sel)) {
      editBlocks((l) => l.flatMap((x) => (x.id === sel ? [x, b] : [x])));
    } else if (parent) {
      editPage((p) => ({ ...p, blocks: p.blocks.flatMap((x) => (x.id === parent.id ? [x, b] : [x])) }));
    } else {
      editPage((p) => ({ ...p, blocks: [...p.blocks, b] }));
    }
    setSel(b.id);
  };
  const moveBlock = (d: number) => sel && editBlocks((l) => {
    const i = l.findIndex((x) => x.id === sel); const j = i + d;
    if (i < 0 || j < 0 || j >= l.length) return l;
    const n = [...l]; [n[i], n[j]] = [n[j], n[i]]; return n;
  });
  const movePage = (d: number) => {
    const j = cur + d;
    if (j < 0 || j >= data.pages.length) return;
    change((x) => { const n = [...x.pages]; [n[cur], n[j]] = [n[j], n[cur]]; return { ...x, pages: n }; });
    setCur(j);
  };
  const addPage = () => { change((x) => ({ ...x, pages: [...x.pages.slice(0, cur + 1), newPage([], page.section), ...x.pages.slice(cur + 1)] })); setCur(cur + 1); setSel(null); };
  const dupPage = () => { change((x) => ({ ...x, pages: [...x.pages.slice(0, cur + 1), { ...page, id: uid(), blocks: page.blocks.map(cloneBlock) }, ...x.pages.slice(cur + 1)] })); setCur(cur + 1); setSel(null); };
  const delPage = () => {
    if (data.pages.length < 2 || !confirm(`Supprimer la page ${cur + 1} ?`)) return;
    change((x) => ({ ...x, pages: x.pages.filter((p) => p.id !== page.id) })); setCur(Math.max(0, cur - 1)); setSel(null);
  };

  const wrap: Wrap = (b, node: ReactNode) => {
    const full = b.type === "cover" || b.type === "back";
    const active = b.id === sel;
    return (
      <div onClick={(e) => { e.stopPropagation(); setSel(b.id); }} style={full ? { position: "absolute", inset: 0 } : { position: "relative" }}
        className={"cursor-pointer " + (active ? "outline outline-2 outline-[#ea580c]" : "hover:outline hover:outline-1 hover:outline-[#1e40af]")}>
        {node}
      </div>
    );
  };

  const saveLabel = save.state === "saved" ? "Enregistré" : save.state === "saving" ? "Enregistrement…" : save.state === "dirty" ? "Modifications en cours…" : save.error ?? "Erreur d’enregistrement";
  return (
    <div className="space-y-3">
      <style dangerouslySetInnerHTML={{ __html: docCss(meta.format) }} />
      <style dangerouslySetInnerHTML={{ __html: `.doc-rich ul{list-style:disc;padding-left:1.2rem}.doc-rich ol{list-style:decimal;padding-left:1.2rem}.doc-rich h3{font-weight:700;color:#1e3a8a}.doc-rich p{margin-bottom:.4rem}.doc-rich a{color:#1e40af;text-decoration:underline}` }} />
      <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin/documents" className="text-sm text-brand-700 hover:underline">← Documents</Link>
          <input aria-label="Titre du document" value={meta.title} onChange={(e) => setM("title", e.target.value)} className="min-w-[14rem] flex-1 rounded-md border border-transparent px-2 py-1 font-display text-lg font-bold text-ink hover:border-slate-300 focus:border-brand-600 focus:outline-none" />
          <span className={"text-xs font-semibold " + (save.state === "error" ? "text-red-600" : "text-muted")} role="status">{saveLabel}</span>
          <button type="button" className={btn} disabled={!history.current.length} onClick={undo}>Annuler</button>
          <button type="button" className={btn} onClick={persist}>Enregistrer</button>
          <button type="button" className={btn} onClick={() => setM("status", meta.status === "published" ? "draft" : "published")}>{meta.status === "published" ? "Repasser en brouillon" : "Publier"}</button>
          <button type="button" onClick={async () => { await persist(); router.push(`/admin/documents/${doc.id}/imprimer`); }} className="rounded-md bg-brand-700 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-800">Aperçu et PDF</button>
        </div>
        <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Type"><select value={meta.kind} onChange={(e) => setM("kind", e.target.value as DocKind)} className={inputCls}>{Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <Field label="Format"><select value={meta.format} onChange={(e) => setM("format", e.target.value as DocMeta["format"])} className={inputCls}><option value="A4">A4</option><option value="A5">A5</option></select></Field>
          <Field label="N° d’édition"><input type="number" min={1} value={meta.edition} onChange={(e) => setM("edition", Number(e.target.value) || 1)} className={inputCls} /></Field>
          <Field label="Date d’édition"><input value={meta.editionDate} onChange={(e) => setM("editionDate", e.target.value)} placeholder="novembre 2026" className={inputCls} /></Field>
          <Field label="Mention en pied de page"><input value={data.settings.footer} onChange={(e) => change((d) => ({ ...d, settings: { ...d.settings, footer: e.target.value } }))} className={inputCls} /></Field>
        </div>
      </div>

      {hasZoneBlocks(data) ? (
        <div className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 text-sm shadow-sm ring-1 ring-slate-200">
          <label className="flex items-center gap-2 font-semibold text-ink">Zone du magazine
            <select aria-label="Zone" value={meta.zone ?? ""} disabled={zoneMsg.busy} onChange={(e) => void refreshZone(e.target.value)} className="rounded-md border border-slate-300 px-2 py-1.5 text-sm font-normal">
              <option value="">Choisir…</option>
              {meta.zone && !zones.some((z) => z.slug === meta.zone) ? <option value={meta.zone}>{data.settings.zoneName ?? meta.zone}</option> : null}
              {zones.map((z) => <option key={z.slug} value={z.slug}>{z.name}{z.city && z.city !== z.name ? ` (${z.city})` : ""} · {z.rent + z.sale} annonces</option>)}
            </select>
          </label>
          <button type="button" className={btn} disabled={!meta.zone || zoneMsg.busy} onClick={() => void refreshZone(meta.zone!)}>{zoneMsg.busy ? "Chargement…" : "Actualiser les données"}</button>
          {zoneMsg.text ? <span role="status" className={"text-xs font-semibold " + (zoneMsg.ok ? "text-emerald-700" : "text-red-600")}>{zoneMsg.text}</span> : <span className="text-xs text-muted">Les chiffres sont figés dans le document jusqu’à la prochaine actualisation.</span>}
        </div>
      ) : null}

      <div className="grid items-start gap-3 lg:grid-cols-[210px_minmax(0,1fr)_340px]">
        <aside className="rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-200 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          <p className="px-1 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{data.pages.length} page{data.pages.length > 1 ? "s" : ""}</p>
          <ol className="space-y-0.5">
            {data.pages.map((p, i) => (
              <li key={p.id}>
                <button type="button" onClick={() => { setCur(i); setSel(null); }} className={"flex w-full items-baseline gap-2 rounded px-2 py-1.5 text-left text-xs " + (i === cur ? "bg-brand-700 text-white" : "text-slate-700 hover:bg-slate-100")}>
                  <span className="font-bold tabular-nums">{String(i + 1).padStart(2, "0")}</span><span className="line-clamp-2">{pageName(p)}</span>
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-2 flex flex-wrap gap-1 border-t border-slate-200 pt-2">
            <button type="button" className={icon} onClick={addPage}>+ Page</button>
            <button type="button" className={icon} onClick={dupPage}>Dupliquer</button>
            <button type="button" className={icon} disabled={cur === 0} onClick={() => movePage(-1)} aria-label="Monter la page">↑</button>
            <button type="button" className={icon} disabled={cur === data.pages.length - 1} onClick={() => movePage(1)} aria-label="Descendre la page">↓</button>
            <button type="button" className={icon + " text-red-600"} disabled={data.pages.length < 2} onClick={delPage}>Supprimer</button>
          </div>
        </aside>

        <section className="min-w-0" onClick={() => setSel(null)}>
          <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-muted">
            <span>Page {cur + 1} sur {data.pages.length}</span>
            <label className="flex items-center gap-1">Zoom <input type="range" min={0.4} max={1.2} step={0.02} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} /></label>
            {overflow ? <span role="alert" className="rounded bg-red-50 px-2 py-0.5 font-semibold text-red-700">Le contenu dépasse de la page : retirez du texte ou ajoutez une page.</span> : null}
          </div>
          <div className="overflow-x-auto rounded-lg bg-slate-200 p-4">
            <div ref={stage} className="mdoc mx-auto w-max shadow-xl" style={{ zoom }}>
              <DocPageView page={page} index={cur} meta={meta} data={data} toc={toc} wrap={wrap} />
            </div>
          </div>
        </section>

        <aside className="space-y-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          {selected ? (
            <div className="space-y-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-display text-sm font-bold text-ink">{blockLabel(selected.type)}</h2>
                <div className="flex gap-0.5">
                  <button type="button" className={icon} onClick={() => moveBlock(-1)} aria-label="Monter le bloc">↑</button>
                  <button type="button" className={icon} onClick={() => moveBlock(1)} aria-label="Descendre le bloc">↓</button>
                  <button type="button" className={icon} onClick={() => editBlocks((l) => l.flatMap((x) => (x.id === sel ? [x, cloneBlock(x)] : [x])))}>Dupliquer</button>
                  <button type="button" className={icon + " text-red-600"} onClick={() => { editBlocks((l) => l.filter((x) => x.id !== sel)); setSel(null); }}>Retirer</button>
                </div>
              </div>
              <BlockForm key={selected.id} b={selected} onChange={(patch) => editBlocks((l) => l.map((x) => (x.id === selected.id ? ({ ...x, ...patch } as Block) : x)))} />
              {selected.type === "columns" ? <Field label="Les blocs ajoutés vont dans"><select value={colSide} onChange={(e) => setColSide(e.target.value as "left" | "right")} className={inputCls}><option value="left">La colonne de gauche</option><option value="right">La colonne de droite</option></select></Field> : null}
            </div>
          ) : (
            <div className="space-y-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
              <h2 className="font-display text-sm font-bold text-ink">Page {cur + 1}</h2>
              <Field label="Rubrique en haut de page"><input value={page.section} onChange={(e) => editPage((p) => ({ ...p, section: e.target.value }))} className={inputCls} /></Field>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={!!page.noChrome} onChange={(e) => editPage((p) => ({ ...p, noChrome: e.target.checked }))} /> Sans en-tête ni pied de page</label>
              <p className="text-[11px] text-muted">Cliquez sur un bloc de la page pour le modifier. Dans les champs de texte, **deux étoiles** autour d’un mot le mettent en gras.</p>
            </div>
          )}
          <div className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <h2 className="font-display text-sm font-bold text-ink">Ajouter un bloc</h2>
            {BLOCK_CATALOG.map((g) => (
              <div key={g.group} className="mt-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{g.group}</p>
                <div className="mt-1 grid grid-cols-2 gap-1">
                  {g.items.map((it) => <button key={it.type} type="button" onClick={() => addBlock(it.type)} className="rounded border border-slate-200 px-2 py-1.5 text-left text-xs font-medium text-slate-700 hover:border-brand-600 hover:bg-brand-50">{it.label}</button>)}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
