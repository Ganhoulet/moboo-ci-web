"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendMessageAction, type ChatMessage } from "@/app/mon-espace/actions";

const time = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
const day = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

/**
 * Fil de discussion : bulles, envoi optimiste. Les nouveaux messages arrivent
 * en temps réel (la cloche de l'en-tête rafraîchit la page) ; filet de
 * sécurité : rafraîchissement toutes les 30 s tant que l'onglet est visible.
 */
export function ChatThread({ conversationId, messages }: { conversationId: string; messages: ChatMessage[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, start] = useTransition();
  const bottom = useRef<HTMLDivElement>(null);

  // Les messages envoyés remplacent leur version optimiste dès qu'ils reviennent du serveur.
  const serverIds = new Set(messages.map((m) => m.id));
  const all = [...messages, ...pending.filter((m) => !serverIds.has(m.id))];

  useEffect(() => {
    router.refresh(); // le fil vient d'être lu : pastille du menu à jour
    const t = setInterval(() => { if (document.visibilityState === "visible") router.refresh(); }, 30000);
    return () => clearInterval(t);
  }, [router]);

  useEffect(() => { bottom.current?.scrollIntoView({ block: "end" }); }, [all.length]);

  const send = () => {
    const body = text.trim();
    if (!body || sending) return;
    setError(null);
    const temp: ChatMessage = { id: `tmp-${Date.now()}`, mine: true, body, createdAt: new Date().toISOString() };
    setPending((p) => [...p, temp]);
    setText("");
    start(async () => {
      const r = await sendMessageAction(conversationId, body);
      setPending((p) => p.map((m) => (m.id === temp.id && r.ok && r.message ? r.message : m)).filter((m) => r.ok || m.id !== temp.id));
      if (!r.ok) { setError(r.error ?? "Envoi impossible."); setText(body); }
      else router.refresh();
    });
  };

  let lastDay = "";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-[300px] flex-1 space-y-2 overflow-y-auto px-3 py-4 sm:px-5">
        {all.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">Aucun message pour l'instant. Écrivez le premier.</p>
        ) : null}
        {all.map((m) => {
          const d = day(m.createdAt);
          const sep = d !== lastDay; lastDay = d;
          return (
            <div key={m.id}>
              {sep ? <p className="my-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-400">{d}</p> : null}
              <div className={"flex " + (m.mine ? "justify-end" : "justify-start")}>
                <div className={"max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[70%] " +
                  (m.mine ? "rounded-br-md bg-brand-800 text-white" : "rounded-bl-md bg-white text-ink ring-1 ring-slate-200")}>
                  <p className="whitespace-pre-line break-words">{m.body}</p>
                  <p className={"mt-0.5 text-right text-[10px] " + (m.mine ? "text-white/70" : "text-slate-400")}>
                    {m.id.startsWith("tmp-") ? "Envoi…" : time(m.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottom} />
      </div>

      <form onSubmit={(e) => { e.preventDefault(); send(); }} className="border-t border-slate-200 bg-white p-3">
        {error ? <p className="mb-2 text-sm font-medium text-red-600">{error}</p> : null}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); } }}
            rows={1}
            maxLength={4000}
            placeholder="Votre message…"
            className="input max-h-40 min-h-[44px] flex-1 resize-none py-2.5"
          />
          <button type="submit" disabled={!text.trim() || sending} aria-label="Envoyer"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-accent-600 text-white transition hover:bg-accent-700 disabled:opacity-40">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M4 12 20 4l-6 16-3-7-7-1Z" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </form>
    </div>
  );
}
