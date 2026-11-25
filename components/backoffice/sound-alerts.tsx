"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSignals, type SignalType, type Signals } from "@/app/admin/signals-actions";

/** Chaque type de demande a son propre son (notes en Hz, durée en s) et son message. */
const TYPES: { key: SignalType; label: string; toast: string; notes: [number, number][]; wave: OscillatorType }[] = [
  { key: "reservation", label: "Réservation à confirmer", toast: "Nouvelle demande de réservation", notes: [[523, 0.12], [659, 0.12], [784, 0.22]], wave: "triangle" },
  { key: "urgent", label: "Hôte à appeler (urgent)", toast: "Un hôte n’a pas répondu : à appeler maintenant", notes: [[880, 0.1], [0, 0.06], [880, 0.1], [0, 0.06], [1046, 0.2]], wave: "square" },
  { key: "support", label: "Client qui demande de l’aide", toast: "Nouveau message d’un client au support", notes: [[740, 0.16], [587, 0.26]], wave: "sine" },
  { key: "litige", label: "Litige", toast: "Nouveau litige à traiter", notes: [[440, 0.18], [349, 0.18], [294, 0.3]], wave: "sawtooth" },
  { key: "moderation", label: "Annonce à valider / signalement", toast: "Nouvelle annonce à valider ou signalement", notes: [[988, 0.08], [1319, 0.12]], wave: "sine" },
  { key: "rappel", label: "Professionnel qui demande à être rappelé", toast: "Un professionnel demande à être rappelé", notes: [[659, 0.14], [523, 0.14], [659, 0.22]], wave: "triangle" },
];
const KEY = "moboo_sons";
const EVERY = 30_000;

interface Prefs { on: boolean; off: SignalType[] }
const load = (): Prefs => { try { return { on: false, off: [], ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return { on: false, off: [] }; } };

/**
 * Alertes sonores de l'équipe : toutes les 30 s, les demandes en attente sont relevées ;
 * quand un compteur augmente, le son de ce type est joué et un message s'affiche,
 * même si la personne regarde un autre écran ou un autre onglet.
 */
export function SoundAlerts({ compact = false }: { compact?: boolean }) {
  const [prefs, setPrefs] = useState<Prefs>({ on: false, off: [] });
  const [open, setOpen] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; text: string }[]>([]);
  const last = useRef<Signals | null>(null);
  const ctx = useRef<AudioContext | null>(null);
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  useEffect(() => { setPrefs(load()); }, []);
  const save = (p: Prefs) => { setPrefs(p); localStorage.setItem(KEY, JSON.stringify(p)); };

  const play = useCallback((type: SignalType) => {
    const def = TYPES.find((t) => t.key === type);
    if (!def) return;
    ctx.current ??= new (window.AudioContext || (window as any).webkitAudioContext)();
    const ac = ctx.current!;
    void ac.resume();
    let at = ac.currentTime + 0.02;
    for (const [freq, dur] of def.notes) {
      if (freq) {
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = def.wave;
        o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(def.wave === "sine" ? 0.35 : 0.18, at + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
        o.connect(g).connect(ac.destination);
        o.start(at);
        o.stop(at + dur + 0.02);
      }
      at += dur;
    }
  }, []);

  const poll = useCallback(async () => {
    const now = await getSignals().catch(() => null);
    if (!now) return;
    const before = last.current;
    last.current = now;
    if (!before || !prefsRef.current.on) return; // premier relevé : on mémorise sans sonner
    const fresh = TYPES.filter((t) => (now[t.key] ?? 0) > (before[t.key] ?? 0) && !prefsRef.current.off.includes(t.key));
    fresh.forEach((t, i) => setTimeout(() => play(t.key), i * 900));
    if (fresh.length) {
      const id = Date.now();
      const added = fresh.map((t, i) => ({ id: id + i, text: `${t.toast} (${now[t.key]})` }));
      setToasts((x) => [...x, ...added].slice(-4));
      setTimeout(() => setToasts((x) => x.filter((y) => !added.some((a) => a.id === y.id))), 12_000);
      const total = fresh.reduce((s, t) => s + (now[t.key] ?? 0), 0);
      if (document.hidden) document.title = `(${total}) 🔔 ${document.title.replace(/^\(\d+\) 🔔 /, "")}`;
    }
  }, [play]);

  useEffect(() => {
    void poll();
    const t = setInterval(poll, EVERY);
    const back = () => { if (!document.hidden) document.title = document.title.replace(/^\(\d+\) 🔔 /, ""); };
    document.addEventListener("visibilitychange", back);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", back); };
  }, [poll]);

  const toggle = () => {
    const on = !prefs.on;
    save({ ...prefs, on });
    if (on) play("reservation"); // le premier clic autorise le son dans le navigateur
  };

  return (
    <>
      <div className="relative">
        <span className="inline-flex overflow-hidden rounded-full ring-1 ring-slate-200">
          <button type="button" onClick={toggle} className={"px-3 py-1.5 text-xs font-semibold " + (prefs.on ? "bg-emerald-600 text-white" : "bg-white text-ink")} title="Alertes sonores">
            {prefs.on ? "🔔 Sons activés" : compact ? "🔕 Sons" : "🔕 Activer les sons"}
          </button>
          <button type="button" onClick={() => setOpen(!open)} className="border-l border-slate-200 bg-white px-2 text-xs text-ink" aria-label="Régler les sons">⚙︎</button>
        </span>
        {open ? (
          <div className={"absolute z-50 mt-2 w-80 " + (compact ? "left-0" : "right-0") + " rounded-xl bg-white p-3 text-sm shadow-xl ring-1 ring-slate-200"}>
            <p className="font-semibold text-ink">Un son par type de demande</p>
            <p className="mb-2 text-xs text-muted">Vérifié toutes les 30 secondes, même si vous êtes sur un autre écran. Gardez l’onglet ouvert.</p>
            <ul className="space-y-1.5">
              {TYPES.map((t) => (
                <li key={t.key} className="flex items-center gap-2">
                  <input type="checkbox" className="h-4 w-4" checked={!prefs.off.includes(t.key)} onChange={(e) => save({ ...prefs, off: e.target.checked ? prefs.off.filter((x) => x !== t.key) : [...prefs.off, t.key] })} aria-label={t.label} />
                  <span className="flex-1 text-xs">{t.label}</span>
                  <button type="button" onClick={() => play(t.key)} className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-ink">▶︎ Écouter</button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      {toasts.length ? (
        <div className="fixed bottom-20 right-3 z-50 space-y-2 sm:bottom-4" role="status" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="flex max-w-xs items-start gap-2 rounded-xl bg-ink px-3.5 py-2.5 text-sm text-white shadow-xl">
              <span aria-hidden>🔔</span><span>{t.text}</span>
              <button type="button" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="ml-1 text-white/60" aria-label="Fermer">×</button>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}
