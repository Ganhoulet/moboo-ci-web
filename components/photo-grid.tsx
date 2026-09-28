"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const MAX_PHOTOS = 12;

/**
 * Galerie style Airbnb : une grande photo + 4 vignettes, bouton « Voir les
 * N photos » et visionneuse plein écran (flèches, clavier, glissement).
 * Toutes les photos de l'annonce sont accessibles (jusqu'à 12).
 */
export function PhotoGrid({ photos, alt }: { photos: string[]; alt: string }) {
  const list = Array.from(new Set((photos ?? []).filter(Boolean))).slice(0, MAX_PHOTOS);
  const [open, setOpen] = useState<number | null>(null);

  if (list.length === 0) {
    return (
      <div className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-slate-100 text-brand-300">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
          <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  const [main, ...rest] = list;
  const thumbs = rest.slice(0, 4);

  return (
    <>
      <div className="relative grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setOpen(0)}
          className="relative aspect-[4/3] overflow-hidden rounded-2xl sm:aspect-auto sm:min-h-[20rem]"
          aria-label="Agrandir la photo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={main} alt={alt} decoding="async" className="h-full w-full object-cover transition hover:scale-[1.02]" />
        </button>
        {thumbs.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {thumbs.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => setOpen(i + 1)}
                className="relative aspect-[4/3] overflow-hidden rounded-xl"
                aria-label={`Photo ${i + 2}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition hover:scale-[1.03]" />
              </button>
            ))}
          </div>
        )}
        {list.length > 1 && (
          <button
            type="button"
            onClick={() => setOpen(0)}
            className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white/95 px-3 py-1.5 text-sm font-semibold text-ink shadow-sm backdrop-blur transition hover:bg-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            Voir les {list.length} photos
          </button>
        )}
      </div>

      {open !== null && <Lightbox photos={list} alt={alt} start={open} onClose={() => setOpen(null)} />}
    </>
  );
}

function Lightbox({
  photos,
  alt,
  start,
  onClose,
}: {
  photos: string[];
  alt: string;
  start: number;
  onClose: () => void;
}) {
  const [i, setI] = useState(start);
  const touchX = useRef<number | null>(null);
  const n = photos.length;
  const prev = useCallback(() => setI((v) => (v - 1 + n) % n), [n]);
  const next = useCallback(() => setI((v) => (v + 1) % n), [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, prev, next]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photos — ${alt}`}
      className="fixed inset-0 z-[60] flex flex-col bg-black/95"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-semibold">{i + 1} / {n}</span>
        <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Fermer">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-2 sm:px-16">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={photos[i]} src={photos[i]} alt={`${alt} — photo ${i + 1}`} className="max-h-full max-w-full object-contain" />
        {n > 1 && (
          <>
            <button type="button" onClick={prev} aria-label="Photo précédente"
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 sm:block">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" onClick={next} aria-label="Photo suivante"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 sm:block">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {photos.map((src, k) => (
            <button key={src} type="button" onClick={() => setI(k)}
              className={"h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 " + (k === i ? "border-white" : "border-transparent opacity-60 hover:opacity-100")}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
