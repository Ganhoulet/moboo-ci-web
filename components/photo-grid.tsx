"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buildMedia, type Media } from "@/lib/media";
import { toggleFavorite, useFavorites } from "@/lib/favorites";
import type { Property } from "@/lib/property";

/* ─── Briques ──────────────────────────────────────────────────────────── */

function Placeholder({ className = "" }: { className?: string }) {
  return (
    <div className={"flex items-center justify-center bg-gradient-to-br from-brand-100 to-slate-100 text-brand-300 " + className}>
      <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3">
        <path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}

function PlayBadge({ size = 56 }: { size?: number }) {
  return (
    <span className="pointer-events-none absolute inset-0 grid place-items-center">
      <span className="grid place-items-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-sm" style={{ width: size, height: size }}>
        <svg width={size * 0.42} height={size * 0.42} viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5-11-6.5Z" /></svg>
      </span>
    </span>
  );
}

const IconVideo = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3" strokeLinejoin="round" />
  </svg>
);
const IconPhotos = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" strokeLinejoin="round" />
  </svg>
);

/** Miniature d'une vidéo, avec repli si la version HD n'existe pas (YouTube renvoie alors une vignette grise 120×90). */
function Poster({ m, alt = "", className = "" }: { m: Extract<Media, { kind: "video" }>; alt?: string; className?: string }) {
  const [src, setSrc] = useState(m.poster);
  const ref = useRef<HTMLImageElement>(null);
  const fallback = () => { if (m.posterFallback && src !== m.posterFallback) setSrc(m.posterFallback); };
  // L'image rendue côté serveur peut avoir fini de charger avant l'hydratation
  // (onLoad/onError jamais appelés) : on vérifie au montage.
  useEffect(() => {
    const img = ref.current;
    if (img?.complete && img.naturalWidth <= 120) fallback();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!src) return <span className={"block bg-black " + className} />;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      // La miniature « hq » est en 4:3 avec bandes noires : on zoome pour les rogner.
      className={className + (src === m.posterFallback && /ytimg\.com/.test(src) ? " scale-[1.34]" : "")}
      onError={fallback}
      onLoad={(e) => { if (e.currentTarget.naturalWidth <= 120) fallback(); }}
    />
  );
}

/** Lecteur de la vidéo de présentation (lancé au clic, jamais au chargement). */
function VideoPlayer({ m, className = "" }: { m: Extract<Media, { kind: "video" }>; className?: string }) {
  if (m.player === "file") {
    return <video src={m.src} poster={m.poster ?? undefined} controls autoPlay playsInline className={"h-full w-full bg-black object-contain " + className} />;
  }
  return (
    <iframe
      title="Vidéo de présentation"
      src={m.src}
      allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      className={"h-full w-full bg-black " + className}
      style={{ border: 0 }}
    />
  );
}

/* ─── Mobile : carrousel plein écran façon Airbnb ─────────────────────── */

