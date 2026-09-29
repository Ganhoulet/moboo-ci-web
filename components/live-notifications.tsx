"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

/** Compteur (+ ticket du flux si demandé) via la route /api/live. */
async function fetchLive(ticket: boolean): Promise<{ unread: number; ticket?: string; url?: string } | null> {
  try {
    const r = await fetch(`/api/live${ticket ? "?ticket=1" : ""}`, { cache: "no-store" });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

interface LiveMessage {
  conversationId: string;
  messageId: string;
  fromName: string;
  listingTitle: string | null;
  preview: string;
  unread: number;
}

const POLL_MS = 30_000;

/* Compteur de non-lus partagé : une seule connexion (LiveNotifications, montée
   une fois dans la page) et autant de cloches que l'en-tête en affiche. */
let unreadCount = 0;
const listeners = new Set<() => void>();
function setUnreadCount(n: number) {
  if (n === unreadCount) return;
  unreadCount = n;
  listeners.forEach((l) => l());
}
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const useUnread = () => useSyncExternalStore(subscribe, () => unreadCount, () => 0);

/** Cloche « Messages » (pastille des non-lus). `tone="dark"` : sur fond sombre. */
export function MessagesBell({ tone = "light" }: { tone?: "light" | "dark" }) {
  const unread = useUnread();
  return (
    <Link href="/mon-espace/messages" aria-label={unread ? `Messages (${unread} non lus)` : "Messages"}
      className={"relative grid h-10 w-10 place-items-center rounded-full border transition " +
        (tone === "dark" ? "border-white/25 text-white hover:bg-white/10" : "border-slate-200 text-slate-600 hover:bg-slate-50")}>
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {unread ? (
        <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-accent-600 px-1 text-[11px] font-bold text-white ring-2 ring-white">
          {unread > 99 ? "99+" : unread}
        </span>
      ) : null}
    </Link>
  );
}

/**
 * Notifications de messages en temps réel (à monter UNE fois, compte connecté) :
 * flux SSE de l'API (ticket obtenu côté serveur), compteur partagé avec les
 * cloches (MessagesBell), notification à l'écran et du navigateur (onglet en
 * arrière-plan), rafraîchissement de l'espace compte. Si le flux est
 * indisponible, on interroge le compteur toutes les 30 s.
 */
export function LiveNotifications() {
  const router = useRouter();
  const pathname = usePathname();
  const path = useRef(pathname);
  path.current = pathname;
  const unread = useUnread();
  const setUnread = setUnreadCount;
  const [toasts, setToasts] = useState<LiveMessage[]>([]);

  const dismiss = useCallback((id: string) => setToasts((t) => t.filter((x) => x.messageId !== id)), []);

  const onMessage = useCallback((m: LiveMessage) => {
    setUnread(m.unread);
    window.dispatchEvent(new CustomEvent("moboo:live", { detail: m }));
    if (path.current.startsWith("/mon-espace")) router.refresh();
    const viewing = path.current === `/mon-espace/messages/${m.conversationId}` && document.visibilityState === "visible";
    if (viewing) return;
    setToasts((t) => [m, ...t.filter((x) => x.messageId !== m.messageId)].slice(0, 3));
    setTimeout(() => dismiss(m.messageId), 8000);
    if (document.visibilityState === "hidden" && "Notification" in window && Notification.permission === "granted") {
      try {
        const n = new Notification(`${m.fromName} · Moboo.ci`, { body: m.preview, tag: m.conversationId });
        n.onclick = () => { window.focus(); router.push(`/mon-espace/messages/${m.conversationId}`); n.close(); };
      } catch { /* navigateur sans notifications */ }
    }
  }, [router, dismiss]);

  useEffect(() => {
    let closed = false;
    let es: EventSource | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    let retry: ReturnType<typeof setTimeout> | null = null;
    let failures = 0;
    let last = -1;

    const check = async () => {
      const n = (await fetchLive(false))?.unread;
      if (n == null || closed) return;
      if (last >= 0 && n > last && path.current.startsWith("/mon-espace")) router.refresh();
      last = n;
      setUnread(n);
    };
    const startPolling = () => { if (!poll) poll = setInterval(check, POLL_MS); };
    const stopPolling = () => { if (poll) { clearInterval(poll); poll = null; } };

    const open = async () => {
      const t = await fetchLive(true);
      if (closed) return;
      if (t) { setUnread(t.unread); last = t.unread; }
      if (!t?.ticket || !t.url) { startPolling(); return; }
      es = new EventSource(`${t.url}?ticket=${encodeURIComponent(t.ticket)}`);
      es.addEventListener("ready", () => { failures = 0; stopPolling(); });
      es.addEventListener("message", (e) => {
        try { onMessage(JSON.parse((e as MessageEvent).data)); } catch { /* ignoré */ }
      });
      es.addEventListener("read", (e) => {
        try { setUnread(JSON.parse((e as MessageEvent).data).unread ?? 0); } catch { /* ignoré */ }
      });
      es.onerror = () => {
        failures += 1;
        startPolling();
        // Fermé (ticket expiré, API redémarrée…) : nouveau ticket après un délai croissant.
        if (es && (es.readyState === EventSource.CLOSED || failures >= 3)) {
          es.close(); es = null;
          retry = setTimeout(open, Math.min(60_000, 5_000 * failures));
        }
      };
    };

    open();
    return () => {
      closed = true;
      es?.close();
      stopPolling();
      if (retry) clearTimeout(retry);
    };
  }, [onMessage, router]);

  // Pastille dans le titre de l'onglet.
  useEffect(() => {
    const base = document.title.replace(/^\(\d+\) /, "");
    document.title = unread ? `(${unread}) ${base}` : base;
  }, [unread, pathname]);

  return (
    <>
      {toasts.length ? (
        <div className="fixed inset-x-3 bottom-3 z-50 space-y-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96" aria-live="polite">
          {toasts.map((m) => (
            <div key={m.messageId} className="flex items-start gap-3 rounded-2xl bg-white p-3.5 shadow-xl ring-1 ring-slate-200">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-800 font-bold text-white">
                {(m.fromName || "?").charAt(0).toUpperCase()}
              </span>
              <Link href={`/mon-espace/messages/${m.conversationId}`} onClick={() => dismiss(m.messageId)} className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-accent-700">Nouveau message</p>
                <p className="truncate font-semibold text-ink">{m.fromName}</p>
                <p className="line-clamp-2 text-sm text-slate-600">{m.preview}</p>
                {m.listingTitle ? <p className="mt-0.5 truncate text-xs text-muted">{m.listingTitle}</p> : null}
              </Link>
              <button type="button" onClick={() => dismiss(m.messageId)} aria-label="Fermer" className="shrink-0 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-ink">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" /></svg>
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

/** Bouton « Activer les notifications » (autorisation du navigateur). */
export function NotificationPermission() {
  const [state, setState] = useState<NotificationPermission | "unsupported" | null>(null);
  useEffect(() => { setState("Notification" in window ? Notification.permission : "unsupported"); }, []);
  if (state !== "default") return null;
  return (
    <button type="button" onClick={async () => setState(await Notification.requestPermission())}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50">
      🔔 Me prévenir des nouveaux messages
    </button>
  );
}
