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
      /** Lecture automatique sans le son, en boucle (façon TikTok) ; absent : lecture au toucher seulement. */
      mutedSrc?: string;
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
      mutedSrc: `https://www.youtube-nocookie.com/embed/${yt}?autoplay=1&mute=1&playsinline=1&rel=0&loop=1&playlist=${yt}`,
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
  // Vimeo : vimeo.com/123, vimeo.com/channels/x/123, player.vimeo.com/video/123.
  const vm = url.match(/vimeo\.com\/(?:.*\/)?(?:video\/)?(\d{6,})/);
  if (vm) {
    const base = `https://player.vimeo.com/video/${vm[1]}`;
    return { kind: "video", player: "iframe", src: `${base}?autoplay=1&playsinline=1`, mutedSrc: `${base}?autoplay=1&muted=1&loop=1&playsinline=1`, url, poster: fallbackPoster, vertical: false };
  }
  // Dailymotion : dailymotion.com/video/x8abc, dai.ly/x8abc.
  const dm = url.match(/(?:dailymotion\.com\/video\/|dai\.ly\/)([a-z0-9]+)/i);
  if (dm) {
    const base = `https://geo.dailymotion.com/player.html?video=${dm[1]}`;
    return { kind: "video", player: "iframe", src: `${base}&autoplay=1`, mutedSrc: `${base}&autoplay=1&mute=1&loop=1`, url, poster: `https://www.dailymotion.com/thumbnail/video/${dm[1]}`, vertical: false };
  }
  // Facebook (vidéos, reels) et Instagram (publications, reels) : lecteurs intégrés, lancés au toucher.
  if (/(facebook\.com|fb\.watch)\//i.test(url)) {
    return { kind: "video", player: "iframe", src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`, url, poster: fallbackPoster, vertical: /\/reel/i.test(url) };
  }
  const ig = url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([\w-]+)/i);
  if (ig) {
    return { kind: "video", player: "iframe", src: `https://www.instagram.com/p/${ig[1]}/embed`, url, poster: fallbackPoster, vertical: true };
  }
  // Vidéo hébergée chez Bunny Stream (envoyée depuis l'application ou le site).
  if (/^https:\/\/(iframe|player)\.mediadelivery\.net\/(embed|play)\//i.test(url)) {
    const base = url.replace("/play/", "/embed/") + (url.includes("?") ? "&" : "?");
    return { kind: "video", player: "iframe", src: base + "autoplay=true&preload=true", mutedSrc: base + "autoplay=true&muted=true&loop=true&preload=true", url, poster: fallbackPoster, vertical: false };
  }
  if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) {
    return { kind: "video", player: "file", src: url, mutedSrc: url, url, poster: fallbackPoster, vertical: false };
  }
  return { kind: "video", player: "link", src: url, url, poster: fallbackPoster, vertical: false };
}

export function buildMedia(photos: string[] | null | undefined, videoUrl?: string | null): Media[] {
  const list = Array.from(new Set((photos ?? []).filter(Boolean))).slice(0, MAX_PHOTOS);
  const video = videoMedia(videoUrl, list[0] ?? null);
  return [...(video ? [video] : []), ...list.map((src) => ({ kind: "photo" as const, src }))];
}
