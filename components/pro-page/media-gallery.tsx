"use client";

import { useCallback, useEffect, useState } from "react";
import type { ProMedia } from "@/lib/api";

const Play = ({ big }: { big?: boolean }) => (
  <span className={"absolute inset-0 grid place-items-center"}>
    <span className={"grid place-items-center rounded-full bg-white/90 text-ink shadow-lg ring-1 ring-black/5 transition group-hover:scale-110 " + (big ? "h-16 w-16" : "h-11 w-11")}>
      <svg viewBox="0 0 24 24" className={big ? "ml-1 h-7 w-7" : "ml-0.5 h-5 w-5"} fill="currentColor" aria-hidden><path d="M8 5.5v13l11-6.5z" /></svg>
    </span>
  </span>
);

function Thumb({ m, big, onClick, more }: { m: ProMedia; big?: boolean; onClick: () => void; more?: number }) {
  const src = m.type === "photo" ? m.url : m.thumb;
  return (
    <button type="button" onClick={onClick} className="group relative block h-full w-full overflow-hidden bg-slate-900" aria-label={m.caption || (m.type === "video" ? "Lire la vidéo" : "Voir la photo")}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={m.caption || ""} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105 group-hover:opacity-90" />
      ) : m.provider === "upload" ? (
        <video src={`${m.url}#t=0.5`} preload="metadata" muted playsInline className="h-full w-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center bg-gradient-to-br from-brand-800 to-brand-900 text-sm font-semibold text-white/80">{m.provider === "tiktok" ? "TikTok" : m.provider === "vimeo" ? "Vimeo" : "Vidéo"}</span>
      )}
      {m.type === "video" ? <Play big={big} /> : null}
      {m.caption && big ? <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-left text-sm font-semibold text-white">{m.caption}</span> : null}
      {more ? <span className="absolute inset-0 grid place-items-center bg-black/55 font-display text-lg font-bold text-white">+{more}</span> : null}
    </button>
  );
}

/** Photos et vidéos de présentation (mosaïque façon Airbnb + visionneuse plein écran). */
export function MediaGallery({ media, name }: { media: ProMedia[]; name: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const close = useCallback(() => setOpen(null), []);
  const go = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + media.length) % media.length)), [media.length]);
  useEffect(() => {
    if (open === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") go(1); if (e.key === "ArrowLeft") go(-1); };
    document.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [open, close, go]);
  if (!media.length) return null;
  // Vidéo en tête : c'est la présentation de l'agent.
  const ordered = [...media.filter((m) => m.type === "video"), ...media.filter((m) => m.type === "photo")];
  const first = ordered[0];
  const rest = ordered.slice(1, 5);
  const idx = (m: ProMedia) => media.indexOf(m);
  const cur = open !== null ? media[open] : null;

  return (
    <>
      <div className={"grid gap-2 overflow-hidden rounded-3xl " + (rest.length ? "h-[300px] grid-cols-2 sm:h-[380px] sm:grid-cols-4 sm:grid-rows-2" : "aspect-video")}>
        <div className={rest.length ? "col-span-2 row-span-2" : ""}><Thumb m={first} big onClick={() => setOpen(idx(first))} /></div>
        {rest.map((m, i) => (
          <div key={m.id} className={"hidden sm:block" + (rest.length < 3 ? " row-span-2" : "")}>
            <Thumb m={m} onClick={() => setOpen(idx(m))} more={i === rest.length - 1 && ordered.length > 5 ? ordered.length - 5 : undefined} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-muted sm:hidden">
        {ordered.slice(1).map((m) => (
          <button key={m.id} type="button" onClick={() => setOpen(idx(m))} className="rounded-full bg-white px-3 py-1 ring-1 ring-slate-200">{m.type === "video" ? "▶ Vidéo" : "Photo"}{m.caption ? ` · ${m.caption}` : ""}</button>
        ))}
      </div>

      {cur ? (
        <div className="fixed inset-0 z-[80] flex flex-col bg-black/95" role="dialog" aria-modal="true" aria-label={`Médias de ${name}`} onClick={close}>
          <div className="flex items-center justify-between p-4 text-white" onClick={(e) => e.stopPropagation()}>
            <span className="text-sm font-semibold">{open! + 1} / {media.length}{cur.caption ? ` · ${cur.caption}` : ""}</span>
            <button type="button" onClick={close} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-xl hover:bg-white/20" aria-label="Fermer">×</button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-6" onClick={(e) => e.stopPropagation()}>
            {cur.type === "photo" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cur.url} alt={cur.caption || ""} className="max-h-[80vh] max-w-full rounded-xl object-contain" />
            ) : cur.provider === "upload" ? (
              <video key={cur.id} src={cur.url} controls autoPlay playsInline className="max-h-[80vh] max-w-full rounded-xl" />
            ) : (
              <iframe key={cur.id} src={cur.url + (cur.provider === "youtube" ? "?autoplay=1&rel=0" : "")} title={cur.caption || "Vidéo"} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className={"w-full max-w-4xl rounded-xl bg-black " + (cur.provider === "tiktok" ? "aspect-[9/16] max-h-[80vh] max-w-sm" : "aspect-video")} />
            )}
            {media.length > 1 ? (
              <>
                <button type="button" onClick={() => go(-1)} className="absolute left-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl text-ink shadow hover:bg-white" aria-label="Précédent">‹</button>
                <button type="button" onClick={() => go(1)} className="absolute right-3 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-xl text-ink shadow hover:bg-white" aria-label="Suivant">›</button>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
