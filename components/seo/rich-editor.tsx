"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Éditeur de texte simple (titres, gras, listes, liens) avec mode HTML.
 * Produit du HTML propre pour le texte SEO des pages.
 */
export function RichEditor({ value, onChange, minHeight = 320 }: { value: string; onChange: (v: string) => void; minHeight?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"visual" | "html">("visual");
  const last = useRef(value);

  useEffect(() => {
    if (mode === "visual" && ref.current && value !== last.current) {
      ref.current.innerHTML = value || "";
      last.current = value;
    }
  }, [value, mode]);
  useEffect(() => { if (mode === "visual" && ref.current) ref.current.innerHTML = value || ""; }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const emit = () => {
    const html = (ref.current?.innerHTML ?? "").replace(/<div>/g, "<p>").replace(/<\/div>/g, "</p>").replace(/<p><br><\/p>/g, "");
    last.current = html;
    onChange(html);
  };
  const cmd = (c: string, arg?: string) => { ref.current?.focus(); document.execCommand(c, false, arg); emit(); };
  const link = () => {
    const url = window.prompt("Adresse du lien (ex. /maisons-a-louer-cocody ou https://…)");
    if (url && /^(\/|https?:\/\/|mailto:|tel:)/.test(url.trim())) cmd("createLink", url.trim());
  };

  const B = ({ label, title, onClick }: { label: React.ReactNode; title: string; onClick: () => void }) => (
    <button type="button" title={title} onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="grid h-8 min-w-8 place-items-center rounded px-2 text-sm font-semibold text-slate-700 hover:bg-slate-200">{label}</button>
  );

  return (
    <div className="overflow-hidden rounded-lg border border-slate-300 bg-white focus-within:border-brand-600">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50 px-2 py-1">
        {mode === "visual" ? (
          <>
            <B label="P" title="Paragraphe" onClick={() => cmd("formatBlock", "<p>")} />
            <B label="H2" title="Sous-titre" onClick={() => cmd("formatBlock", "<h2>")} />
            <B label="H3" title="Sous-titre de niveau 3" onClick={() => cmd("formatBlock", "<h3>")} />
            <span className="mx-1 h-5 w-px bg-slate-300" />
            <B label={<b>G</b>} title="Gras" onClick={() => cmd("bold")} />
            <B label={<i>I</i>} title="Italique" onClick={() => cmd("italic")} />
            <B label="• Liste" title="Liste à puces" onClick={() => cmd("insertUnorderedList")} />
            <B label="1. Liste" title="Liste numérotée" onClick={() => cmd("insertOrderedList")} />
            <B label="🔗 Lien" title="Lien" onClick={link} />
            <B label="⌫ Lien" title="Retirer le lien" onClick={() => cmd("unlink")} />
          </>
        ) : <span className="px-2 text-xs text-muted">Mode HTML</span>}
        <button type="button" onClick={() => { if (mode === "visual") emit(); setMode(mode === "visual" ? "html" : "visual"); }}
          className="ml-auto rounded px-2 py-1 text-xs font-semibold text-brand-800 hover:bg-slate-200">{mode === "visual" ? "Voir le HTML" : "Éditeur visuel"}</button>
      </div>
      {mode === "visual" ? (
        <div ref={ref} contentEditable suppressContentEditableWarning onInput={emit} onBlur={emit}
          className="rich-text max-h-[70vh] overflow-y-auto px-4 py-3 outline-none" style={{ minHeight }} />
      ) : (
        <textarea value={value} onChange={(e) => { last.current = e.target.value; onChange(e.target.value); }} spellCheck={false}
          className="block w-full resize-y px-4 py-3 font-mono text-xs outline-none" style={{ minHeight }} />
      )}
    </div>
  );
}
