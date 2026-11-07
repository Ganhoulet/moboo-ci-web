"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Vidéo choisie dans la publication rapide, présentée comme un envoi YouTube :
 * miniature, quelques images de la vidéo (scènes), durée, poids, puis barre de
 * progression avec vitesse et temps restant pendant l'envoi.
 */
export type VideoUploadState =
  | { stage: "ready" }
  | { stage: "uploading"; percent: number; loaded: number; total: number; startedAt: number }
  | { stage: "processing" }
  | { stage: "done" }
  | { stage: "error"; message: string };

const mb = (n: number) => `${(n / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: n < 10 * 1024 * 1024 ? 1 : 0 })} Mo`;
const rate = (b: number) => (b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} Ko/s` : `${(b / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo/s`);
const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const SCENES = 5;

/** Durée et images de la vidéo, lues dans le navigateur (aucun envoi). Null si le format n'est pas lisible ici. */
async function readVideo(file: File): Promise<{ duration: number; frames: string[]; portrait: boolean } | null> {
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true; v.playsInline = true; v.preload = "auto"; v.src = url;
  try {
    await new Promise<void>((res, rej) => { v.onloadeddata = () => res(); v.onerror = () => rej(new Error("illisible")); setTimeout(() => rej(new Error("délai")), 15000); });
    const duration = Number.isFinite(v.duration) ? v.duration : 0;
    const portrait = v.videoHeight > v.videoWidth;
    const c = document.createElement("canvas");
    const w = 240;
    c.width = w; c.height = Math.round((w * v.videoHeight) / Math.max(1, v.videoWidth)) || 135;
    const ctx = c.getContext("2d")!;
    const frames: string[] = [];
    for (let i = 0; i < SCENES; i++) {
      const t = duration ? Math.min(duration - 0.1, ((i + 0.5) / SCENES) * duration) : 0;
      await new Promise<void>((res) => { v.onseeked = () => res(); v.currentTime = Math.max(0, t); setTimeout(res, 3000); });
      ctx.drawImage(v, 0, 0, c.width, c.height);
      frames.push(c.toDataURL("image/jpeg", 0.7));
    }
    return { duration, frames, portrait };
  } catch {
    return null;
  } finally {
    v.removeAttribute("src"); v.load();
    URL.revokeObjectURL(url);
  }
}

export function VideoUploadCard({ file, state, maxMb, maxSeconds, onRemove, onTooLong }: {
  file: File; state: VideoUploadState; maxMb: number; maxSeconds: number; onRemove?: () => void;
  /** Signale une vidéo trop longue (true) ou acceptable (false). */
  onTooLong?: (tooLong: boolean) => void;
}) {
  const [info, setInfo] = useState<{ duration: number; frames: string[]; portrait: boolean } | null | undefined>(undefined);
  const [scene, setScene] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let live = true;
    setInfo(undefined); setScene(0);
    void readVideo(file).then((r) => { if (live) { setInfo(r); onTooLong?.(!!r && maxSeconds > 0 && r.duration > maxSeconds + 1); } });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  // Les images défilent doucement dans la miniature, comme un aperçu au survol.
  useEffect(() => {
    if (!info?.frames.length) return;
    timer.current = setInterval(() => setScene((s) => (s + 1) % info.frames.length), 1200);
    return () => { if (timer.current) clearInterval(timer.current); };
  }, [info]);

  const tooBig = file.size > maxMb * 1024 * 1024;
  const tooLong = !!info && maxSeconds > 0 && info.duration > maxSeconds + 1;
  const up = state.stage === "uploading" ? state : null;
  const elapsed = up ? (Date.now() - up.startedAt) / 1000 : 0;
  const speed = up && elapsed > 0.5 ? up.loaded / elapsed : 0;
  const left = up && speed > 0 ? (up.total - up.loaded) / speed : null;
  const percent = up ? up.percent : state.stage === "processing" || state.stage === "done" ? 100 : 0;

  return (
    <div className="overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
      <div className="flex gap-3 p-3">
        <div className="relative h-[72px] w-[128px] shrink-0 overflow-hidden rounded-lg bg-slate-900">
          {info?.frames.length ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={info.frames[scene]} alt="Aperçu de la vidéo" className={"h-full w-full " + (info.portrait ? "object-contain" : "object-cover")} />
          ) : (
            <span className="grid h-full w-full place-items-center text-white/80">
              {info === undefined ? <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : (
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="6" width="13" height="12" rx="2" /><path d="M16 10l5-3v10l-5-3z" /></svg>
              )}
            </span>
          )}
          {info?.duration ? <span className="absolute bottom-1 right-1 rounded bg-black/75 px-1 text-[11px] font-semibold tabular-nums text-white">{clock(info.duration)}</span> : null}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">{file.name}</p>
          <p className="text-xs tabular-nums text-muted">{mb(file.size)}{info?.duration ? ` · ${clock(info.duration)}` : ""}</p>
          <p className={"mt-1 text-xs font-semibold " + (state.stage === "error" || tooBig || tooLong ? "text-red-700" : state.stage === "done" || state.stage === "processing" ? "text-emerald-700" : "text-brand-800")}>
            {tooBig ? `Trop lourde : ${maxMb} Mo au maximum.`
              : tooLong ? `Trop longue : ${clock(maxSeconds)} au maximum.`
              : state.stage === "ready" ? "Prête : elle sera envoyée à la publication."
              : state.stage === "uploading" ? `Envoi en cours… ${state.percent} %`
              : state.stage === "processing" ? "Envoyée ✓ Traitement en cours"
              : state.stage === "done" ? "Envoyée ✓"
              : state.message}
          </p>
        </div>
        {onRemove && (state.stage === "ready" || state.stage === "error") ? (
          <button type="button" onClick={onRemove} aria-label="Retirer la vidéo" className="h-8 w-8 shrink-0 rounded-full text-lg text-muted hover:bg-slate-100">×</button>
        ) : null}
      </div>

      {info?.frames.length ? (
        <div className="flex gap-1 px-3 pb-3" aria-label="Scènes de la vidéo">
          {info.frames.map((f, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={f} alt="" onClick={() => setScene(i)}
              className={"h-9 min-w-0 flex-1 cursor-pointer rounded object-cover " + (i === scene ? "ring-2 ring-brand-700" : "opacity-80")} />
          ))}
        </div>
      ) : null}

      {state.stage !== "ready" ? (
        <div className="border-t border-slate-100 px-3 py-2.5">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
            <div className={"h-full transition-[width] duration-300 " + (state.stage === "error" ? "bg-red-500" : state.stage === "uploading" ? "bg-accent-600" : "bg-emerald-500")} style={{ width: `${percent}%` }} />
          </div>
          {up ? (
            <p className="mt-1.5 flex justify-between text-xs tabular-nums text-muted">
              <span>{mb(up.loaded)} sur {mb(up.total)}</span>
              <span>{speed ? rate(speed) : ""}{left != null ? ` · encore ${left < 60 ? `${Math.max(1, Math.round(left))} s` : `${Math.round(left / 60)} min`}` : ""}</span>
            </p>
          ) : state.stage === "processing" ? (
            <p className="mt-1.5 text-xs text-muted">Moboo prépare la vidéo : elle apparaît sur l’annonce dans quelques minutes.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
