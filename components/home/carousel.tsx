"use client";

import { useRef } from "react";

/** Rangée défilante (flèches sur ordinateur, glisser sur téléphone). */
export function Carousel({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const go = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.85, behavior: "smooth" });
  const btn = "absolute top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-md ring-1 ring-black/5 transition hover:scale-105 md:grid";
  return (
    <div className="relative">
      <button type="button" aria-label={`${label} : précédent`} onClick={() => go(-1)} className={btn + " -left-4"}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <div ref={ref} className="-mx-4 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-4 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {children}
      </div>
      <button type="button" aria-label={`${label} : suivant`} onClick={() => go(1)} className={btn + " -right-4"}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
    </div>
  );
}
