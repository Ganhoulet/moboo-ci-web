"use client";

import { useState } from "react";

export interface ProTab { key: string; label: string; count: number; content: React.ReactNode }

/** Onglets « À vendre / À louer / Transactions réalisées » (contenu rendu côté serveur). */
export function ListingTabs({ tabs }: { tabs: ProTab[] }) {
  const visible = tabs.filter((t) => t.count > 0);
  const [cur, setCur] = useState(visible[0]?.key ?? "");
  if (!visible.length) return <p className="rounded-2xl bg-slate-50 p-6 text-center text-muted">Aucune annonce en ligne pour le moment.</p>;
  return (
    <div>
      <div className="flex gap-6 overflow-x-auto border-b border-slate-200" role="tablist">
        {visible.map((t) => (
          <button key={t.key} type="button" role="tab" aria-selected={cur === t.key} onClick={() => setCur(t.key)}
            className={"-mb-px shrink-0 border-b-2 pb-3 text-sm font-semibold transition " + (cur === t.key ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink")}>
            {t.label} <span className="ml-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs">{t.count}</span>
          </button>
        ))}
      </div>
      <div className="pt-6">{visible.find((t) => t.key === cur)?.content}</div>
    </div>
  );
}
