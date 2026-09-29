"use client";

import Link from "next/link";
import { useState } from "react";

export interface LinkColumn { title: string; links: { href: string; label: string }[] }
export interface LinkTab { title: string; columns: LinkColumn[] }

function Columns({ columns, centered, max }: { columns: LinkColumn[]; centered: boolean; max: number }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <div className={"grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-4 " + (centered ? "text-center" : "")}>
      {columns.map((c) => {
        const all = open[c.title];
        const links = all ? c.links : c.links.slice(0, max);
        return (
          <div key={c.title} className="min-w-0">
            <p className={"font-semibold text-ink " + (centered ? "text-lg" : "")}>{c.title}</p>
            <ul className={"mt-3 space-y-2.5 " + (centered ? "text-[15px]" : "text-sm")}>
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className={centered ? "font-medium text-brand-700 hover:underline" : "text-slate-600 hover:text-ink hover:underline"}>{l.label}</Link>
                </li>
              ))}
            </ul>
            {c.links.length > max ? (
              <button type="button" onClick={() => setOpen({ ...open, [c.title]: !all })} className="mt-2 text-sm font-semibold text-ink underline decoration-slate-300 underline-offset-4">
                {all ? "Voir moins" : `Voir tout (${c.links.length})`}
              </button>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Liens vers les pages SEO : onglets par ville + colonnes par catégorie (façon Magicbricks), ou colonnes seules. */
export function SeoLinks({ tabs, style, max }: { tabs: LinkTab[]; style: "tabs" | "columns"; max: number }) {
  const [i, setI] = useState(0);
  if (style === "columns" || tabs.length < 2) {
    const merged = new Map<string, LinkColumn>();
    for (const t of tabs) for (const c of t.columns) {
      const m = merged.get(c.title) ?? { title: c.title, links: [] };
      m.links.push(...c.links.filter((l) => !m.links.some((x) => x.href === l.href)));
      merged.set(c.title, m);
    }
    return <Columns columns={Array.from(merged.values())} centered={style === "columns"} max={max} />;
  }
  const cur = tabs[Math.min(i, tabs.length - 1)];
  return (
    <div>
      <div className="flex gap-6 overflow-x-auto border-b border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" role="tablist">
        {tabs.map((t, k) => (
          <button key={t.title} type="button" role="tab" aria-selected={k === i} onClick={() => setI(k)}
            className={"-mb-px shrink-0 border-b-[3px] pb-3 text-[15px] font-semibold transition " + (k === i ? "border-accent-600 text-ink" : "border-transparent text-slate-500 hover:text-ink")}>
            {t.title}
          </button>
        ))}
      </div>
      <div className="pt-6"><Columns columns={cur.columns} centered={false} max={max} /></div>
    </div>
  );
}
