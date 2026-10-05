"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { CreativeView } from "./creative";
import type { LiveCampaign } from "@/lib/marketing";
import { trackCampaignAction } from "@/app/marketing-actions";

const KEY = "moboo_popups";
type Seen = Record<string, { v: string; at: number; never?: boolean }>;
const read = (): Seen => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };
const write = (s: Seen) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* navigation privée */ } };
const track = (id: string, event: "view" | "click" | "dismiss") => { void trackCampaignAction(id, event).catch(() => {}); };

/** Pop-up marketing du site (une campagne à la fois, selon sa fréquence). */
export function SitePopup({ items, loggedIn }: { items: LiveCampaign[]; loggedIn: boolean }) {
  const path = usePathname();
  const [c, setC] = useState<LiveCampaign | null>(null);

  useEffect(() => {
    if (path.startsWith("/admin") || path.startsWith("/administration") || path.startsWith("/connexion")) return;
    const seen = read();
    const next = items.find((x) => {
      if (x.audience === "guests" && loggedIn) return false;
      if (x.audience === "members" && !loggedIn) return false;
      const s = seen[x.id];
      if (!s || s.v !== x.version) return true;
      if (s.never) return false;
      if (x.frequency === "always") return !sessionStorage.getItem(`moboo_popup_${x.id}`);
      if (x.frequency === "daily") return Date.now() - s.at > 86_400_000;
      return false;
    });
    if (!next) return;
    const t = setTimeout(() => {
      if (document.querySelector("[data-notice-popup]")) return; // une information ciblée est déjà ouverte
      setC(next);
      track(next.id, "view");
      write({ ...read(), [next.id]: { v: next.version, at: Date.now() } });
      try { sessionStorage.setItem(`moboo_popup_${next.id}`, "1"); } catch { /* */ }
    }, Math.max(0, next.delaySec) * 1000);
    return () => clearTimeout(t);
  }, [items, loggedIn, path]);

  if (!c) return null;
  const close = (never = false) => {
    if (never) { write({ ...read(), [c.id]: { v: c.version, at: Date.now(), never: true } }); track(c.id, "dismiss"); }
    setC(null);
  };
  const body = <div className="w-full"><CreativeView c={c} variant="popup" /></div>;
  return (
    <div data-marketing-popup className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/60 p-6 backdrop-blur-[2px]" role="dialog" aria-modal="true" onClick={() => close()}>
      <div className="w-full max-w-sm animate-[fadeIn_.2s_ease-out]" onClick={(e) => e.stopPropagation()}>
        {c.ctaUrl ? <a href={c.ctaUrl} onClick={() => track(c.id, "click")} {...(/^https?:/.test(c.ctaUrl) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{body}</a> : body}
      </div>
      <button type="button" aria-label="Fermer" onClick={() => close()} className="mt-5 grid h-11 w-11 place-items-center rounded-full border-2 border-white text-lg text-white hover:bg-white/10">✕</button>
      {c.dismissible ? <button type="button" onClick={(e) => { e.stopPropagation(); close(true); }} className="mt-2 text-sm font-semibold text-white hover:underline">Ne plus afficher</button> : null}
    </div>
  );
}
