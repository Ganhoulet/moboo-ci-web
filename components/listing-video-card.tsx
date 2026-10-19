"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { videoKeepAction, videoRefreshAction, videoRemoveAction, videoTicketAction, type ListingVideo } from "@/app/mon-espace/video-actions";

const ERRORS: Record<string, string> = {
  too_large: "Fichier trop lourd.", not_a_video: "Ce fichier n’est pas une vidéo.", video_disabled: "L’envoi de vidéo est désactivé pour le moment.",
  upload_failed: "L’envoi a échoué, réessayez.", create_failed: "L’envoi a échoué, réessayez.", bad_token: "Session expirée : rechargez la page.", not_owner: "Cette annonce ne vous appartient pas.",
};
const mb = (n?: number | null) => (n ? `${(n / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo` : "");
const day = (d?: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }) : "");

/** Vidéo de l'annonce : aperçu, envoi d'un fichier (barre de progression), garder / retirer. */
export function ListingVideoCard({ listingId, info }: { listingId: string; info: ListingVideo }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, start] = useTransition();
  const v = info.video;

  async function send(file: File | undefined) {
    if (!file) return;
    setError(null); setDone(false);
    if (file.size > info.maxMb * 1024 * 1024) { setError(`Fichier trop lourd (${mb(file.size)}) : ${info.maxMb} Mo au maximum.`); return; }
    const t = await videoTicketAction(listingId);
    if (!t.ok) { setError(t.error); return; }
    setProgress(0);
    const form = new FormData();
    form.append("file", file);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", t.uploadUrl);
    xhr.setRequestHeader("Authorization", `Bearer ${t.token}`);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = async () => {
      setProgress(null);
      let body: any = {};
      try { body = JSON.parse(xhr.responseText); } catch { /* vide */ }
      if (xhr.status >= 200 && xhr.status < 300 && body?.success) {
        setDone(true);
        await videoRefreshAction(listingId);
        router.refresh();
      } else setError(ERRORS[body?.error] ?? (xhr.status === 413 ? ERRORS.too_large : "L’envoi a échoué, réessayez."));
    };
    xhr.onerror = () => { setProgress(null); setError("Connexion interrompue : réessayez."); };
    xhr.send(form);
  }

  return (
    <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <h2 className="font-display text-lg font-bold text-ink">Vidéo de l’annonce</h2>
      <p className="text-sm text-muted">
        Une courte visite filmée ({Math.round(info.maxSeconds / 60) >= 1 ? `${Math.round(info.maxSeconds / 60)} min` : `${info.maxSeconds} s`} au maximum) attire plus de visiteurs.
        {info.aiRooms ? " Les meilleures images de la vidéo sont ajoutées automatiquement à vos photos, pièce par pièce." : ""}
      </p>

      {v?.kind === "file" ? (
        <div className="mt-4 space-y-2">
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            {v.provider === "r2"
              ? <video src={v.video_url} poster={v.thumbnail_url || undefined} controls playsInline preload="metadata" className="h-full w-full object-contain" />
              : <iframe src={v.embed_url} className="h-full w-full" allow="encrypted-media; picture-in-picture" allowFullScreen loading="lazy" title="Vidéo de l’annonce" />}
          </div>
          <p className="text-xs text-muted">
            {v.status === "ready" ? "En ligne" : v.status === "failed" ? "Échec du traitement : envoyez la vidéo à nouveau" : "En cours de traitement…"}
            {v.uploadedAt ? ` · envoyée le ${day(v.uploadedAt)}` : ""}{v.size ? ` · ${mb(v.size)}` : ""}
          </p>
          {v.deleteOn && !v.keep ? (
            <div className="flex flex-wrap items-center gap-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">
              <span className="flex-1">Cette vidéo sera retirée automatiquement le <strong>{day(v.deleteOn)}</strong> (l’annonce et ses photos restent en ligne).</span>
              <button type="button" disabled={pending} onClick={() => start(async () => { await videoKeepAction(listingId); router.refresh(); })}
                className="rounded-full bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50">Garder ma vidéo</button>
            </div>
          ) : null}
        </div>
      ) : v?.kind === "youtube" ? (
        <div className="mt-4 flex gap-3 rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={v.thumbnail_url} alt="" className="h-20 w-32 rounded-lg object-cover" />
          <div className="text-sm">
            <p className="font-semibold text-ink">Lien YouTube</p>
            <p className="break-all text-xs text-muted">{v.url}</p>
            {info.aiHint ? <p className="mt-1 text-xs text-amber-800">{info.aiHint}</p> : null}
          </div>
        </div>
      ) : v?.kind === "link" ? (
        <p className="mt-4 break-all text-sm text-slate-600">Lien vidéo : {v.url}</p>
      ) : (
        <p className="mt-4 text-sm text-slate-600">Aucune vidéo pour cette annonce.</p>
      )}

      {error ? <p className="mt-3 rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p> : null}
      {done ? <p className="mt-3 rounded-lg bg-emerald-50 p-2 text-sm text-emerald-800">Vidéo envoyée ✓</p> : null}
      {progress !== null ? (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-accent-600 transition-all" style={{ width: `${progress}%` }} /></div>
          <p className="mt-1 text-xs text-muted">Envoi… {progress} %</p>
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {info.uploadEnabled ? (
          <>
            <button type="button" disabled={progress !== null} onClick={() => fileRef.current?.click()}
              className="rounded-full bg-accent-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-accent-700 disabled:opacity-50">
              {v?.kind === "file" ? "Remplacer la vidéo" : "Envoyer une vidéo"}
            </button>
            <input ref={fileRef} type="file" accept="video/*" hidden onChange={(e) => { void send(e.target.files?.[0]); e.target.value = ""; }} />
          </>
        ) : null}
        {v ? (
          <button type="button" disabled={pending || progress !== null}
            onClick={() => { if (confirm("Retirer la vidéo de cette annonce ?")) start(async () => { await videoRemoveAction(listingId); router.refresh(); }); }}
            className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50">
            Retirer la vidéo
          </button>
        ) : null}
      </div>
      {info.uploadEnabled ? <p className="mt-2 text-xs text-muted">Fichier vidéo de votre téléphone ou ordinateur, {info.maxMb} Mo au maximum. Un lien YouTube se colle dans le champ « Vidéo » de l’annonce.</p> : null}
    </section>
  );
}
