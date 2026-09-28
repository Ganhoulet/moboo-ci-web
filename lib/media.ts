/**
 * Médias d'une fiche : la vidéo de présentation (si l'annonce en a une) passe
 * en premier, puis les photos (12 max). Partagé par la galerie mobile, la
 * grille desktop et la visionneuse plein écran.
 */
export type Media =
  | { kind: "photo"; src: string }
  | {
      kind: "video";
      /** iframe = YouTube / TikTok intégrés ; file = .mp4 lu par <video> ; link = ouvert dans un onglet. */
      player: "iframe" | "file" | "link";
      src: string;
      url: string;
      poster: string | null;
      /** Si `poster` n'existe pas (miniature HD YouTube absente). */
      posterFallback?: string | null;
      vertical: boolean;
    };

const MAX_PHOTOS = 12;

/** ID YouTube d'une URL (watch?v=, youtu.be, embed, shorts, live). */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

function tiktokId(url: string): string | null {
  const m = url.match(/tiktok\.com\/.*\/video\/(\d+)/);
  return m ? m[1] : null;
}

export function videoMedia(url: string | null | undefined, fallbackPoster: string | null): Media | null {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const yt = youtubeId(url);
  if (yt) {
    return {
      kind: "video",
      player: "iframe",
      src: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&playsinline=1&rel=0`,
      url,
      // Miniature HD sans bandes noires ; la « hq » (4:3, bandes) en secours.
      poster: `https://i.ytimg.com/vi/${yt}/maxresdefault.jpg`,
      posterFallback: `https://i.ytimg.com/vi/${yt}/hqdefault.jpg`,
      vertical: /\/shorts\//.test(url),
    };
  }
  const tt = tiktokId(url);
  if (tt) {
    return { kind: "video", player: "iframe", src: `https://www.tiktok.com/embed/v2/${tt}`, url, poster: fallbackPoster, vertical: true };
  }
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) {
    return { kind: "video", player: "file", src: url, url, poster: fallbackPoster, vertical: false };
  }
  return { kind: "video", player: "link", src: url, url, poster: fallbackPoster, vertical: false };
}

export function buildMedia(photos: string[] | null | undefined, videoUrl?: string | null): Media[] {
  const list = Array.from(new Set((photos ?? []).filter(Boolean))).slice(0, MAX_PHOTOS);
  const video = videoMedia(videoUrl, list[0] ?? null);
  return [...(video ? [video] : []), ...list.map((src) => ({ kind: "photo" as const, src }))];
}
