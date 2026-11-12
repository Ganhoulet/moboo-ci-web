"use client";

import { useState } from "react";

/** Texte à copier en un clic (kit Google Business). */
export function CopyText({ label, text, multiline = false }: { label: string; text: string; multiline?: boolean }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{label}</p>
        <button type="button" onClick={() => { navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1600); }).catch(() => undefined); }}
          className="rounded-full border border-slate-300 px-3 py-1 text-xs font-semibold text-ink hover:border-ink">{ok ? "Copié ✓" : "Copier"}</button>
      </div>
      <p className={`mt-2 text-sm text-muted ${multiline ? "whitespace-pre-line" : "break-all"}`}>{text}</p>
    </div>
  );
}