export function MobileGallery({
  photos,
  videoUrl,
  alt,
  backHref,
  property,
}: {
  photos: string[];
  videoUrl?: string | null;
  alt: string;
  backHref: string;
  property: Property;
}) {
  const media = buildMedia(photos, videoUrl);
  const hasVideo = media[0]?.kind === "video";
  const photoCount = media.length - (hasVideo ? 1 : 0);
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const router = useRouter();

  // Quitter la vidéo en faisant défiler l'arrête.
  useEffect(() => { if (index !== 0) setPlaying(false); }, [index]);

  const goTo = (i: number) => {
    const el = track.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  const back = () => {
    if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) router.back();
    else router.push(backHref);
  };

  const current = media[index];
  const counter = current?.kind === "video" ? "Vidéo" : `${index + (hasVideo ? 0 : 1)} / ${photoCount}`;

  return (
    <div className="relative h-[46vh] min-h-[260px] max-h-[480px] w-full overflow-hidden bg-slate-200">
      {media.length === 0 ? (
        <Placeholder className="h-full w-full" />
      ) : (
        <div
          ref={track}
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)));
          }}
          className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {media.map((m, i) => (
            <div key={i} className="relative h-full w-full shrink-0 snap-center">
              {m.kind === "video" ? (
                playing && m.player !== "link" ? (
                  // Marge basse : la fiche arrondie chevauche la galerie de 24 px.
                  <div className="h-full bg-black pb-6">
                    <VideoPlayer m={m} />
                  </div>
                ) : (
                  <button
                    type="button"
                    aria-label="Lire la vidéo"
                    className="relative block h-full w-full overflow-hidden"
                    onClick={() => (m.player === "link" ? window.open(m.url, "_blank", "noopener,noreferrer") : setPlaying(true))}
                  >
                    <Poster m={m} alt={`Vidéo — ${alt}`} className="h-full w-full object-cover" />
                    <PlayBadge size={64} />
                  </button>
                )
              ) : (
                <button type="button" className="block h-full w-full" onClick={() => setOpen(i)} aria-label={`Agrandir la photo ${i + 1}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.src}
                    alt={i === 0 ? alt : ""}
                    loading={i < 2 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Actions posées sur la photo (retour / partager / favori) */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between p-3">
        <button type="button" onClick={back} aria-label="Retour" className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-md">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M19 12H5M11 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className="pointer-events-auto flex gap-2">
          <ShareCircle title={property.title} />
          <FavoriteCircle property={property} />
        </div>
      </div>

      {/* Bascule Vidéo / Photos */}
      {hasVideo && photoCount > 0 ? (
        // Pendant la lecture, la vidéo capte le glissement : la bascule reste
        // accessible, remontée en haut pour ne pas cacher les commandes du lecteur.
        <div className={"absolute flex gap-1.5 rounded-full bg-black/45 p-1 backdrop-blur-sm " + (playing ? "left-1/2 top-4 -translate-x-1/2" : "bottom-9 left-3")}>
          <button
            type="button"
            onClick={() => goTo(0)}
            className={"inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition " + (index === 0 ? "bg-white text-ink" : "text-white")}
          >
            {IconVideo} Vidéo
          </button>
          <button
            type="button"
            onClick={() => goTo(1)}
            className={"inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition " + (index > 0 ? "bg-white text-ink" : "text-white")}
          >
            {IconPhotos} Photos
          </button>
        </div>
      ) : null}

      {media.length > 0 && !playing ? (
        <span className="pointer-events-none absolute bottom-9 right-3 rounded-md bg-black/60 px-2.5 py-1.5 text-xs font-semibold text-white">
          {counter}
        </span>
      ) : null}

      {open !== null ? <Lightbox media={media} alt={alt} start={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

function ShareCircle({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={copied ? "Lien copié" : "Partager"}
      onClick={async () => {
        const url = window.location.href;
        try {
          if (navigator.share) await navigator.share({ title, text: `${title} — Moboo.ci`, url });
          else {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }
        } catch { /* partage annulé */ }
      }}
      className="grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-md"
    >
      {copied ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="m5 13 4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="19" r="2.5" />
          <path d="m8.2 10.8 7.6-4.5M8.2 13.2l7.6 4.5" />
        </svg>
      )}
    </button>
  );
}

function FavoriteCircle({ property }: { property: Property }) {
  const favorites = useFavorites();
  const saved = favorites.some((f) => f.id === property.id);
  return (
    <button
      type="button"
      aria-label={saved ? "Retirer des favoris" : "Enregistrer"}
      aria-pressed={saved}
      onClick={() => toggleFavorite(property)}
      className="grid h-10 w-10 place-items-center rounded-full bg-white shadow-md"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={saved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2"
        className={saved ? "text-accent-600" : "text-ink"}>
        <path d="M12 20.5s-7-4.6-9.2-9.1C1.3 8 3 4.5 6.3 4.5c2 0 3.4 1.2 4.2 2.5.8-1.3 2.2-2.5 4.2-2.5 3.3 0 5 3.5 3.5 6.9C19 15.9 12 20.5 12 20.5Z" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/* ─── Desktop : grande image + 4 vignettes ───────────────────────────── */

/**
 * Galerie style Airbnb : un grand média (la vidéo si l'annonce en a une) +
 * 4 vignettes, bouton « Voir les N photos » et visionneuse plein écran.
 */
export function PhotoGrid({ photos, alt, videoUrl }: { photos: string[]; alt: string; videoUrl?: string | null }) {
  const media = buildMedia(photos, videoUrl);
  const [open, setOpen] = useState<number | null>(null);
  const hasVideo = media[0]?.kind === "video";
  const photoCount = media.length - (hasVideo ? 1 : 0);

  if (media.length === 0) return <Placeholder className="aspect-[16/9] w-full rounded-2xl" />;

  const [main, ...rest] = media;
  const thumbs = rest.slice(0, 4);
  const thumbSrc = (m: Media) => (m.kind === "photo" ? m.src : m.poster);

  return (
    <>
      <div className="relative grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => setOpen(0)}
          className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-200 sm:aspect-auto sm:min-h-[20rem]"
          aria-label={main.kind === "video" ? "Lire la vidéo" : "Agrandir la photo"}
        >
          {main.kind === "video" ? (
            <Poster m={main} alt={alt} className="h-full w-full object-cover transition hover:scale-[1.02]" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={main.src} alt={alt} decoding="async" className="h-full w-full object-cover transition hover:scale-[1.02]" />
          )}
          {main.kind === "video" ? <PlayBadge size={72} /> : null}
        </button>
        {thumbs.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {thumbs.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setOpen(i + 1)}
                className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-200"
                aria-label={`Photo ${i + 2}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={thumbSrc(m) ?? ""} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition hover:scale-[1.03]" />
              </button>
            ))}
          </div>
        )}
        <div className="absolute bottom-3 right-3 flex gap-2">
          {hasVideo ? (
            <button
              type="button"
              onClick={() => setOpen(0)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white/95 px-3 py-1.5 text-sm font-semibold text-ink shadow-sm backdrop-blur transition hover:bg-white"
            >
              {IconVideo} Vidéo
            </button>
          ) : null}
          {photoCount > 1 ? (
            <button
              type="button"
              onClick={() => setOpen(hasVideo ? 1 : 0)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white/95 px-3 py-1.5 text-sm font-semibold text-ink shadow-sm backdrop-blur transition hover:bg-white"
            >
              {IconPhotos} Voir les {photoCount} photos
            </button>
          ) : null}
        </div>
      </div>

      {open !== null && <Lightbox media={media} alt={alt} start={open} onClose={() => setOpen(null)} />}
    </>
  );
}

/* ─── Visionneuse plein écran (photos + vidéo) ───────────────────────── */

export function Lightbox({
  media,
  alt,
  start,
  onClose,
}: {
  media: Media[];
  alt: string;
  start: number;
  onClose: () => void;
}) {
  const [i, setI] = useState(start);
  const touchX = useRef<number | null>(null);
  const n = media.length;
  const prev = useCallback(() => setI((v) => (v - 1 + n) % n), [n]);
  const next = useCallback(() => setI((v) => (v + 1) % n), [n]);
  const hasVideo = media[0]?.kind === "video";

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

  const m = media[i];
  const label = m.kind === "video" ? "Vidéo" : `${i + (hasVideo ? 0 : 1)} / ${n - (hasVideo ? 1 : 0)}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photos — ${alt}`}
      className="fixed inset-0 z-[60] flex flex-col bg-black"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) (dx > 0 ? prev : next)();
        touchX.current = null;
      }}
    >
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <span className="text-sm font-semibold">{label}</span>
        <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Fermer">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-2 sm:px-16">
        {m.kind === "video" ? (
          m.player === "link" ? (
            <a href={m.url} target="_blank" rel="noopener noreferrer" className="btn-primary bg-accent-600 hover:bg-accent-700">
              Ouvrir la vidéo ↗
            </a>
          ) : (
            <div className={m.vertical ? "aspect-[9/16] h-full max-h-[80vh]" : "aspect-video w-full max-w-4xl"}>
              <VideoPlayer m={m} className="rounded-lg" />
            </div>
          )
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={m.src} src={m.src} alt={`${alt} — photo ${i + 1}`} className="max-h-full max-w-full object-contain" />
        )}
        {n > 1 && (
          <>
            <button type="button" onClick={prev} aria-label="Précédent"
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 sm:block">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
            <button type="button" onClick={next} aria-label="Suivant"
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 rounded-full bg-white/15 p-3 text-white hover:bg-white/25 sm:block">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="m9 18 6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </button>
          </>
        )}
      </div>

      {n > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3">
          {media.map((x, k) => (
            <button key={k} type="button" onClick={() => setI(k)} aria-label={x.kind === "video" ? "Vidéo" : `Photo ${k + 1}`}
              className={"relative h-14 w-20 shrink-0 overflow-hidden rounded-md border-2 bg-slate-800 " + (k === i ? "border-white" : "border-transparent opacity-60 hover:opacity-100")}>
              {x.kind === "video" ? (
                <Poster m={x} className="h-full w-full object-cover" />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={x.src} alt="" loading="lazy" className="h-full w-full object-cover" />
              )}
              {x.kind === "video" ? <PlayBadge size={26} /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
