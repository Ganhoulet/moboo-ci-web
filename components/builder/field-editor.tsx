"use client";

import { useState } from "react";
import type { BlockField } from "@/lib/page-blocks";
import { uploadImageAction } from "@/app/mon-espace/actions";

export type Opt = { value: string; label: string };

/** Réduit une image dans le navigateur (1600 px) avant l'envoi. */
async function shrinkImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return file.type === "image/png" ? c.toDataURL("image/png") : c.toDataURL("image/jpeg", 0.85);
  } finally { URL.revokeObjectURL(url); }
}

function ImageInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {value ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="h-24 w-full rounded-lg border border-slate-200 object-cover" />
      ) : null}
      <div className="flex gap-2">
        <input className="input flex-1 text-sm" placeholder="https://…" value={value} onChange={(e) => onChange(e.target.value)} />
        <label className={"cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-ink hover:bg-slate-50 " + (busy ? "opacity-60" : "")}>
          {busy ? "Envoi…" : "Téléverser"}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={busy} onChange={async (e) => {
            const f = e.target.files?.[0]; e.target.value = "";
            if (!f) return;
            setBusy(true); setErr(null);
            try {
              const r = await uploadImageAction(await shrinkImage(f), "annonce");
              if (r.ok && r.url) onChange(r.url); else setErr(r.error ?? "Envoi impossible.");
            } catch { setErr("Image illisible."); } finally { setBusy(false); }
          }} />
        </label>
        {value ? <button type="button" onClick={() => onChange("")} className="text-sm font-semibold text-red-600">Retirer</button> : null}
      </div>
      {err ? <p className="text-xs text-red-600">{err}</p> : null}
    </div>
  );
}

/** Un champ du formulaire d'un bloc (types du catalogue lib/page-blocks). */
export function FieldEditor({ f, value, onChange, types }: { f: BlockField; value: any; onChange: (v: any) => void; types: Opt[] }) {
  const options: Opt[] = f.options === "types" ? [{ value: "", label: "Tous les types" }, ...types] : (f.options ?? []);
  switch (f.type) {
    case "bool":
      return (
        <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-brand-700" />
          {f.label}
        </label>
      );
    case "textarea":
      return <textarea className="input min-h-[80px] text-sm" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "html":
      return <textarea className="input min-h-[220px] font-mono text-[12px]" spellCheck={false} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return <input type="number" className="input w-40 text-sm" min={f.min} max={f.max} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))} />;
    case "image":
      return <ImageInput value={value ?? ""} onChange={onChange} />;
    case "select":
      return (
        <select className="input text-sm" value={value ?? ""} onChange={(e) => onChange(e.target.value)}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    case "multi": {
      const list: string[] = Array.isArray(value) ? value : [];
      const opts = f.options === "types" ? types : options;
      return (
        <div className="flex flex-wrap gap-2">
          {opts.map((o) => {
            const on = list.includes(o.value);
            return (
              <button key={o.value} type="button" onClick={() => onChange(on ? list.filter((x) => x !== o.value) : [...list, o.value])}
                className={"rounded-full border px-3 py-1 text-xs font-semibold transition " + (on ? "border-brand-700 bg-brand-700 text-white" : "border-slate-300 bg-white text-slate-700 hover:border-slate-400")}>
                {o.label}
              </button>
            );
          })}
        </div>
      );
    }
    case "list": {
      const items: any[] = Array.isArray(value) ? value : [];
      const set = (i: number, patch: any) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x)));
      const move = (i: number, d: -1 | 1) => { const a = [...items]; const [x] = a.splice(i, 1); a.splice(i + d, 0, x); onChange(a); };
      return (
        <div className="space-y-3">
          {items.map((it, i) => (
            <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
              <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
                <span>{f.itemLabel ?? "Élément"} {i + 1}{it?.title || it?.label || it?.name ? ` · ${it.title || it.label || it.name}` : ""}</span>
                <span className="flex gap-2">
                  <button type="button" disabled={i === 0} onClick={() => move(i, -1)} className="disabled:opacity-30" aria-label="Monter">▲</button>
                  <button type="button" disabled={i === items.length - 1} onClick={() => move(i, 1)} className="disabled:opacity-30" aria-label="Descendre">▼</button>
                  <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-red-600">Supprimer</button>
                </span>
              </div>
              <div className="space-y-2">
                {(f.fields ?? []).map((sf) => (
                  <div key={sf.key}>
                    {sf.type !== "bool" ? <p className="mb-1 text-xs font-semibold text-slate-600">{sf.label}</p> : null}
                    <FieldEditor f={sf} value={it?.[sf.key]} onChange={(v) => set(i, { [sf.key]: v })} types={types} />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => onChange([...items, Object.fromEntries((f.fields ?? []).map((sf) => [sf.key, sf.type === "number" ? 0 : ""]))])}
            className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-sm font-semibold text-brand-800 hover:bg-white">
            + Ajouter {f.itemLabel ? f.itemLabel.toLowerCase() : "un élément"}
          </button>
        </div>
      );
    }
    default:
      return <input className="input text-sm" type={f.type === "url" ? "text" : "text"} placeholder={f.type === "url" ? "/annonces?… ou https://…" : undefined} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
}
