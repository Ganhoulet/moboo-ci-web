"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { activityAction } from "@/app/signals-actions";
import type { ActivityFeed } from "@/lib/signals";

const HIDDEN = /^\/(admin|administration|mon-espace|compte|connexion|inscription|suppression-compte)(\/|$)/;

/** Notifications d'activité réelle et anonyme (« Un logement meublé vient d'être réservé à Cocody »). */
export function ActivityToasts() {
  const pathname = usePathname();
  const [feed, setFeed] = useState<ActivityFeed | null>(null);
  const [cur, setCur] = useState<ActivityFeed["items"][number] | null>(null);
  const idx = useRef(0);

  useEffect(() => {
    if (HIDDEN.test(pathname)) return;
    try { if (localStorage.getItem("moboo_toasts_off") === "1") return; } catch { /* */ }
    let alive = true;
    activityAction().then((f) => { if (alive && f?.enabled && f.items.length) setFeed(f); }).catch(() => {});
    return () => { alive = false; };
  }, [pathname]);

  useEffect(() => {
    if (!feed || HIDDEN.test(pathname)) return;
    const shownKey = "moboo_toasts_shown";
    const shown = () => { try { return Number(sessionStorage.getItem(shownKey) || 0); } catch { return 0; } };
    let hide: ReturnType<typeof setTimeout> | undefined;
    const show = () => {
      if (shown() >= feed.max || document.visibilityState !== "visible") return;
      const item = feed.items[idx.current % feed.items.length];
      idx.current++;
      setCur(item);
      try { sessionStorage.setItem(shownKey, String(shown() + 1)); } catch { /* */ }
      hide = setTimeout(() => setCur(null), 7000);
    };
    const first = setTimeout(show, 8000);
    const t = setInterval(show, Math.max(8, feed.intervalSec) * 1000);
    return () => { clearTimeout(first); clearInterval(t); if (hide) clearTimeout(hide); };
  }, [feed, pathname]);

  if (!cur || HIDDEN.test(pathname)) return null;
  const body = (
    <>
      <span className="text-lg" aria-hidden>{cur.kind === "event" ? "🎉" : cur.kind === "closed" ? "🔑" : "✅"}</span>
      <span className="min-w-0"><span className="block text-sm font-semibold text-ink">{cur.text}</span><span className="text-xs text-muted">{cur.ago}</span></span>
    </>
  );
  return (
    <div role="status" aria-live="polite" className="fixed bottom-20 left-4 z-[60] max-w-[calc(100vw-2rem)] animate-[fadeIn_.3s_ease-out] sm:bottom-6 sm:max-w-sm">
      <div className="flex items-start gap-3 rounded-2xl bg-white p-3 pr-8 shadow-lg ring-1 ring-slate-200">
        {cur.href ? <Link href={cur.href} className="flex items-start gap-3" onClick={() => setCur(null)}>{body}</Link> : <div className="flex items-start gap-3">{body}</div>}
        <button type="button" aria-label="Fermer" onClick={() => setCur(null)} className="absolute right-2 top-2 rounded p-1 text-slate-400 hover:text-slate-700">✕</button>
      </div>
      <button type="button" onClick={() => { try { localStorage.setItem("moboo_toasts_off", "1"); } catch { /* */ } setFeed(null); setCur(null); }}
        className="mt-1 pl-2 text-[11px] text-slate-500 underline">Ne plus afficher</button>
    </div>
  );
}
