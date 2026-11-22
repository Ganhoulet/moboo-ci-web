"use client";

import { useState } from "react";

/** Lien public affiché en entier, avec « Copier » et « Ouvrir ». */
export function CopyLink({ href, label }: { href: string; label?: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(href);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch { /* presse-papiers refusé : le lien reste sélectionnable */ }
  };
  return (
    <span className="flex min-w-0 items-center gap-2">
      {label ? <span className="shrink-0 text-xs font-semibold text-slate-600">{label}</span> : null}
      <code className="min-w-0 flex-1 truncate rounded bg-slate-50 px-2 py-1 text-xs text-slate-700 ring-1 ring-slate-200" title={href}>{href}</code>
      <button type="button" onClick={copy} className="shrink-0 rounded px-2 py-1 text-xs font-semibold text-brand-800 ring-1 ring-slate-200 hover:bg-slate-50">{done ? "Copié ✓" : "Copier"}</button>
      <a href={href} target="_blank" rel="noreferrer" className="shrink-0 rounded px-2 py-1 text-xs font-semibold text-brand-800 ring-1 ring-slate-200 hover:bg-slate-50">Ouvrir</a>
    </span>
  );
}
