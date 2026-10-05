"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { DashItem, DashKey } from "@/lib/accounts";

const sv = { width: 19, height: 19, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
const lj = { strokeLinecap: "round", strokeLinejoin: "round" } as const;
export const DASH_ICONS: Record<DashKey, React.ReactNode> = {
  tableau: <svg {...sv}><rect x="3" y="3" width="7" height="9" rx="1.5" /><rect x="14" y="3" width="7" height="5" rx="1.5" /><rect x="14" y="12" width="7" height="9" rx="1.5" /><rect x="3" y="16" width="7" height="5" rx="1.5" /></svg>,
  annonces: <svg {...sv}><path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" {...lj} /></svg>,
  nouvelle: <svg {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 8v8M8 12h8" {...lj} /></svg>,
  statistiques: <svg {...sv}><path d="M4 20V10M10 20V4M16 20v-7M22 20H2" {...lj} /></svg>,
  demandes: <svg {...sv}><path d="M4 5h16v11H8l-4 4V5Z" {...lj} /><path d="M8 9h8M8 12h5" {...lj} /></svg>,
  reservations: <svg {...sv}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4M8 15l2.5 2.5L16 13" {...lj} /></svg>,
  messages: <svg {...sv}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20.5l1.4-4.9A8 8 0 1 1 21 12Z" {...lj} /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" strokeWidth="2.6" {...lj} /></svg>,
  favoris: <svg {...sv}><path d="M12 20.5s-7-4.6-9.2-9.1C1.3 8 3 4.5 6.3 4.5c2 0 3.4 1.2 4.2 2.5.8-1.3 2.2-2.5 4.2-2.5 3.3 0 5 3.5 3.5 6.9C19 15.9 12 20.5 12 20.5Z" {...lj} /></svg>,
  recherches: <svg {...sv}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2M9 11h4M11 9v4" {...lj} /></svg>,
  forfait: <svg {...sv}><rect x="2.5" y="5" width="19" height="14" rx="2" /><path d="M2.5 10h19M6 15h4" {...lj} /></svg>,
  api: <svg {...sv}><path d="m8 9-4 3 4 3M16 9l4 3-4 3M13.5 6l-3 12" {...lj} /></svg>,
  publicite: <svg {...sv}><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1ZM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" {...lj} /></svg>,
  factures: <svg {...sv}><path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2ZM9 8h6M9 12h6M9 16h3" {...lj} /></svg>,
  verification: <svg {...sv}><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" {...lj} /><path d="m9 12 2 2 4-4" {...lj} /></svg>,
  avis: <svg {...sv}><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9Z" {...lj} /></svg>,
  infos: <svg {...sv}><path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9Z" {...lj} /><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" {...lj} /></svg>,
  profil: <svg {...sv}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-3.9 3.6-7 8-7s8 3.1 8 7" {...lj} /></svg>,
};

function isActive(pathname: string, href: string) {
  if (href === "/mon-espace") return pathname === "/mon-espace";
  if (href === "/mon-espace/annonces") return pathname === "/mon-espace/annonces" || /^\/mon-espace\/annonces\/(?!nouvelle)/.test(pathname);
  return pathname === href || pathname.startsWith(href + "/");
}

/** Menu vertical (desktop). */
export function DashboardSideNav({ items, badges }: { items: DashItem[]; badges?: Partial<Record<DashKey, number>> }) {
  const pathname = usePathname();
  return (
    <nav className="space-y-1">
      {items.map((it) => {
        const on = isActive(pathname, it.href);
        const n = badges?.[it.key];
        return (
          <Link key={it.key} href={it.href}
            className={"flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition " +
              (on ? "bg-brand-800 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-ink")}>
            <span className={on ? "text-white" : "text-slate-400"}>{DASH_ICONS[it.key]}</span>
            <span className="flex-1">{it.label}</span>
            {n ? <span className={"rounded-full px-2 py-0.5 text-[11px] font-bold " + (on ? "bg-white/20 text-white" : "bg-accent-600 text-white")}>{n}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}

/** Onglets défilants (mobile). */
export function DashboardTabs({ items, badges }: { items: DashItem[]; badges?: Partial<Record<DashKey, number>> }) {
  const pathname = usePathname();
  return (
    <nav className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:hidden [&::-webkit-scrollbar]:hidden">
      {items.map((it) => {
        const on = isActive(pathname, it.href);
        const n = badges?.[it.key];
        return (
          <Link key={it.key} href={it.href}
            className={"inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-semibold transition " +
              (on ? "border-brand-800 bg-brand-800 text-white" : "border-slate-200 bg-white text-slate-600")}>
            <span className={on ? "text-white" : "text-slate-400"}>{DASH_ICONS[it.key]}</span>
            {it.label}
            {n ? <span className="rounded-full bg-accent-600 px-1.5 text-[10px] font-bold text-white">{n}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
