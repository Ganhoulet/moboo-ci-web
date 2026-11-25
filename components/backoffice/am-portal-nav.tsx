"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface AmPortalItem { href: string; label: string; emoji: string; badge?: number; main?: boolean }

const Badge = ({ n }: { n?: number }) =>
  n ? <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{n > 99 ? "99+" : n}</span> : null;

/**
 * Portail des account managers : onglets en haut (tous), barre du bas sur téléphone
 * (les 4 principaux), pour travailler sur le terrain.
 */
export function AmPortalNav({ items }: { items: AmPortalItem[] }) {
  const pathname = usePathname();
  const on = (href: string) => (href === "/am" ? pathname === "/am" : pathname === href || pathname.startsWith(href + "/"));
  return (
    <>
      <nav className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <ul className="flex gap-1.5 whitespace-nowrap py-1">
          {items.map((it) => (
            <li key={it.href}>
              <Link
                href={it.href}
                className={"inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold " + (on(it.href) ? "bg-brand-800 text-white" : "bg-white text-ink ring-1 ring-slate-200 hover:bg-slate-50")}
              >
                <span aria-hidden>{it.emoji}</span>{it.label}<Badge n={it.badge} />
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden print:hidden">
        <ul className="flex">
          {items.filter((it) => it.main).map((it) => (
            <li key={it.href} className="flex-1">
              <Link href={it.href} className={"flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold " + (on(it.href) ? "text-brand-800" : "text-slate-500")}>
                <span className="relative text-lg leading-none" aria-hidden>
                  {it.emoji}
                  {it.badge ? <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-amber-500" /> : null}
                </span>
                {it.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
