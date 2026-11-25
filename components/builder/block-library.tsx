"use client";

import { useState } from "react";
import type { BlockDef } from "@/lib/page-blocks";

/**
 * Bibliothèque de blocs façon Elementor : « Éléments de base » en tuiles
 * (titre, image, bouton…), puis les sections prêtes à l'emploi, avec recherche.
 */
export function BlockLibrary({ blocks, onPick }: { blocks: BlockDef[]; onPick: (type: string) => void }) {
  const [q, setQ] = useState("");
  const [openBase, setOpenBase] = useState(true);
  const [openSections, setOpenSections] = useState(true);
  const norm = (v: string) => v.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const match = (b: BlockDef) => !q.trim() || norm(`${b.label} ${b.description}`).includes(norm(q.trim()));
  const base = blocks.filter((b) => b.group === "base" && match(b));
  const sections = blocks.filter((b) => b.group !== "base" && match(b));
  return (
    <div className="space-y-3">
      <input className="input w-full text-sm" placeholder="Rechercher un élément…" value={q} onChange={(e) => setQ(e.target.value)} />
      {base.length ? (
        <div>
          <button type="button" onClick={() => setOpenBase((v) => !v)} className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink">
            <span className={"text-[10px] transition " + (openBase ? "rotate-90" : "")}>▶</span> Éléments de base
          </button>
          {openBase ? (
            <div className="grid grid-cols-2 gap-2">
              {base.map((b) => (
                <button key={b.type} type="button" onClick={() => onPick(b.type)} title={b.description}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 py-3 text-center transition hover:border-brand-400 hover:bg-brand-50">
                  <span className="text-2xl leading-none">{b.icon}</span>
                  <span className="text-xs font-semibold text-ink">{b.label}</span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {sections.length ? (
        <div>
          <button type="button" onClick={() => setOpenSections((v) => !v)} className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink">
            <span className={"text-[10px] transition " + (openSections ? "rotate-90" : "")}>▶</span> Sections prêtes à l’emploi
          </button>
          {openSections ? (
            <div className="grid gap-1.5">
              {sections.map((b) => (
                <button key={b.type} type="button" onClick={() => onPick(b.type)} className="flex items-start gap-2 rounded-md p-2 text-left ring-1 ring-slate-200 hover:bg-brand-50">
                  <span className="text-xl">{b.icon}</span>
                  <span><span className="block text-sm font-semibold text-ink">{b.label}</span><span className="block text-xs text-muted">{b.description}</span></span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
      {!base.length && !sections.length ? <p className="text-sm text-muted">Aucun élément ne correspond.</p> : null}
    </div>
  );
}
