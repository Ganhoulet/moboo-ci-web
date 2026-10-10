"use client";

import { useState } from "react";
import { PROVIDER_LABEL, autoplayUrl, type VideoProvider } from "@/lib/video-embed";

/**
 * Lecteur YouTube / TikTok / Vimeo : miniature d'abord (page légère), lecteur
 * intégré au clic. TikTok est vertical, les autres en 16:9.
 */
export function VideoPlayer({ provider, url, thumb, caption, eager }: { provider: string; url: string; thumb?: string; caption?: string; eager?: boolean }) {
  const [on, setOn] = useState(!!eager);
  const vertical = provider === "tiktok";
  return (
    <figure className="min-w-0">
      <div className={"relative overflow-hidden rounded-2xl bg-slate-900 " + (vertical ? "mx-auto aspect-[9/16] max-h-[640px] w-full max-w-[340px]" : "aspect-video w-full")}>
        {on && url ? (
          <iframe src={autoplayUrl(provider, url)} title={caption || "Vidéo"} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" className="absolute inset-0 h-full w-full" />
        ) : (
          <button type="button" onClick={() => setOn(true)} className="group absolute inset-0 h-full w-full" aria-label={`Lire la vidéo ${caption ?? ""}`}>
            {thumb ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            ) : <span className="absolute inset-0 bg-gradient-to-br from-brand-800 to-brand-900" />}
            <span className="absolute inset-0 grid place-items-center bg-black/15">
              <span className="grid h-16 w-16 place-items-center rounded-full bg-white/95 text-ink shadow-lg transition group-hover:scale-110">
                <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden><path d="M8 5.5v13l11-6.5z" /></svg>
              </span>
            </span>
            <span className="absolute left-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">{PROVIDER_LABEL[provider as VideoProvider] ?? "Vidéo"}</span>
          </button>
        )}
      </div>
      {caption ? <figcaption className="mt-2 text-sm font-semibold text-ink">{caption}</figcaption> : null}
    </figure>
  );
}
