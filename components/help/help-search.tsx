"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { suggestHelpAction } from "@/app/aide/actions";
import type { HelpCard } from "@/lib/help";

/** Barre de recherche du centre d'aide, avec suggestions pendant la frappe. */
export function HelpSearch({ initial = "", big = false }: { initial?: string; big?: boolean }) {
  const router = useRouter();
  const [q, setQ] = useState(initial);
  const [items, setItems] = useState<HelpCard[]>([]);
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) { setItems([]); return; }
    const t = setTimeout(() => { void suggestHelpAction(q).then(setItems).catch(() => setItems([])); }, 250);
    return () => clearTimeout(t);
  }, [q]);
  useEffect(() => {
    const close = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div ref={box} className="relative w-full">
      <form role="search" onSubmit={(e) => { e.preventDefault(); if (q.trim()) router.push(`/aide/recherche?q=${encodeURIComponent(q.trim())}`); }}
        className={"flex items-center gap-2 rounded-full bg-white shadow-lg ring-1 ring-slate-200 " + (big ? "p-2 pl-5" : "p-1.5 pl-4")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-slate-400" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        <input value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} aria-label="Rechercher dans l’aide"
          placeholder="Ex. publier une annonce, payer l’acompte, alerte…" className={"min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-slate-400 " + (big ? "py-2 text-base" : "py-1.5 text-sm")} />
        <button type="submit" className={"shrink-0 rounded-full bg-accent-600 font-bold text-white hover:bg-accent-700 " + (big ? "px-6 py-3 text-sm" : "px-4 py-2 text-xs")}>Rechercher</button>
      </form>
      {open && items.length ? (
        <ul className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl bg-white text-left shadow-xl ring-1 ring-slate-200">
          {items.map((i) => (
            <li key={i.slug}>
              <Link href={`/aide/article/${i.slug}`} onClick={() => setOpen(false)} className="block px-5 py-3 hover:bg-slate-50">
                <span className="block text-sm font-semibold text-ink">{i.kind === "faq" ? "❓ " : ""}{i.title}</span>
                <span className="block text-xs text-muted">{i.audienceTitle}</span>
              </Link>
            </li>
          ))}
          <li><Link href={`/aide/recherche?q=${encodeURIComponent(q.trim())}`} onClick={() => setOpen(false)} className="block bg-slate-50 px-5 py-2.5 text-xs font-semibold text-brand-800 hover:underline">Voir tous les résultats pour « {q.trim()} »</Link></li>
        </ul>
      ) : null}
    </div>
  );
}
