import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, displayName } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import type { SiteAccount } from "@/lib/api";
import { AdminNav } from "@/components/admin-nav";
import { getAdminSettings } from "./actions";

export const metadata: Metadata = { title: "Back-office", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Back-office du site (réglages façon « Houzez Options »), réservé aux administrateurs. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!getSession()) redirect("/compte");
  const me = await authedFetch("/site/auth/me", { method: "GET" });
  if (me.status === 401) redirect("/compte/deconnexion");
  const account = me.data as SiteAccount;
  if (!me.ok || !account?.isAdmin) {
    return (
      <div className="container-page py-16 text-center">
        <h1 className="font-display text-2xl font-extrabold text-ink">Accès réservé</h1>
        <p className="mx-auto mt-2 max-w-md text-muted">Le back-office est réservé aux administrateurs du site Moboo.ci.</p>
        <Link href="/mon-espace" className="btn-primary mt-6 inline-flex bg-brand-800 hover:bg-brand-900">Retour à mon espace</Link>
      </div>
    );
  }

  const settings = await getAdminSettings();
  const items = [
    { href: "/admin", label: "Tableau de bord", icon: "dashboard" },
    ...(settings?.schema ?? []).map((s) => ({ href: `/admin/reglages/${s.id}`, label: s.label, icon: s.icon })),
    { href: "/admin/administrateurs", label: "Administrateurs", icon: "users" },
  ];

  return (
    <div className="bg-slate-100">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[1600px] flex-col lg:flex-row">
        <aside className="shrink-0 bg-[#1f2327] lg:w-64">
          <div className="hidden items-baseline gap-2 px-4 py-4 lg:flex">
            <span className="font-display text-lg font-black text-white">Moboo</span>
            <span className="text-xs font-semibold text-slate-400">Back-office</span>
          </div>
          <AdminNav items={items} />
          <p className="hidden px-4 py-5 text-xs text-slate-500 lg:block">Connecté : {displayName(account)}</p>
        </aside>
        <main className="min-w-0 flex-1 p-3 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
