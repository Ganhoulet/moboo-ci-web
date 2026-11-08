"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { uploadDocImageAction } from "@/app/admin/documents/actions";
import { DocShot } from "@/components/documents/doc-render";
import { fileToDataUri } from "@/lib/file-data-uri";
import type { Block, ImageBlock, Marker } from "@/lib/documents/types";

export const inputCls = "mt-1 w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-sm focus:border-brand-600 focus:outline-none";
export const labelCls = "block text-[11px] font-semibold uppercase tracking-wide text-slate-500";
const small = "rounded px-2 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50";
const del = "rounded px-1.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50";

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className={labelCls}>{label}</span>{children}</label>;
}
function Text({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <Field label={label}><input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className={inputCls} /></Field>;
}
function Area({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return <Field label={label}><textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} /></Field>;
}
function Lines({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  return <Area label={`${label} (une ligne par point)`} rows={5} value={value.join("\n")} onChange={(v) => onChange(v.split("\n"))} />;
}
function Select<T extends string>({ label, value, onChange, options }: { label: string; value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return <Field label={label}><select value={value} onChange={(e) => onChange(e.target.value as T)} className={inputCls}>{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></Field>;
}

/** Liste répétable : ajouter, supprimer, déplacer des éléments. */
function Items<T>({ label, items, onChange, make, render }: { label: string; items: T[]; onChange: (v: T[]) => void; make: () => T; render: (it: T, set: (v: T) => void) => ReactNode }) {
  const move = (i: number, d: number) => { const n = [...items]; const j = i + d; if (j < 0 || j >= n.length) return; [n[i], n[j]] = [n[j], n[i]]; onChange(n); };
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="mt-1 space-y-2">
        {items.map((it, i) => (
          <div key={i} className="rounded-md bg-slate-50 p-2 ring-1 ring-slate-200">
            {render(it, (v) => onChange(items.map((x, k) => (k === i ? v : x))))}
            <div className="mt-1 flex justify-end gap-1">
              <button type="button" className={small} onClick={() => move(i, -1)} aria-label="Monter">↑</button>
              <button type="button" className={small} onClick={() => move(i, 1)} aria-label="Descendre">↓</button>
              <button type="button" className={del} onClick={() => onChange(items.filter((_, k) => k !== i))}>Retirer</button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className={small + " mt-2"} onClick={() => onChange([...items, make()])}>Ajouter</button>
    </div>
  );
}

/** Texte riche : gras, italique, listes, intertitre, lien. Le contenu est assaini par l'API à l'enregistrement. */
function RichText({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (ref.current) ref.current.innerHTML = value; /* contenu initial seulement : le bloc a sa propre clé */ }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const cmd = (c: string, arg?: string) => { ref.current?.focus(); document.execCommand(c, false, arg); if (ref.current) onChange(ref.current.innerHTML); };
  const tool = "rounded px-2 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200";
  const keep = (e: React.MouseEvent) => e.preventDefault();
  return (
    <div>
      <span className={labelCls}>Texte</span>
      <div className="mt-1 flex flex-wrap gap-0.5 rounded-t-md border border-b-0 border-slate-300 bg-slate-50 p-1">
        <button type="button" onMouseDown={keep} className={tool} onClick={() => cmd("bold")}><b>G</b></button>
        <button type="button" onMouseDown={keep} className={tool} onClick={() => cmd("italic")}><i>I</i></button>
        <button type="button" onMouseDown={keep} className={tool} onClick={() => cmd("insertUnorderedList")}>Liste</button>
        <button type="button" onMouseDown={keep} className={tool} onClick={() => cmd("insertOrderedList")}>1. 2. 3.</button>
        <button type="button" onMouseDown={keep} className={tool} onClick={() => cmd("formatBlock", "h3")}>Intertitre</button>
        <button type="button" onMouseDown={keep} className={tool} onClick={() => cmd("formatBlock", "p")}>Paragraphe</button>
        <button type="button" onMouseDown={keep} className={tool} onClick={() => { const u = prompt("Adresse du lien (https://…)"); if (u && /^(https:|mailto:|tel:)/.test(u)) cmd("createLink", u); }}>Lien</button>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning data-rich
        onInput={() => ref.current && onChange(ref.current.innerHTML)}
        onPaste={(e) => { e.preventDefault(); document.execCommand("insertText", false, e.clipboardData.getData("text/plain")); }}
        className="doc-rich min-h-[9rem] w-full rounded-b-md border border-slate-300 px-3 py-2 text-sm leading-relaxed focus:border-brand-600 focus:outline-none" />
    </div>
  );
}

function useUpload(onUrl: (url: string) => void) {
  const [state, setState] = useState<{ busy: boolean; error?: string }>({ busy: false });
  const send = async (f: File) => {
    setState({ busy: true });
    try {
      const r = await uploadDocImageAction(await fileToDataUri(f, 2200));
      if (r.ok && r.url) { onUrl(r.url); setState({ busy: false }); } else setState({ busy: false, error: r.error ?? "Envoi impossible." });
    } catch (e: any) { setState({ busy: false, error: e?.message || "Image illisible." }); }
  };
  return { ...state, send };
}

function ImagePick({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const up = useUpload(onChange);
  const file = useRef<HTMLInputElement>(null);
  return (
    <div>
      <span className={labelCls}>{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <button type="button" disabled={up.busy} className={small} onClick={() => file.current?.click()}>{up.busy ? "Envoi…" : value ? "Remplacer" : "Choisir une image"}</button>
        {value ? <button type="button" className={del} onClick={() => onChange("")}>Retirer</button> : null}
        <input ref={file} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) up.send(f); e.target.value = ""; }} />
      </div>
      {up.error ? <p className="mt-1 text-xs text-red-600">{up.error}</p> : null}
    </div>
  );
}

/** Repères numérotés : clic sur l'image pour en poser un, glisser pour le déplacer. */
function MarkerEditor({ b, set }: { b: ImageBlock; set: (p: Partial<ImageBlock>) => void }) {
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<number | null>(null);
  const pos = (e: React.PointerEvent | React.MouseEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: Math.round(Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100)) * 10) / 10, y: Math.round(Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100)) * 10) / 10 };
  };
  const setM = (n: number, p: Partial<Marker>) => set({ markers: b.markers.map((m) => (m.n === n ? { ...m, ...p } : m)) });
  return (
    <div>
      <span className={labelCls}>Repères numérotés</span>
      <p className="mt-0.5 text-[11px] text-muted">Cliquez sur l’image pour poser un repère, glissez-le pour le déplacer.</p>
      <div className="mdoc mt-1">
        <div ref={box} className="cursor-crosshair" onClick={(e) => { const n = Math.max(0, ...b.markers.map((m) => m.n)) + 1; set({ markers: [...b.markers, { n, ...pos(e), label: "" }] }); }}>
          <DocShot b={b}>
            {b.markers.map((m) => (
              <span key={m.n} className="mk" style={{ left: `${m.x}%`, top: `${m.y}%`, cursor: "move", touchAction: "none" }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => { e.stopPropagation(); drag.current = m.n; e.currentTarget.setPointerCapture(e.pointerId); }}
                onPointerMove={(e) => { if (drag.current === m.n) setM(m.n, pos(e)); }}
                onPointerUp={() => { drag.current = null; }}>{m.n}</span>
            ))}
          </DocShot>
        </div>
      </div>
      <div className="mt-2 space-y-1">
        {b.markers.map((m) => (
          <div key={m.n} className="flex items-center gap-1.5">
            <span className="w-5 text-center text-xs font-bold text-accent-700">{m.n}</span>
            <input value={m.label} placeholder="Légende" onChange={(e) => setM(m.n, { label: e.target.value })} className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1 text-xs" />
            <button type="button" className={del} onClick={() => set({ markers: b.markers.filter((x) => x.n !== m.n) })}>Retirer</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ImageForm({ b, set }: { b: ImageBlock; set: (p: Partial<ImageBlock>) => void }) {
  return (
    <>
      <ImagePick label="Image" value={b.src} onChange={(src) => set({ src, crop: null })} />
      {b.crop ? <p className="text-xs text-muted">Image recadrée. <button type="button" className="font-semibold text-brand-700 underline" onClick={() => set({ crop: null })}>Afficher l’image entière</button></p> : null}
      {b.src ? <MarkerEditor b={b} set={set} /> : null}
      <Text label="Légende sous l’image" value={b.caption} onChange={(caption) => set({ caption })} />
      <Field label={`Largeur : ${b.width} %`}><input type="range" min={20} max={100} step={1} value={b.width} onChange={(e) => set({ width: Number(e.target.value) })} className="mt-1 w-full" /></Field>
      <Select label="Cadre" value={b.frame} onChange={(frame) => set({ frame })} options={[["shot", "Capture (bordure et ombre)"], ["phone", "Téléphone"], ["none", "Aucun"]]} />
      <Select label="Liste des repères" value={b.legend} onChange={(legend) => set({ legend })} options={[["none", "Ne pas afficher"], ["right", "À droite de l’image"], ["below", "Sous l’image"]]} />
    </>
  );
}

/** Formulaire du bloc sélectionné. */
export function BlockForm({ b, onChange }: { b: Block; onChange: (patch: Partial<Block>) => void }) {
  const set = onChange as (p: any) => void;
  switch (b.type) {
    case "cover": return <>
      <Text label="Étiquette" value={b.tag} onChange={(tag) => set({ tag })} />
      <Area label="Titre" rows={2} value={b.title} onChange={(title) => set({ title })} />
      <Area label="Sous-titre" value={b.subtitle} onChange={(subtitle) => set({ subtitle })} />
      <ImagePick label="Image de couverture" value={b.image} onChange={(image) => set({ image })} />
      <Text label="Bas de page, à gauche" value={b.footLeft} onChange={(footLeft) => set({ footLeft })} />
      <Text label="Bas de page, à droite" value={b.footRight} onChange={(footRight) => set({ footRight })} />
      <p className="text-[11px] text-muted">{"{edition}"} et {"{date}"} sont remplacés automatiquement.</p>
    </>;
    case "back": return <>
      <Area label="Titre" rows={2} value={b.title} onChange={(title) => set({ title })} />
      <Area label="Texte" rows={4} value={b.text} onChange={(text) => set({ text })} />
      <Text label="Bouton orange" value={b.cta} onChange={(cta) => set({ cta })} />
      <Items label="Liens en bas de page" items={b.links} onChange={(links) => set({ links })} make={() => ({ title: "", text: "" })} render={(l, s) => <div className="space-y-1"><Text label="Titre" value={l.title} onChange={(title) => s({ ...l, title })} /><Text label="Texte" value={l.text} onChange={(text) => s({ ...l, text })} /></div>} />
    </>;
    case "heading": return <>
      <Text label="Surtitre (orange)" value={b.kicker} onChange={(kicker) => set({ kicker })} placeholder="Chapitre 1" />
      <Area label="Titre" rows={2} value={b.title} onChange={(title) => set({ title })} />
      <Area label="Chapô" rows={3} value={b.lead} onChange={(lead) => set({ lead })} />
      <Select label="Dans le sommaire" value={b.toc} onChange={(toc) => set({ toc })} options={[["chapter", "Oui, niveau principal"], ["sub", "Oui, sous-niveau"], ["none", "Non"]]} />
      {b.toc !== "none" ? <Text label="Libellé du sommaire (facultatif)" value={b.tocLabel} onChange={(tocLabel) => set({ tocLabel })} placeholder={b.title} /> : null}
    </>;
    case "subheading": return <Text label="Intertitre" value={b.text} onChange={(text) => set({ text })} />;
    case "text": case "html": return <RichText key={b.id} value={b.html} onChange={(html) => set({ html })} />;
    case "image": return <ImageForm b={b} set={set} />;
    case "callout": return <>
      <Select label="Style" value={b.tone} onChange={(tone) => set({ tone })} options={[["tip", "Conseil (bleu)"], ["warn", "Attention (orange)"]]} />
      <Text label="Titre" value={b.title} onChange={(title) => set({ title })} />
      <Area label="Texte" rows={4} value={b.text} onChange={(text) => set({ text })} />
    </>;
    case "spec": return <>
      <Text label="Titre" value={b.title} onChange={(title) => set({ title })} />
      <Items label="Lignes" items={b.rows} onChange={(rows) => set({ rows })} make={() => ({ a: "", b: "" })} render={(r, s) => <div className="grid grid-cols-2 gap-1"><input aria-label="Champ" placeholder="Champ" value={r.a} onChange={(e) => s({ ...r, a: e.target.value })} className={inputCls} /><input aria-label="Valeur" placeholder="Valeur" value={r.b} onChange={(e) => s({ ...r, b: e.target.value })} className={inputCls} /></div>} />
    </>;
    case "dodont": return <><Lines label="À faire" value={b.good} onChange={(good) => set({ good })} /><Lines label="À éviter" value={b.bad} onChange={(bad) => set({ bad })} /></>;
    case "example": return <>
      <Select label="Type" value={b.tone} onChange={(tone) => set({ tone, label: tone === "good" ? "Bon exemple" : "Mauvais exemple" })} options={[["good", "Bon exemple"], ["bad", "Mauvais exemple"]]} />
      <Text label="Étiquette" value={b.label} onChange={(label) => set({ label })} />
      <Area label="Texte" rows={4} value={b.text} onChange={(text) => set({ text })} />
    </>;
    case "table": {
      const cols = b.head.length;
      const grid = { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` };
      return <>
        <div className="flex gap-1">
          <button type="button" className={small} onClick={() => set({ head: [...b.head, "Colonne"], rows: b.rows.map((r) => [...r, ""]) })}>Ajouter une colonne</button>
          {cols > 1 ? <button type="button" className={del} onClick={() => set({ head: b.head.slice(0, -1), rows: b.rows.map((r) => r.slice(0, -1)) })}>Retirer la dernière</button> : null}
        </div>
        <div className="grid gap-1" style={grid}>{b.head.map((h, i) => <input key={i} aria-label={`En-tête ${i + 1}`} value={h} onChange={(e) => set({ head: b.head.map((x, k) => (k === i ? e.target.value : x)) })} className={inputCls + " font-semibold"} />)}</div>
        <Items label="Lignes" items={b.rows} onChange={(rows) => set({ rows })} make={() => Array(cols).fill("")} render={(r, s) => <div className="grid gap-1" style={grid}>{r.map((c, j) => <input key={j} aria-label={`Colonne ${j + 1}`} value={c} onChange={(e) => s(r.map((x, k) => (k === j ? e.target.value : x)))} className={inputCls} />)}</div>} />
      </>;
    }
    case "checklist": return <Items label="Points" items={b.items} onChange={(items) => set({ items })} make={() => ({ group: false, tag: "", text: "" })} render={(it, s) => <div className="space-y-1">
      <input aria-label="Texte" value={it.text} onChange={(e) => s({ ...it, text: e.target.value })} className={inputCls} />
      <div className="flex items-center gap-2 text-xs">
        <label className="flex items-center gap-1"><input type="checkbox" checked={it.group} onChange={(e) => s({ ...it, group: e.target.checked })} /> Titre de groupe</label>
        {!it.group ? <input aria-label="Étiquette" placeholder="Étiquette (ex. 15 min)" value={it.tag} onChange={(e) => s({ ...it, tag: e.target.value })} className="min-w-0 flex-1 rounded border border-slate-300 px-2 py-1" /> : null}
      </div>
    </div>} />;
    case "columns": return <Select label="Largeur des colonnes" value={b.ratio} onChange={(ratio) => set({ ratio })} options={[["equal", "Égales"], ["wide", "Gauche plus large"]]} />;
    case "toc": return <>
      <Text label="Surtitre" value={b.kicker} onChange={(kicker) => set({ kicker })} />
      <Text label="Titre" value={b.title} onChange={(title) => set({ title })} />
      <p className="text-[11px] text-muted">Le sommaire se remplit tout seul avec les blocs « Titre et chapitre » marqués « Dans le sommaire ».</p>
    </>;
    case "kpis": return <Items label="Chiffres" items={b.items} onChange={(items) => set({ items })} make={() => ({ value: "", label: "" })} render={(k, s) => <div className="space-y-1"><Text label="Chiffre" value={k.value} onChange={(value) => s({ ...k, value })} /><Text label="Libellé" value={k.label} onChange={(label) => s({ ...k, label })} /></div>} />;
    case "benefits": return <Items label="Cartes" items={b.items} onChange={(items) => set({ items })} make={() => ({ title: "", text: "" })} render={(k, s) => <div className="space-y-1"><Text label="Titre" value={k.title} onChange={(title) => s({ ...k, title })} /><Area label="Texte" value={k.text} onChange={(text) => s({ ...k, text })} /></div>} />;
  }
}
