"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { deleteListingAction, duplicateListingAction, setListingStatusAction } from "@/app/mon-espace/actions";

/** Menu « ⋯ » d'une annonce : modifier, voir, vendu/loué, masquer, dupliquer, supprimer. */
export function ListingRowActions({ id, status, transaction }: { id: string; status: string; transaction: "rent" | "sale" }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const run = (fn: () => Promise<void>) => { setOpen(false); start(fn); };
  const closed = transaction === "sale" ? "SOLD" : "RENTED";
  const item = "flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-slate-50";

  return (
    <div ref={ref} className="relative flex shrink-0 items-center gap-1">
      <Link href={`/mon-espace/annonces/${id}`} className="hidden rounded-lg px-3 py-1.5 text-sm font-semibold text-brand-800 hover:bg-brand-50 sm:inline-flex">
        Modifier
      </Link>
      <button type="button" aria-label="Plus d'actions" onClick={() => setOpen((v) => !v)} disabled={pending}
        className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-50">
        {pending ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-800" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
        )}
      </button>
      {open ? (
        <div className="absolute right-0 top-10 z-30 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
          <Link href={`/mon-espace/annonces/${id}`} className={item + " sm:hidden"}>✏️ Modifier</Link>
          {status === "ACTIVE" ? <Link href={`/annonce/${id}`} target="_blank" className={item}>👁 Voir sur le site</Link> : null}
          {status === "ACTIVE" ? (
            <>
              <button type="button" className={item} onClick={() => run(() => setListingStatusAction(id, closed))}>
                ✅ {transaction === "sale" ? "Marquer vendu" : "Marquer loué"}
              </button>
              <button type="button" className={item} onClick={() => run(() => setListingStatusAction(id, "DISABLED"))}>🙈 Masquer du site</button>
            </>
          ) : (
            <button type="button" className={item} onClick={() => run(() => setListingStatusAction(id, "ACTIVE"))}>🚀 Remettre en ligne</button>
          )}
          <button type="button" className={item} onClick={() => run(() => duplicateListingAction(id))}>📄 Dupliquer</button>
          <button type="button" className={item + " text-red-600"}
            onClick={() => { if (confirm("Supprimer cette annonce ? Elle sera retirée du site.")) run(() => deleteListingAction(id)); }}>
            🗑 Supprimer
          </button>
        </div>
      ) : null}
    </div>
  );
}
