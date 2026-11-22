"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Fc, pct, type Fil, type MarketEvent, type Quote } from "./types";

const FIL_MS = 30_000;
const PAGE_MS = 5 * 60_000;

const sensClass = (s: string | null | undefined) => (s === "hausse" ? "text-emerald-400" : s === "baisse" ? "text-red-400" : "text-slate-400");
const arrow = (s: string | null | undefined) => (s === "hausse" ? "▲" : s === "baisse" ? "▼" : "■");

function ago(iso: string, now: number) {
  const s = Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
  if (s < 60) return "à l’instant";
  if (s < 3600) return `il y a ${Math.floor(s / 60)} min`;
  if (s < 86_400) return `il y a ${Math.floor(s / 3600)} h`;
  return `il y a ${Math.floor(s / 86_400)} j`;
}

/** Interroge le fil toutes les 30 s et recharge les tableaux toutes les 5 min, sans recharger la page. */
function useFil(commune: string, initial: Quote[], initialEvents: MarketEvent[] = []) {
  const router = useRouter();
  const [quotes, setQuotes] = useState(initial);
  const [events, setEvents] = useState<MarketEvent[]>(initialEvents);
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState<Record<string, "hausse" | "baisse">>({});
  const [updated, setUpdated] = useState<number | null>(null);
  const last = useRef<string | null>(null);
  const prev = useRef<Map<string, number>>(new Map(initial.map((q) => [q.id, q.median])));

  useEffect(() => {
    let stop = false;
    const load = async () => {
      const q = new URLSearchParams();
      if (last.current) q.set("depuis", last.current);
      if (commune) q.set("commune", commune);
      const r = await fetch(`/admin/intelligence/fil?${q}`, { cache: "no-store" }).catch(() => null);
      if (!r?.ok || stop) return;
      const f: Fil = await r.json();
      setEvents((cur) => {
        const known = new Set(cur.map((e) => e.id));
        const nouveaux = f.events.filter((e) => !known.has(e.id));
        setFresh(new Set(last.current ? nouveaux.map((e) => e.id) : []));
        return [...nouveaux, ...cur].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 60);
      });
      if (f.quotes.length) {
        const m: Record<string, "hausse" | "baisse"> = {};
        for (const x of f.quotes) {
          const before = prev.current.get(x.id);
          if (before != null && before !== x.median) m[x.id] = x.median > before ? "hausse" : "baisse";
          prev.current.set(x.id, x.median);
        }
        setMoves(m);
        setQuotes((cur) => {
          const byId = new Map(f.quotes.map((x) => [x.id, x]));
          const kept = cur.filter((x) => byId.has(x.id)).map((x) => byId.get(x.id)!);
          return [...kept, ...f.quotes.filter((x) => !cur.some((c) => c.id === x.id))];
        });
      }
      last.current = f.at;
      setUpdated(Date.now());
    };
    void load();
    const a = setInterval(load, FIL_MS);
    const b = setInterval(() => router.refresh(), PAGE_MS);
    const vis = () => { if (document.visibilityState === "visible") { void load(); router.refresh(); } };
    document.addEventListener("visibilitychange", vis);
    return () => { stop = true; clearInterval(a); clearInterval(b); document.removeEventListener("visibilitychange", vis); };
  }, [commune, router]);

  return { quotes, events, fresh, moves, updated };
}

function useNow(ms = 5000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), ms); return () => clearInterval(t); }, [ms]);
  return now;
}

/** Bandeau de bourse + fil des derniers mouvements. */
export function LiveMarket({ commune, initialQuotes, initialEvents }: { commune: string; initialQuotes: Quote[]; initialEvents?: MarketEvent[] }) {
  const { quotes, events, fresh, moves, updated } = useFil(commune, initialQuotes, initialEvents);
  const now = useNow();
  const loop = quotes.length ? [...quotes, ...quotes] : [];
  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-xl bg-[#0b1f3a] shadow-sm">
        <div className="flex items-center gap-2 px-4 pt-3 text-xs text-slate-300">
          <span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" /></span>
          <span className="font-bold uppercase tracking-wide text-white">Marché en direct</span>
          <span className="ml-auto">{updated ? `Mis à jour ${ago(new Date(updated).toISOString(), now)}` : "Connexion…"}</span>
        </div>
        <div className="group relative mt-2 overflow-hidden bg-black/20 py-2" aria-label="Cotations : prix médian et variation">
          {loop.length ? (
            <div className="ticker-track flex w-max group-hover:[animation-play-state:paused]" style={{ animation: `tickerScroll ${Math.max(30, quotes.length * 6)}s linear infinite` }}>
              {loop.map((q, i) => (
                <span key={`${q.id}-${i}`} className="mx-1 flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1 text-sm"
                  style={moves[q.id] ? { animation: `${moves[q.id] === "hausse" ? "flashUp" : "flashDown"} 1.6s ease-out` } : undefined}
                  title={`${q.count} annonces · 7 j : ${pct(q.change7) || "—"} · 30 j : ${pct(q.change30) || "—"}`}>
                  <span className="font-semibold text-slate-300">{q.label}</span>
                  <span className="font-extrabold tabular-nums text-white">{Fc(q.median)}</span>
                  <span className={"text-xs font-bold tabular-nums " + sensClass(q.sens)}>{arrow(q.sens)} {pct(q.change7 ?? q.change30)}</span>
                  <span className="ml-1 h-3 w-px bg-white/10" />
                </span>
              ))}
            </div>
          ) : <p className="px-4 text-sm text-slate-400">Cotations en cours de calcul (au moins {3} annonces par catégorie).</p>}
        </div>
      </div>
      <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="mb-2 flex items-baseline justify-between">
          <h2 className="font-bold text-ink">Derniers mouvements</h2>
          <span className="text-xs text-muted">Nouvelles annonces, baisses de prix, recherches des visiteurs, départs signalés</span>
        </div>
        <ul className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
          {events.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2 text-sm" style={fresh.has(e.id) ? { animation: "rowIn 2.5s ease-out" } : undefined}>
              <span className={"inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold " + EVENT_STYLE[e.type]?.bg}>{EVENT_STYLE[e.type]?.icon ?? "•"}</span>
              <span className="min-w-0 flex-1 truncate text-slate-700">{e.texte}</span>
              {e.prix != null ? <span className="font-bold tabular-nums text-ink">{Fc(e.prix)}</span> : null}
              {e.ecartPct ? <span className={"w-24 text-right text-xs font-semibold " + (e.sens === "hausse" ? "text-emerald-700" : "text-red-600")}>{pct(e.ecartPct)}{e.type === "annonce" ? " / marché" : ""}</span> : <span className="w-24" />}
              <span className="w-24 text-right text-xs text-muted">{ago(e.at, now)}</span>
            </li>
          ))}
          {!events.length ? <li className="py-6 text-center text-sm text-muted">Aucun mouvement depuis 48 heures.</li> : null}
        </ul>
      </div>
    </div>
  );
}

const EVENT_STYLE: Record<string, { icon: string; bg: string }> = {
  annonce: { icon: "N", bg: "bg-blue-100 text-blue-800" },
  baisse: { icon: "▼", bg: "bg-red-100 text-red-700" },
  recherche: { icon: "?", bg: "bg-slate-100 text-slate-700" },
  recherche_vide: { icon: "∅", bg: "bg-amber-100 text-amber-800" },
  depart: { icon: "→", bg: "bg-violet-100 text-violet-800" },
};
