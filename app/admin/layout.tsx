import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, displayName } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import type { SiteAccount } from "@/lib/api";
import { AdminNav, type AdminNavItem } from "@/components/admin-nav";
import { getAdminSettings } from "./actions";
import { TwoFactorSettings } from "@/components/two-factor-settings";
import { headers } from "next/headers";
import { can, canAccess } from "@/lib/admin-perms";
import { getModerationSummary } from "./backoffice-actions";
import { getDisputeCounts } from "./litiges/actions";

export const metadata: Metadata = { title: "Back-office", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Back-office du site (réglages façon « Houzez Options »), réservé aux administrateurs. */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!getSession()) redirect("/administration");
  const me = await authedFetch("/site/auth/me", { method: "GET" });
  if (me.status === 401) redirect("/compte/deconnexion?next=/administration");
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

  // Double authentification obligatoire pour les administrateurs : configuration d'abord.
  const tf = await authedFetch("/site/auth/2fa", { method: "GET" });
  if (tf.ok && tf.data?.required && !tf.data?.enabled) {
    return (
      <div className="bg-slate-50 py-12">
        <div className="mx-auto max-w-2xl px-4">
          <div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-ink text-2xl text-white">🔐</div>
          <h1 className="font-display text-2xl font-extrabold text-ink sm:text-3xl">Sécurisez votre accès administrateur</h1>
          <p className="mt-2 text-muted">
            Bonjour {displayName(account)}. La double authentification est obligatoire pour ouvrir le back-office :
            choisissez une méthode ci-dessous (l’application d’authentification est la plus sûre).
          </p>
          <div className="mt-6 rounded-2xl bg-white p-5 shadow-card sm:p-6">
            <TwoFactorSettings initial={tf.data} required />
          </div>
        </div>
      </div>
    );
  }

  const perms = account.permissions ?? [];
  const [settings, mod] = await Promise.all([
    getAdminSettings(),
    can(perms, "moderation") ? getModerationSummary() : Promise.resolve(null),
  ]);
  const disputes = can(perms, "disputes") ? await getDisputeCounts() : null;
  const items: AdminNavItem[] = [
    { href: "/admin", label: "Tableau de bord", icon: "dashboard" },
    // Statistiques (façon Zillow / Airbnb) : indicateurs, recherches, professionnels.
    { href: "/admin/statistiques", label: "Statistiques", icon: "gauge", group: "stats" },
    { href: "/admin/statistiques/recherches", label: "Recherches", icon: "gauge", child: true, group: "stats" },
    { href: "/admin/statistiques/professionnels", label: "Professionnels", icon: "gauge", child: true, group: "stats" },
    // Utilisateurs (façon WordPress) : comptes, fiche 360°, rôles, journal.
    { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "users", group: "utilisateurs" },
    { href: "/admin/utilisateurs/suppressions", label: "Demandes de suppression", icon: "users", child: true, group: "utilisateurs" },
    { href: "/admin/administrateurs", label: "Administrateurs", icon: "users", child: true, group: "utilisateurs" },
    { href: "/admin/roles", label: "Rôles et permissions", icon: "key", child: true, group: "utilisateurs" },
    { href: "/admin/journal", label: "Journal d’activité", icon: "history", child: true, group: "utilisateurs" },
    // Modération (façon Airbnb / Zillow) : annonces à valider, signalements.
    { href: "/admin/moderation", label: "Modération", icon: "flag", group: "moderation", badge: (mod?.pending ?? 0) + (mod?.reports ?? 0) },
    { href: "/admin/moderation?tab=reports", label: "Signalements", icon: "flag", child: true, group: "moderation", badge: mod?.reports ?? 0 },
    { href: "/admin/moderation/reglages", label: "Réglages", icon: "flag", child: true, group: "moderation" },
    // Apparence : constructeur de la page d'accueil, menu et pied de page.
    { href: "/admin/accueil", label: "Page d’accueil", icon: "layout", group: "apparence" },
    { href: "/admin/accueil/menu", label: "Menus et pied de page", icon: "layout", child: true, group: "apparence" },
    // Pages SEO (façon Yoast) : pages d'atterrissage + SEO des pages du site.
    { href: "/admin/seo", label: "Pages SEO", icon: "search", group: "seo" },
    { href: "/admin/seo/nouvelle", label: "Nouvelle page SEO", icon: "search", child: true, group: "seo" },
    { href: "/admin/seo/nouvelle?type=page", label: "SEO d’une page du site", icon: "search", child: true, group: "seo" },
    { href: "/admin/seo/redirections", label: "Redirections et 404", icon: "search", child: true, group: "seo" },
    // Marketing : bannières, flyers et pop-ups (application mobile + site).
    { href: "/admin/marketing", label: "Marketing", icon: "megaphone", group: "marketing" },
    { href: "/admin/marketing/nouvelle", label: "Nouvelle campagne", icon: "megaphone", child: true, group: "marketing" },
    // Immobilier (façon Houzez « Real Estate ») : annonces, listes, agences et agents.
    { href: "/admin/immobilier", label: "Immobilier", icon: "building", group: "immobilier" },
    ...[
      ["/admin/immobilier/nouvelle", "Nouvelle annonce"],
      ["/admin/immobilier/listes/type", "Types de bien"],
      ["/admin/immobilier/listes/status", "Statuts"],
      ["/admin/immobilier/listes/feature", "Équipements"],
      ["/admin/immobilier/listes/label", "Étiquettes"],
      ["/admin/immobilier/listes/city", "Villes"],
      ["/admin/immobilier/listes/area", "Quartiers et communes"],
      ["/admin/immobilier/equipe/agences", "Agences"],
      ["/admin/immobilier/equipe/agents", "Agents"],
      ["/admin/immobilier/partenaires", "Partenaires"],
      ["/admin/immobilier/avis", "Avis"],
      ["/admin/immobilier/forfaits", "Forfaits"],
      ["/admin/immobilier/factures", "Factures"],
    ].map(([href, label]) => ({ href, label, icon: "building", child: true, group: "immobilier" })),
    // Réservations faites sur Moboo.ci et litiges (médiation, gel du reversement).
    { href: "/admin/reservations", label: "Réservations", icon: "calendar", group: "reservations", badge: disputes?.open ?? 0 },
    { href: "/admin/litiges", label: "Litiges", icon: "scale", child: true, group: "reservations", badge: disputes?.open ?? 0 },
    { href: "/admin/litiges/reglages", label: "Réglages", icon: "scale", child: true, group: "reservations" },
    // Vérification des comptes (demandes + réglages).
    { href: "/admin/verifications", label: "Vérification des comptes", icon: "shield", group: "verifications" },
    { href: "/admin/verifications/reglages", label: "Réglages", icon: "shield", child: true, group: "verifications" },
    // Application mobile Moboo.ci : statistiques, passerelle Houzi, push, contacts.
    { href: "/admin/application", label: "Application mobile", icon: "phone", group: "application" },
    ...[
      ["/admin/application/reglages", "Réglages"],
      ["/admin/application/passerelle", "Passerelle Houzi"],
      ["/admin/application/push", "Notifications push"],
      ["/admin/application/contacts", "Contacts"],
      ["/admin/application/appareils", "Appareils"],
    ].map(([href, label]) => ({ href, label, icon: "phone", child: true, group: "application" })),
    // Rubriques, chacune suivie de ses sous-rubriques (ex. modèles d'e-mails).
    ...(settings?.schema ?? []).filter((s) => !s.parent && !s.hidden).flatMap((s) => {
      const children = (settings?.schema ?? []).filter((c) => c.parent === s.id);
      return [
        { href: `/admin/reglages/${s.id}`, label: s.label, icon: s.icon, group: children.length ? s.id : undefined },
        ...children.map((c) => ({ href: `/admin/reglages/${c.id}`, label: c.label, icon: c.icon, child: true, group: s.id })),
      ];
    }),
    { href: "/admin/sante", label: "Santé du site", icon: "gauge" },
    { href: "/admin/securite", label: "Ma sécurité (2FA)", icon: "shield" },
  ];
  // Menu limité aux rubriques du rôle ; une adresse ouverte directement sans droit affiche « Accès refusé ».
  const visible = items.filter((it) => canAccess(perms, it.href));
  const path = headers().get("x-moboo-path") ?? "/admin";
  const allowed = canAccess(perms, path);

  return (
    <div className="bg-slate-100">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[1600px] flex-col lg:flex-row">
        <aside className="shrink-0 bg-[#1f2327] lg:w-64 print:hidden">
          <div className="hidden items-baseline gap-2 px-4 py-4 lg:flex">
            <span className="font-display text-lg font-black text-white">Moboo</span>
            <span className="text-xs font-semibold text-slate-400">Back-office</span>
          </div>
          <AdminNav items={visible} />
          <p className="hidden px-4 py-5 text-xs text-slate-500 lg:block">
            Connecté : {displayName(account)}
            {account.adminRole ? <><br /><span className="text-slate-400">Rôle : {account.adminRole.name}</span></> : null}
          </p>
        </aside>
        <main className="min-w-0 flex-1 p-3 sm:p-6">
          {allowed ? children : (
            <div className="mx-auto max-w-lg rounded-lg bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-3xl">🔒</p>
              <h1 className="mt-2 font-display text-xl font-extrabold text-ink">Accès refusé</h1>
              <p className="mt-2 text-sm text-muted">Votre rôle ({account.adminRole?.name ?? "—"}) ne donne pas accès à cette rubrique. Demandez à un super administrateur de modifier vos permissions.</p>
              <Link href="/admin" className="mt-5 inline-flex rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Tableau de bord</Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
