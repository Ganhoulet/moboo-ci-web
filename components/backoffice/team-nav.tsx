"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Tab { href: string; label: string; emoji: string; main?: boolean; count?: number }
interface Group { id: string; label: string; emoji: string; tabs: Tab[] }

const Badge = ({ n }: { n?: number }) =>
  n ? <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{n > 99 ? "99+" : n}</span> : null;

/**
 * Navigation de l'Espace équipe : rubriques du rôle (Accueil, Mes comptes, Comptabilité…),
 * puis les onglets de la rubrique ouverte ; barre du bas sur téléphone.
 */
export function TeamNav({ groups }: { groups: Group[] }) {
  const pathname = usePathname();
  const match = (href: string) => pathname === href || pathname.startsWith(href + "/");
  // Onglet actif : le plus précis (ex. /equipe/comptes/support plutôt que /equipe/comptes).
  const active = groups.flatMap((g) => g.tabs).filter((t) => match(t.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const current = groups.find((g) => g.tabs.some((t) => t.href === active));
  const home = pathname === "/equipe";
  const total = (g: Group) => g.tabs.reduce((s, t) => s + (t.count ?? 0), 0);
  const pill = (on: boolean) => "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold " + (on ? "bg-brand-800 text-white" : "bg-white text-ink ring-1 ring-slate-200 hover:bg-slate-50");
  const main = [{ href: "/equipe", label: "Accueil", emoji: "🏠" } as Tab, ...groups.flatMap((g) => g.tabs.filter((t) => t.main))].slice(0, 4);

  return (
    <>
      <nav className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0" aria-label="Rubriques">
        <ul className="flex gap-1.5 whitespace-nowrap py-1">
          <li><Link href="/equipe" className={pill(home)}><span aria-hidden>🏠</span>Accueil</Link></li>
          {groups.map((g) => (
            <li key={g.id}><Link href={g.tabs[0].href} className={pill(current?.id === g.id)}><span aria-hidden>{g.emoji}</span>{g.label}<Badge n={total(g)} /></Link></li>
          ))}
        </ul>
      </nav>
      {current && current.tabs.length > 1 ? (
        <nav className="-mx-3 mt-1 overflow-x-auto border-b border-slate-200 px-3 sm:mx-0 sm:px-0" aria-label={current.label}>
          <ul className="flex gap-4 whitespace-nowrap text-sm">
            {current.tabs.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className={"inline-flex items-center gap-1.5 border-b-2 py-2 font-semibold " + (t.href === active ? "border-brand-800 text-brand-800" : "border-transparent text-slate-600 hover:text-ink")}>
                  <span aria-hidden>{t.emoji}</span>{t.label}<Badge n={t.count} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] sm:hidden print:hidden" aria-label="Raccourcis">
        <ul className="flex">
          {main.map((t) => (
            <li key={t.href} className="flex-1">
              <Link href={t.href} className={"flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold " + ((t.href === "/equipe" ? home : t.href === active) ? "text-brand-800" : "text-slate-500")}>
                <span className="relative text-lg leading-none" aria-hidden>
                  {t.emoji}
                  {t.count ? <span className="absolute -right-2 -top-1 h-2 w-2 rounded-full bg-amber-500" /> : null}
                </span>
                {t.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
