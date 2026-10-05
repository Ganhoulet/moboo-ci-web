"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { trackNotice } from "@/app/notice-actions";
import { NOTICE_TONE } from "@/lib/notice-tone";
import { NoticeBody } from "./notice-body";

export interface LiveNotice {
  id: string; title: string; body: string; kind: string; ctaLabel: string; ctaUrl: string; dismissible: boolean; version: string;
}

const KEY = "moboo_notices";
type Closed = Record<string, string>; // id → version fermée
const read = (): Closed => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
const close = (n: LiveNotice) => { try { localStorage.setItem(KEY, JSON.stringify({ ...read(), [n.id]: n.version })); } catch { /* navigation privée */ } };
const viewOnce = (id: string) => {
  try {
    if (sessionStorage.getItem(`moboo_notice_${id}`)) return;
    sessionStorage.setItem(`moboo_notice_${id}`, "1");
  } catch { /* */ }
  void trackNotice(id, "view").catch(() => {});
};
const hidden = (p: string) => p.startsWith("/admin") || p.startsWith("/administration") || p.startsWith("/connexion");

function Cta({ n, className, onClick }: { n: LiveNotice; className: string; onClick?: () => void }) {
  if (!n.ctaUrl) return null;
  const click = () => { void trackNotice(n.id, "click").catch(() => {}); onClick?.(); };
  return /^https?:/.test(n.ctaUrl)
    ? <a href={n.ctaUrl} target="_blank" rel="noopener noreferrer" onClick={click} className={className}>{n.ctaLabel || "En savoir plus"}</a>
    : <Link href={n.ctaUrl} onClick={click} className={className}>{n.ctaLabel || "En savoir plus"}</Link>;
}

/** Bandeau d'information en haut du site (un à la fois, le plus important d'abord). */
export function NoticeBar({ items }: { items: LiveNotice[] }) {
  const path = usePathname();
  const [list, setList] = useState<LiveNotice[]>([]);
  useEffect(() => {
    const c = read();
    setList(items.filter((n) => c[n.id] !== n.version));
  }, [items]);
  const n = list[0];
  useEffect(() => { if (n && !hidden(path)) viewOnce(n.id); }, [n, path]);
  if (!n || hidden(path)) return null;
  const tone = NOTICE_TONE[n.kind] ?? NOTICE_TONE.info;
  const firstLine = n.body.split(/\n/)[0]?.trim();
  return (
    <div className={tone.bar} role="status">
      <div className="container-page flex items-center gap-3 py-2 text-sm">
        <span aria-hidden className="hidden sm:inline">{tone.icon}</span>
        <p className="min-w-0 flex-1">
          <strong className="font-semibold">{n.title}</strong>
          {firstLine ? <span className="hidden opacity-90 md:inline"> — {firstLine.length > 140 ? firstLine.slice(0, 140) + "…" : firstLine}</span> : null}
        </p>
        <Cta n={n} className="shrink-0 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-ink hover:bg-white" />
        {n.dismissible ? (
          <button type="button" aria-label="Fermer" onClick={() => { close(n); void trackNotice(n.id, "dismiss").catch(() => {}); setList((l) => l.slice(1)); }}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full hover:bg-white/15">✕</button>
        ) : null}
      </div>
    </div>
  );
}

/** Fenêtre d'information (une fois par version du message). */
export function NoticePopup({ items }: { items: LiveNotice[] }) {
  const path = usePathname();
  const [n, setN] = useState<LiveNotice | null>(null);
  useEffect(() => {
    if (hidden(path)) return;
    const c = read();
    const next = items.find((x) => c[x.id] !== x.version);
    if (!next) return;
    // Jamais par-dessus la pop-up marketing : on attend qu'elle soit fermée.
    let t: ReturnType<typeof setTimeout>;
    const show = () => {
      if (document.querySelector("[data-marketing-popup]")) { t = setTimeout(show, 1500); return; }
      setN(next);
      viewOnce(next.id);
    };
    t = setTimeout(show, 1500);
    return () => clearTimeout(t);
  }, [items, path]);
  if (!n) return null;
  const tone = NOTICE_TONE[n.kind] ?? NOTICE_TONE.info;
  const shut = (dismiss: boolean) => { close(n); if (dismiss) void trackNotice(n.id, "dismiss").catch(() => {}); setN(null); };
  return (
    <div data-notice-popup className="fixed inset-0 z-[70] grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="notice-title" onClick={() => shut(true)}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <span className={"inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold " + tone.chip}>{tone.icon} {tone.label}</span>
        <h2 id="notice-title" className="mt-3 font-display text-xl font-extrabold text-ink">{n.title}</h2>
        <NoticeBody text={n.body} className="mt-2 text-sm text-slate-600" />
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" onClick={() => shut(true)} className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">Fermer</button>
          <Cta n={n} onClick={() => shut(false)} className="rounded-full bg-brand-800 px-4 py-2 text-sm font-bold text-white hover:bg-brand-900" />
        </div>
      </div>
    </div>
  );
}
