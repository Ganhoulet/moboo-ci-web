"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_ICONS } from "./admin-icons";

export interface AdminNavItem { href: string; label: string; icon: string }

/** Menu du back-office : colonne sombre (ordinateur), onglets défilants (mobile). */
export function AdminNav({ items }: { items: AdminNavItem[] }) {
  const pathname = usePathname();
  const on = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));
  return (
    <>
      <nav className="hidden lg:block">
        {items.map((it) => (
          <Link key={it.href} href={it.href}
            className={"flex items-center gap-3 border-l-4 px-4 py-3 text-sm font-semibold transition " +
              (on(it.href) ? "border-sky-400 bg-brand-700 text-white" : "border-transparent text-slate-300 hover:bg-white/5 hover:text-white")}>
            <span className={on(it.href) ? "text-white" : "text-slate-400"}>{ADMIN_ICONS[it.icon] ?? ADMIN_ICONS.gauge}</span>
            {it.label}
          </Link>
        ))}
      </nav>
      <nav className="flex gap-2 overflow-x-auto px-3 py-3 [scrollbar-width:none] lg:hidden [&::-webkit-scrollbar]:hidden">
        {items.map((it) => (
          <Link key={it.href} href={it.href}
            className={"inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold " +
              (on(it.href) ? "bg-brand-700 text-white" : "bg-white/10 text-slate-200")}>
            {ADMIN_ICONS[it.icon] ?? ADMIN_ICONS.gauge}
            {it.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
