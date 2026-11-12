"use client";

import { useState } from "react";
import type { PageTab } from "@/lib/site-services";

/** Onglets d'une page de service (formules du ménage, missions de la conciergerie, parties de l'état des lieux). */
export function ServiceTabs({ tabs }: { tabs: PageTab[] }) {
  const [i, setI] = useState(0);
  const t = tabs[Math.min(i, tabs.length - 1)];
  if (!t) return null;
  return (
    <div>
      <div role="tablist" aria-label="Rubriques" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {tabs.map((x, k) => (
          <button key={x.title} type="button" role="tab" aria-selected={k === i} aria-controls="svc-tab-panel" onClick={() => setI(k)}
            className={"shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition " + (k === i ? "bg-ink text-white shadow-md" : "bg-white text-ink ring-1 ring-slate-200 hover:ring-slate-400")}>
            {x.title}
          </button>
        ))}
      </div>
      <div id="svc-tab-panel" role="tabpanel" className="mt-6 grid overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 lg:grid-cols-2">
        {t.image ? (
          <div className="relative aspect-[4/3] bg-slate-100 lg:aspect-auto lg:min-h-[380px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- photos réglées au back-office (tout hébergeur https) */}
            <img key={t.image} src={t.image} alt={t.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          </div>
        ) : null}
        <div className="p-6 sm:p-10">
          <h3 className="font-display text-2xl font-extrabold text-ink">{t.title}</h3>
          {t.intro ? <p className="mt-2 text-slate-600">{t.intro}</p> : null}
          <ul className="mt-6 grid gap-3">
            {t.items.map((it) => (
              <li key={it} className="flex gap-3 text-[15px] text-slate-800">
                <span aria-hidden className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">✓</span>
                {it}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
