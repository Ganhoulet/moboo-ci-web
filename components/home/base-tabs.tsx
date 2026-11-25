"use client";

import { useState } from "react";

/** Onglets ou accordéon de l'élément « Onglets » du constructeur. */
export function BaseTabs({ mode, items }: { mode: "tabs" | "accordion"; items: { title: string; text: string; image: string }[] }) {
  const [active, setActive] = useState(0);
  if (!items.length) return null;
  const Body = ({ x }: { x: { text: string; image: string } }) => (
    <div className={`grid items-start gap-6 ${x.image ? "md:grid-cols-2" : ""}`}>
      <p className="whitespace-pre-line leading-relaxed opacity-90">{x.text}</p>
      {x.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={x.image} alt="" loading="lazy" className="w-full rounded-2xl object-cover" />
      ) : null}
    </div>
  );
  if (mode === "accordion") {
    return (
      <div className="divide-y divide-slate-200 rounded-2xl border border-slate-200">
        {items.map((x, i) => (
          <details key={i} className="group p-5" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">{x.title}<span className="transition group-open:rotate-45">+</span></summary>
            <div className="mt-3"><Body x={x} /></div>
          </details>
        ))}
      </div>
    );
  }
  const cur = items[Math.min(active, items.length - 1)];
  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-2 border-b border-slate-200">
        {items.map((x, i) => (
          <button key={i} type="button" role="tab" aria-selected={i === active} onClick={() => setActive(i)}
            className={"-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition " + (i === active ? "border-accent-600 text-accent-700" : "border-transparent opacity-70 hover:opacity-100")}>{x.title}</button>
        ))}
      </div>
      <div role="tabpanel" className="pt-6"><Body x={cur} /></div>
    </div>
  );
}
