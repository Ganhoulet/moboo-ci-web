"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_ICONS } from "./admin-icons";

export interface AdminNavItem {
  href: string; label: string; icon: string;
  /** Sous-rubrique : affichée sous sa rubrique parente quand celle-ci est ouverte. */
  child?: boolean;
  group?: string;
  /** Pastille (ex. annonces à valider). */
  badge?: number;
}

const Badge = ({ n }: { n?: number }) => (n ? <span className="ml-auto rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{n > 99 ? "99+" : n}</span> : null);

/** Menu du back-office : colonne sombre (ordinateur), onglets défilants (mobile). */
export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  const on = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname === href || pathname.startsWith(href + "/"));
  // Rubrique ouverte : celle de la page affichée (parente ou l'une de ses sous-rubriques).
  const openGroup = items.find((it) => on(it.href))?.group;
  return (
    <>
      <nav className="hidden lg:block">
        {items.filter((it) => !it.child || it.group === openGroup).map((it) => it.child ? (
          <Link key={it.href} href={it.href}
            className={"flex items-center py-2 pl-14 pr-4 text-[13px] font-medium transition " + (on(it.href) ? "bg-white/10 text-white" : "text-slate-400 hover:text-white")}>
            {it.label}
            <Badge n={it.badge} />
          </Link>
        ) : (
          <Link key={it.href} href={it.href}
            className={"flex items-center gap-3 border-l-4 px-4 py-3 text-sm font-semibold transition " +
              (on(it.href) || (it.group && it.group === openGroup) ? "border-sky-400 bg-brand-700 text-white" : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white")}>
            <span className={on(it.href) ? "text-white" : "text-slate-400"}>{ADMIN_ICONS[it.icon] ?? ADMIN_ICONS.gauge}</span>
            <span className="flex-1">{it.label}</span>
            <Badge n={it.badge} />
            {it.group && !it.child ? <span className="text-xs opacity-70">{it.group === openGroup ? "▾" : "▸"}</span> : null}
          </Link>
        ))}
      </nav>
      <nav className="flex gap-2 overflow-x-auto px-3 py-3 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        {items.filter((it) => !it.child || it.group === openGroup).map((it) => (
          <Link key={it.href} href={it.href}
            className={"inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold " +
              (on(it.href) ? "bg-brand-700 text-white" : "bg-white/10 text-slate-200")}>
            {ADMIN_ICONS[it.icon] ?? ADMIN_ICONS.gauge}
            {it.label}
            {it.badge ? <span className="rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">{it.badge}</span> : null}
          </Link>
        ))}
      </nav>
    </>
  );
}
