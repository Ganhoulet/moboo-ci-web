import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, displayName, initials } from "@/lib/session";
import { accountLabel, isPublisher, menuFor } from "@/lib/accounts";
import { DashboardSideNav, DashboardTabs } from "@/components/dashboard-nav";
import { FavoritesSync } from "@/components/favorites-sync";
import { logoutAction } from "@/app/compte/actions";
import { listMyInquiries, unreadMessages } from "./actions";
import { authedFetch } from "@/lib/server-api";
import type { SiteAccount } from "@/lib/api";

export const metadata: Metadata = { title: "Mon espace", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EspaceLayout({ children }: { children: React.ReactNode }) {
  const snapshot = getSession();
  if (!snapshot) redirect("/compte");
  // Session réellement valide ? (compte supprimé, jeton révoqué…) → nettoyage.
  const me = await authedFetch("/site/auth/me", { method: "GET" });
  if (me.status === 401) redirect("/compte/deconnexion");
  // Profil à jour (modifié depuis un autre appareil) ; l'instantané du cookie en secours.
  const account: SiteAccount = me.ok ? (me.data as SiteAccount) : snapshot;
  // Pas encore de profil : on le choisit d'abord (l'espace en dépend).
  if (!account.onboarded) redirect("/inscription");

  const type = account.accountType ?? "particulier";
  const items = menuFor(type);
  const publisher = isPublisher(type);
  const [newInquiries, unread] = await Promise.all([
    publisher ? listMyInquiries().then((xs) => xs.filter((q) => q.status === "new").length) : 0,
    unreadMessages(),
  ]);
  const badges = { ...(newInquiries ? { demandes: newInquiries } : {}), ...(unread ? { messages: unread } : {}) };
  const name = account.companyName && (type === "entreprise" || type === "agent") ? account.companyName : displayName(account);

  return (
    <div className="container-page py-6 lg:py-8">
      <FavoritesSync />
      <div className="lg:grid lg:grid-cols-[250px_1fr] lg:gap-8">
        {/* Barre latérale (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 space-y-5">
            <div className="rounded-2xl bg-white p-4 shadow-card">
              <div className="flex items-center gap-3">
                {account.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={account.avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-800 font-bold text-white">{initials(account)}</span>
                )}
                <div className="min-w-0">
                  <p className="truncate font-display font-bold text-ink">{name}</p>
                  <p className="truncate text-xs text-muted">{accountLabel(account)}</p>
                </div>
              </div>
              {publisher && account.username ? (
                <Link href={`/pro/${account.username}`} className="mt-3 block rounded-lg bg-slate-50 px-3 py-2 text-center text-xs font-semibold text-brand-800 hover:bg-brand-50">
                  Voir ma page publique ↗
                </Link>
              ) : null}
            </div>
            <DashboardSideNav items={items} badges={badges} />
            {account.isAdmin ? (
              <Link href="/admin" className="flex items-center gap-3 rounded-xl bg-[#1f2327] px-3 py-2.5 text-sm font-semibold text-white hover:bg-black">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" /></svg>
                Back-office du site
              </Link>
            ) : null}
            <form action={logoutAction}>
              <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-600">
                <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 17l5-5-5-5M20 12H9M12 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Se déconnecter
              </button>
            </form>
          </div>
        </aside>

        {/* Contenu */}
        <main className="min-w-0">
          <div className="mb-5 lg:hidden">
            <DashboardTabs items={items} badges={badges} />
            {account.isAdmin ? (
              <Link href="/admin" className="mt-3 inline-flex rounded-full bg-[#1f2327] px-3.5 py-2 text-sm font-semibold text-white">⚙ Back-office du site</Link>
            ) : null}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
