"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createDocumentAction } from "@/app/admin/documents/actions";
import type { ZoneOption } from "@/lib/documents/zone";
import { KIND_LABEL, type DocFormat, type DocKind } from "@/lib/documents/types";
import { Field, inputCls } from "./block-form";

export interface TemplateCard { key: string; name: string; description: string; format: DocFormat; kind: DocKind; needsZone: boolean }

/** Création d'un document : page blanche (type, format) ou modèle. */
export function NewDocument({ templates, zones }: { templates: TemplateCard[]; zones: ZoneOption[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<DocKind>("livre-blanc");
  const [format, setFormat] = useState<DocFormat>("A4");
  const [zone, setZone] = useState("");
  const create = (input: Parameters<typeof createDocumentAction>[0]) => start(async () => {
    setError("");
    const r = await createDocumentAction(input);
    if (r.ok && r.id) router.push(`/admin/documents/${r.id}`); else setError(r.error ?? "Création impossible.");
  });
  return (
    <div className="space-y-5">
      {error ? <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
      <section className="rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-display text-lg font-bold text-ink">Page blanche</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <Field label="Titre"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nouveau document" className={inputCls} /></Field>
          <Field label="Type"><select value={kind} onChange={(e) => setKind(e.target.value as DocKind)} className={inputCls}>{Object.entries(KIND_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></Field>
          <Field label="Format"><select value={format} onChange={(e) => setFormat(e.target.value as DocFormat)} className={inputCls}><option value="A4">A4</option><option value="A5">A5</option></select></Field>
        </div>
        <button type="button" disabled={pending} onClick={() => create({ title, kind, format })} className="mt-4 rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">Créer le document</button>
      </section>
      <section>
        <h2 className="font-display text-lg font-bold text-ink">Partir d’un modèle</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((t) => (
            <div key={t.key} className="flex flex-col rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200">
              <p className="text-xs font-semibold text-accent-700">{KIND_LABEL[t.kind]} · {t.format}</p>
              <h3 className="mt-1 font-display font-bold text-ink">{t.name}</h3>
              <p className="mt-1 flex-1 text-sm text-muted">{t.description}</p>
              {t.needsZone ? (
                <div className="mt-3"><Field label="Zone"><select value={zone} onChange={(e) => setZone(e.target.value)} className={inputCls}><option value="">Choisir…</option>{zones.map((z) => <option key={z.slug} value={z.slug}>{z.name}{z.city && z.city !== z.name ? ` (${z.city})` : ""} · {z.rent + z.sale} annonces</option>)}</select></Field></div>
              ) : null}
              <button type="button" disabled={pending || (t.needsZone && !zone)} onClick={() => create({ template: t.key, zone: t.needsZone ? zone : undefined })} className="mt-4 self-start rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-brand-800 ring-1 ring-brand-700 hover:bg-brand-50 disabled:opacity-50">Utiliser ce modèle</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
