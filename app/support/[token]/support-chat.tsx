"use client";

import { useRef, useState, useTransition } from "react";
import { sendSupportFile, sendSupportMessage, type SupportThread } from "./actions";

const time = (d: string) => new Date(d).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Abidjan" });

/** Conversation avec le conseiller : message, capture d'écran (photo ou fichier). */
export function SupportChat({ token, initial }: { token: string; initial: SupportThread }) {
  const [t, setT] = useState(initial);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const closed = t.status === "ferme";

  const send = () => start(async () => {
    setErr(null);
    const r = await sendSupportMessage(token, text);
    if (r.ok) { setT(r.thread); setText(""); } else setErr(r.error);
  });
  const upload = (file: File) => start(async () => {
    setErr(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("caption", text);
    const r = await sendSupportFile(token, fd);
    if (r.ok) { setT(r.thread); setText(""); } else setErr(r.error);
    if (fileRef.current) fileRef.current.value = "";
  });

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-slate-100">
      <div className="flex items-center gap-3 border-b border-slate-100 p-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-800 font-bold text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {t.manager?.avatarUrl ? <img src={t.manager.avatarUrl} alt="" className="h-full w-full object-cover" /> : (t.manager?.name || "M").slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="font-display font-bold text-ink">{t.manager?.name || "Votre conseiller Moboo"}</p>
          <p className="truncate text-xs text-muted">Assistance Moboo.ci · {t.subject}</p>
        </div>
        <span className={"ml-auto rounded-full px-2.5 py-0.5 text-xs font-semibold " + (closed ? "bg-slate-100 text-slate-600" : "bg-emerald-50 text-emerald-800")}>{closed ? "Close" : "En cours"}</span>
      </div>

      <ol className="max-h-[60vh] space-y-3 overflow-y-auto bg-slate-50/60 p-4">
        {t.messages.map((m) => (
          <li key={m.id} className={"flex " + (m.staff ? "justify-start" : "justify-end")}>
            <div className={"max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm " + (m.staff ? "bg-white text-ink ring-1 ring-slate-200" : "bg-brand-800 text-white")}>
              {m.file ? (
                /\.pdf($|\?)/i.test(m.file)
                  ? <a href={m.file} target="_blank" rel="noreferrer" className="underline">📄 Document joint</a>
                  // eslint-disable-next-line @next/next/no-img-element
                  : <a href={m.file} target="_blank" rel="noreferrer"><img src={m.file} alt="Capture envoyée" className="mb-1.5 max-h-64 rounded-lg" /></a>
              ) : null}
              <p className="whitespace-pre-line">{m.body}</p>
              <p className={"mt-1 text-[11px] " + (m.staff ? "text-muted" : "text-white/70")}>{time(m.at)}</p>
            </div>
          </li>
        ))}
      </ol>

      {closed ? (
        <p className="p-4 text-sm text-muted">Cette demande est close. Besoin d’autre chose ? Demandez un nouveau lien à votre conseiller.</p>
      ) : (
        <div className="space-y-2 border-t border-slate-100 p-4">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} placeholder="Décrivez votre problème (où, quand, ce que vous voyez)…" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" aria-label="Votre message" />
          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); }} />
            <button type="button" disabled={pending} onClick={() => fileRef.current?.click()} className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-ink ring-1 ring-slate-300">📷 Joindre une capture</button>
            <button type="button" disabled={pending || !text.trim()} onClick={send} className="ml-auto rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Envoi…" : "Envoyer"}</button>
          </div>
          {err ? <p className="text-sm text-red-600">{err}</p> : null}
          <p className="text-xs text-muted">Votre conseiller est prévenu et vous répond ici ; vous recevez aussi un SMS. Ne communiquez jamais votre mot de passe.</p>
        </div>
      )}
    </div>
  );
}
