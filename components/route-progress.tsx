"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Barre de chargement en haut de l'écran (et petit rond sur téléphone) dès qu'on touche un lien :
 * la page suivante peut mettre une seconde à arriver, le visiteur voit que ça charge.
 */
export function RouteProgress() {
  const path = usePathname();
  const query = useSearchParams()?.toString();
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Page arrivée : on termine la barre.
  useEffect(() => {
    if (!active) return;
    setWidth(100);
    const t = setTimeout(() => { setActive(false); setWidth(0); }, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, query]);

  useEffect(() => {
    const start = () => {
      setActive(true);
      setWidth(12);
      if (timer.current) clearInterval(timer.current);
      // Avance de plus en plus lentement, sans jamais finir avant la page.
      timer.current = setInterval(() => setWidth((w) => (w >= 90 ? w : w + (90 - w) * 0.12)), 200);
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // même page / ancre
      start();
    };
    const onSubmit = (e: SubmitEvent) => {
      const f = e.target as HTMLFormElement;
      if (!e.defaultPrevented && (f.method || "get").toLowerCase() === "get" && f.action.startsWith(location.origin)) start();
    };
    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit);
    return () => { document.removeEventListener("click", onClick, true); document.removeEventListener("submit", onSubmit); };
  }, []);

  useEffect(() => { if (!active && timer.current) { clearInterval(timer.current); timer.current = null; } }, [active]);
  // Garde-fou : jamais bloquée plus de 15 s (lien qui ne change pas de page).
  useEffect(() => {
    if (!active) return;
    const t = setTimeout(() => { setActive(false); setWidth(0); }, 15_000);
    return () => clearTimeout(t);
  }, [active]);

  if (!active) return null;
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] print:hidden" aria-hidden="true">
        <div className="h-full bg-accent-500 shadow-[0_0_8px_rgba(249,115,22,.7)] transition-[width] duration-200 ease-out" style={{ width: `${width}%` }} />
      </div>
      <div role="status" aria-live="polite" className="pointer-events-none fixed left-1/2 top-20 z-[100] -translate-x-1/2 rounded-full bg-white/95 p-2 shadow-lg ring-1 ring-black/5 md:hidden print:hidden">
        <span className="block h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-accent-600" />
        <span className="sr-only">Chargement…</span>
      </div>
    </>
  );
}
