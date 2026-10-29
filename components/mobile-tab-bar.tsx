"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { zoneOf, type MobileZone } from "@/lib/mobile-zones";

type Tab = { label: string; href: string; icon: string };

const ICONS: Record<string, React.ReactNode> = {
  accueil: <path d="M3 11 12 4l9 7v8a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" strokeLinejoin="round" />,
  recherche: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" strokeLinecap="round" /></>,
  favoris: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" strokeLinejoin="round" />,
  publier: <><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" strokeLinecap="round" /></>,
  messages: <path d="M4 5h16v11H8l-4 4z" strokeLinejoin="round" />,
  compte: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-3.3 3.6-6 8-6s8 2.7 8 6" strokeLinecap="round" /></>,
  carte: <><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" strokeLinejoin="round" /><path d="M9 4v14M15 6v14" /></>,
  meubles: <><path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6M3 18h18M3 14h18" strokeLinecap="round" /><path d="M6 10V7a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3" /></>,
  espaces: <path d="m12 3 2.7 5.5 6 .9-4.3 4.2 1 6L12 16.8 6.6 19.6l1-6L3.3 9.4l6-.9z" strokeLinejoin="round" />,
  agents: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3 3-5.5 6.5-5.5s6.5 2.5 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.6c2.1.6 3.5 2.6 3.5 5.4" strokeLinecap="round" /></>,
};

/** « Libellé | lien | icône », une ligne par onglet (back-office → En-têtes → Téléphone). */
export function parseTabs(raw: string): Tab[] {
  return String(raw || "")
    .split("\n")
    .map((l) => l.split("|").map((x) => x.trim()))
    .filter(([label, href]) => label && href && (href.startsWith("/") || /^https:\/\//.test(href)))
    .map(([label, href, icon]) => ({ label: label.slice(0, 16), href, icon: ICONS[icon ?? ""] ? icon! : "accueil" }))
    .slice(0, 5);
}

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(href + "/"));

/**
 * Menu du bas sur téléphone, façon application : fixe, toujours visible.
 * Masqué dans le back-office et sur les zones décochées. « /compte » mène à « Mon espace » une fois connecté.
 */
export function MobileTabBar({ items, style, color, loggedIn, zones }: { items: string; style: string; color: string; loggedIn: boolean; zones: MobileZone[] }) {
  const path = usePathname() || "/";
  const tabs = parseTabs(items);
  // Pages choisies dans le back-office (fiches d'annonce exclues par défaut : elles ont leur barre Contacter / Réserver).
  // Page de publication rapide (/p/…) : elle a ses propres boutons en bas.
  if (path.startsWith("/admin") || path.startsWith("/p/") || tabs.length < 2 || !zones.includes(zoneOf(path))) return null;
  const on = color === "accent" ? "text-accent-600" : "text-brand-800";
  const floating = style === "floating";
  return (
    <>
      <div className="h-16 md:hidden print:hidden" aria-hidden="true" />
      <nav aria-label="Navigation principale"
        className={"print:hidden fixed z-50 md:hidden " + (floating
          ? "inset-x-3 bottom-3 rounded-2xl bg-white/95 shadow-xl ring-1 ring-slate-200 backdrop-blur"
          : "inset-x-0 bottom-0 border-t border-slate-200 bg-white/95 backdrop-blur")}
        style={floating ? undefined : { paddingBottom: "env(safe-area-inset-bottom)" }}>
        <ul className="flex h-16 items-stretch justify-around">
          {tabs.map((t) => {
            const href = t.href === "/compte" && loggedIn ? "/mon-espace" : t.href;
            const active = isActive(path, href);
            const center = style === "publish" && t.icon === "publier";
            return (
              <li key={t.label + t.href} className="flex flex-1">
                <Link href={href} aria-current={active ? "page" : undefined}
                  className={"flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition " + (active ? on : "text-slate-500")}>
                  {center ? (
                    <span className={"-mt-6 grid h-12 w-12 place-items-center rounded-full text-white shadow-lg ring-4 ring-white " + (color === "accent" ? "bg-accent-600" : "bg-brand-800")}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><path d="M12 6v12M6 12h12" strokeLinecap="round" /></svg>
                    </span>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} aria-hidden="true">{ICONS[t.icon]}</svg>
                  )}
                  {style === "icons" ? <span className="sr-only">{t.label}</span> : <span className="leading-none">{t.label}</span>}
                  {active && !center ? <span className={"mt-0.5 h-0.5 w-5 rounded-full " + (color === "accent" ? "bg-accent-600" : "bg-brand-800")} /> : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
