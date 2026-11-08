"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { docCss } from "@/components/documents/doc-css";
import { DocPageView } from "@/components/documents/doc-render";
import { buildToc, type DocFull } from "@/lib/documents/types";

/** Aperçu complet et export PDF par l'impression du navigateur (format exact, marges nulles, couleurs gardées). */
export function DocumentPrint({ doc }: { doc: DocFull }) {
  const root = useRef<HTMLDivElement>(null);
  const [over, setOver] = useState<number[]>([]);
  const toc = useMemo(() => buildToc(doc.data.pages), [doc.data.pages]);

  useEffect(() => {
    const before = document.title;
    document.title = `${doc.title} - édition ${doc.edition}`;
    return () => { document.title = before; };
  }, [doc.title, doc.edition]);

  useEffect(() => {
    const check = () => {
      const out: number[] = [];
      root.current?.querySelectorAll<HTMLElement>("section.page").forEach((s, i) => {
        const c = s.querySelector<HTMLElement>(".pc");
        if (c && c.scrollHeight > c.clientHeight + 2) out.push(i + 1);
      });
      setOver(out);
    };
    void document.fonts?.ready.then(check);
    const imgs = root.current?.querySelectorAll("img") ?? [];
    imgs.forEach((i) => i.addEventListener("load", check));
    return () => imgs.forEach((i) => i.removeEventListener("load", check));
  }, [doc]);

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: docCss(doc.format) }} />
      <style dangerouslySetInnerHTML={{ __html: `
        @page { size: ${doc.format} portrait; margin: 0; }
        @media screen {
          .mdoc-sheets { zoom: ${doc.format === "A5" ? 1 : 0.8}; display: flex; flex-direction: column; align-items: center; gap: 24px; }
          .mdoc-sheets section.page { box-shadow: 0 6px 24px rgba(15,23,42,.18); }
        }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; min-height: 0 !important; height: auto !important; }
          main { padding: 0 !important; }
          div:has(> aside), div:has(> main) { display: block !important; min-height: 0 !important; background: #fff !important; max-width: none !important; }
          body > *:not(:has(.mdoc-sheets)) { display: none !important; }
          .mdoc-toolbar { display: none !important; }
          .mdoc-sheets section.page { break-after: page; page-break-after: always; }
          .mdoc-sheets section.page:last-child { break-after: auto; page-break-after: auto; }
        }
      ` }} />
      <div className="mdoc-toolbar mb-4 flex flex-wrap items-center gap-3 rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
        <Link href={`/admin/documents/${doc.id}`} className="text-sm text-brand-700 hover:underline">← Revenir à l’éditeur</Link>
        <span className="text-sm font-semibold text-ink">{doc.title} · {doc.data.pages.length} pages · {doc.format}</span>
        <button type="button" onClick={() => window.print()} className="ml-auto rounded-md bg-brand-700 px-5 py-2 text-sm font-bold text-white hover:bg-brand-800">Exporter en PDF</button>
        <p className="w-full text-xs text-muted">Dans la fenêtre qui s’ouvre, choisissez « Enregistrer au format PDF », marges « Aucune », et cochez « Graphiques d’arrière-plan ». Utilisez Chrome pour un rendu identique.</p>
        {over.length ? <p role="alert" className="w-full rounded bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">Contenu coupé en page {over.join(", ")} : revenez à l’éditeur pour le raccourcir ou le répartir sur une nouvelle page.</p> : null}
      </div>
      <div ref={root} className="mdoc mdoc-sheets">
        {doc.data.pages.map((p, i) => <DocPageView key={p.id} page={p} index={i} meta={doc} data={doc.data} toc={toc} />)}
      </div>
    </div>
  );
}
