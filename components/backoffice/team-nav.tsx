"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type TeamIcon } from "@/components/team-icons";

interface Tab { href: string; label: string; icon: TeamIcon; main?: boolean; count?: number }
interface Group { id: string; label: string; icon: TeamIcon; tabs: Tab[] }

const Count = ({ n, light }: { n?: number; light?: boolean }) =>
  n ? <span className={"ml-auto min-w-[1.25rem] rounded-full px-1.5 py-0.5 text-center text-[11px] font-bold leading-none " + (light ? "bg-white/20 text-white" : "bg-amber-500 text-white")}>{n > 99 ? "99+" : n}</span> : null;

function useActive(groups: Group[]) {
  const pathname = usePathname();
  const match = (href: string) => pathname === href || pathname.startsWith(href + "/");
  // Onglet actif : le plus précis (ex. /equipe/comptes/support plutôt que /equipe/comptes).
  const active = groups.flatMap((g) => g.tabs).filter((t) => match(t.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  return { home: pathname === "/equipe", active, current: groups.find((g) => g.tabs.some((t) => t.href === active)) };
}

/**
 * Menu vertical de l'Espace équipe (ordinateur) : Accueil, puis chaque rubrique du rôle
 * avec ses onglets ; la rubrique ouverte se déplie.
 */
export function TeamSidebar({ groups }: { groups: Group[] }) {
  const { home, active, current } = useActive(groups);
  const total = (g: Group) => g.tabs.reduce((s, t) => s + (t.count ?? 0), 0);
  const item = (on: boolean) => "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition " + (on ? "bg-brand-800 text-white shadow-sm" : "text-slate-700 hover:bg-slate-100 hover:text-ink");
  return (
    <nav aria-label="Rubriques" className="space-y-1">
      <Link href="/equipe" className={item(home)}><Icon name="home" />Accueil</Link>
      {groups.map((g) => {
        const open = current?.id === g.id;
        return (
          <div key={g.id} className={open || groups.length <= 2 ? "pt-2" : ""}>
            {open || groups.length <= 2 ? (
              <p className="flex items-center gap-2.5 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-800"><Icon name={g.icon} size={15} />{g.label}</p>
            ) : (
              <Link href={g.tabs[0].href} className={item(false)}>
                <Icon name={g.icon} className="text-slate-500" />{g.label}<Count n={total(g)} />
              </Link>
            )}
            {open || groups.length <= 2 ? (
              <ul className="mt-0.5 space-y-0.5">
                {g.tabs.map((t) => (
                  <li key={t.href}>
                    <Link href={t.href} className={item(t.href === active)}>
                      <Icon name={t.icon} className={t.href === active ? "" : "text-slate-400"} />{t.label}<Count n={t.count} light={t.href === active} />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}
    </nav>
  );
}

/** Téléphone : rubriques en haut (défilantes), onglets de la rubrique, barre de raccourcis en bas. */
export function TeamMobileNav({ groups }: { groups: Group[] }) {
  const { home, active, current } = useActive(groups);
  const pill = (on: boolean) => "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold " + (on ? "bg-brand-800 text-white" : "bg-white text-ink ring-1 ring-slate-200");
  const main = [{ href: "/equipe", label: "Accueil", icon: "home" } as Tab, ...groups.flatMap((g) => g.tabs.filter((t) => t.main))].slice(0, 4);
  return (
    <>
      <nav className="-mx-3 overflow-x-auto px-3" aria-label="Rubriques">
        <ul className="flex gap-1.5 whitespace-nowrap py-1">
          <li><Link href="/equipe" className={pill(home)}><Icon name="home" size={16} />Accueil</Link></li>
          {groups.map((g) => <li key={g.id}><Link href={g.tabs[0].href} className={pill(current?.id === g.id)}><Icon name={g.icon} size={16} />{g.label}</Link></li>)}
        </ul>
      </nav>
      {current && current.tabs.length > 1 ? (
        <nav className="-mx-3 mt-1 overflow-x-auto border-b border-slate-200 px-3" aria-label={current.label}>
          <ul className="flex gap-4 whitespace-nowrap text-sm">
            {current.tabs.map((t) => (
              <li key={t.href}>
                <Link href={t.href} className={"inline-flex items-center gap-1.5 border-b-2 py-2 font-semibold " + (t.href === active ? "border-brand-800 text-brand-800" : "border-transparent text-slate-600")}>
                  <Icon name={t.icon} size={16} />{t.label}{t.count ? <span className="rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">{t.count}</span> : null}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] print:hidden" aria-label="Raccourcis">
        <ul className="flex">
          {main.map((t) => {
            const on = t.href === "/equipe" ? home : t.href === active;
            return (
              <li key={t.href} className="flex-1">
                <Link href={t.href} className={"flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold " + (on ? "text-brand-800" : "text-slate-500")}>
                  <span className="relative"><Icon name={t.icon} size={20} />{t.count ? <span className="absolute -right-1.5 -top-1 h-2 w-2 rounded-full bg-amber-500" /> : null}</span>
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
