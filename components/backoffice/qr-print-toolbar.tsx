"use client";

import { useState } from "react";
import { PAPER, type PaperFormat } from "./qr-poster";

/** Choix du format (A3 / A4 / A5) et impression des affiches. */
export function QrPrintToolbar({ count, initial = "A4", children }: { count: number; initial?: PaperFormat; children: React.ReactNode }) {
  const [f, setF] = useState<PaperFormat>(initial);
  const p = PAPER[f];
  return (
    <div className="qr-print" style={{ ["--u" as string]: String(p.w / 595) }}>
      <style>{`
        @page { size: ${f} portrait; margin: 0; }
        .qr-sheet { width: ${p.w}mm; height: ${p.h}mm; overflow: hidden; position: relative; box-sizing: border-box;
          -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .qr-box svg { width: 100%; height: 100%; display: block; }
        @media screen {
          .qr-sheets { display: flex; flex-wrap: wrap; gap: 24px; }
          .qr-sheet { zoom: ${f === "A3" ? 0.32 : f === "A4" ? 0.45 : 0.6}; box-shadow: 0 6px 24px rgba(15,23,42,.18); }
        }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          main { padding: 0 !important; }
          .qr-toolbar { display: none !important; }
          .qr-sheets { display: block; }
          .qr-sheet { break-after: page; page-break-after: always; }
          .qr-sheet:last-child { break-after: auto; page-break-after: auto; }
        }
      `}</style>
      <div className="qr-toolbar mb-5 flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <span className="text-sm font-semibold text-ink">{count} affiche{count > 1 ? "s" : ""}</span>
        <div className="flex overflow-hidden rounded-md ring-1 ring-slate-300" role="radiogroup" aria-label="Format d’impression">
          {(Object.keys(PAPER) as PaperFormat[]).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={f === k} onClick={() => setF(k)}
              className={"px-4 py-2 text-sm font-bold " + (f === k ? "bg-brand-700 text-white" : "bg-white text-slate-700 hover:bg-slate-50")}>
              {k}
            </button>
          ))}
        </div>
        <span className="text-xs text-muted">{p.label}</span>
        <button type="button" onClick={() => window.print()} className="ml-auto rounded-md bg-[#FE6600] px-5 py-2 text-sm font-bold text-white hover:opacity-90">
          Imprimer {count > 1 ? `les ${count} affiches` : "l’affiche"}
        </button>
        <p className="w-full text-xs text-muted">Dans la fenêtre d’impression, choisissez le papier {f}, marges « Aucune », et cochez « Graphiques d’arrière-plan » pour le fond bleu. Vous pouvez aussi « Enregistrer en PDF ».</p>
      </div>
      <div className="qr-sheets">{children}</div>
    </div>
  );
}
