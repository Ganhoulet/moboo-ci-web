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
import { getServicesBadges } from "./services/actions";
import { getAm } from "./comptes/actions";
import { TeamMobileNav, TeamSidebar } from "@/components/backoffice/team-nav";
import { Icon } from "@/components/team-icons";
import { SoundAlerts } from "@/components/backoffice/sound-alerts";
import { teamGroupsFor } from "@/lib/team-space";


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
  const path = headers().get("x-moboo-path") ?? "/admin";
  // Back-office complet : réservé aux rôles qui ont la case « Accès au back-office complet »
  // (Rôles et permissions). Avant la mise à jour de l'API, les rôles qui gèrent les rôles ET
  // les réglages y gardent accès. Les autres travaillent dans l'Espace équipe (ep.moboo.ci) :
  // toute adresse /admin/… y est renvoyée. Les droits restent vérifiés par l'API.
  const fullAccess = perms.includes("backoffice") || (perms.includes("roles") && perms.includes("settings"));
  const inTeam = headers().get("x-moboo-portal") === "equipe";
  if (!fullAccess && !inTeam) redirect(path === "/admin" ? "/equipe" : "/equipe" + path.slice("/admin".length));
  const amOnly = !fullAccess;
  if (inTeam) {
    const isAm = can(perms, "accounts");
    const [amBadge, amSupport, mine] = await Promise.all([
      isAm ? getAm<{ urgent: number; pending: number }>("/badge").catch(() => null) : null,
      can(perms, "am.support") ? getAm<{ unread: number }>("/support?status=ouvert").catch(() => null) : null,
      isAm ? getAm<{ name: string; avatarUrl: string | null; kinds: string[]; listingTypes: string[]; zones: string[]; team: { name: string } | null }>("/me").catch(() => null) : null,
    ]);
    // Spécialité de l'account manager : produits suivis (rien de réglé = tout ; le responsable voit tout).
    const kinds = can(perms, "accounts.all") || !mine?.kinds?.length ? ["org", "event", "site"] : mine.kinds;
    const KIND_NAME: Record<string, string> = { org: "Résidences meublées", event: "Espaces événementiels", site: "Annonces immobilières" };
    const specialty = isAm ? [
      mine?.kinds?.length ? mine.kinds.map((k) => KIND_NAME[k] ?? k).join(", ") : "Tous les produits",
      mine?.listingTypes?.length ? mine.listingTypes.join(", ") : null,
      mine?.zones?.length ? mine.zones.slice(0, 4).join(", ") + (mine.zones.length > 4 ? "…" : "") : null,
    ].filter(Boolean).join(" · ") : null;
    const groups = teamGroupsFor({
      perms, hosts: kinds.includes("org") || kinds.includes("event"), ads: kinds.includes("site"),
      badges: { urgent: amBadge?.urgent ?? 0, pending: amBadge?.pending ?? 0, support: amSupport?.unread ?? 0 },
    });
    const ok = canAccess(perms, path);
    const avatar = mine?.avatarUrl ?? account.avatarUrl ?? null;
    return (
      <div className="min-h-[calc(100dvh-4rem)] bg-slate-50 pb-20 lg:pb-8">
        <div className="mx-auto flex max-w-[1500px] gap-6 px-3 pt-4 sm:px-6 lg:pt-6">
          {/* Colonne de gauche (ordinateur) : qui je suis, puis le menu de mes rubriques. */}
          <aside className="hidden w-64 shrink-0 lg:block print:hidden">
            <div className="sticky top-4 space-y-4">
              <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200">
                <p className="text-[11px] font-bold uppercase tracking-wider text-brand-800">Espace équipe Moboo</p>
                <div className="mt-3 flex items-center gap-3">
                  <Link href="/mon-espace/profil" className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-800 text-sm font-bold text-white" title="Mon profil (photo, coordonnées)">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : (displayName(account) || "M").slice(0, 2).toUpperCase()}
                  </Link>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-ink">{displayName(account)}</p>
                    <p className="truncate text-xs text-muted">{account.adminRole?.name ?? "Équipe"}{mine?.team ? ` · ${mine.team.name}` : ""}</p>
                  </div>
                </div>
                {specialty ? <p className="mt-2 text-[11px] font-medium leading-snug text-slate-500">{specialty}</p> : null}
              </div>
              <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200"><TeamSidebar groups={groups} /></div>
              <div className="space-y-0.5 px-1 text-sm">
                <Link href="/mon-espace/profil" className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-white hover:text-ink"><Icon name="user" size={16} />Mon profil</Link>
                <Link href="/admin/securite" className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-white hover:text-ink"><Icon name="lock" size={16} />Sécurité</Link>
                {!amOnly ? <Link href="/admin?complet=1" className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-slate-600 hover:bg-white hover:text-ink"><Icon name="layout" size={16} />Back-office complet</Link> : null}
              </div>
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            {/* Barre du haut : identité (téléphone), alertes sonores, raccourcis. */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 lg:hidden">
                <Link href="/mon-espace/profil" className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-brand-800 text-sm font-bold text-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : (displayName(account) || "M").slice(0, 2).toUpperCase()}
                </Link>
                <div>
                  <p className="font-display font-black text-ink">Espace équipe Moboo</p>
                  <p className="text-xs text-muted">{displayName(account)}{account.adminRole ? ` · ${account.adminRole.name}` : ""}</p>
                </div>
              </div>
              <div className="ml-auto flex flex-wrap items-center gap-2 text-xs font-semibold">
                <SoundAlerts />
                <Link href="/mon-espace/profil" className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-ink ring-1 ring-slate-200 lg:hidden"><Icon name="user" size={14} />Profil</Link>
                {!amOnly ? <Link href="/admin?complet=1" className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-white lg:hidden"><Icon name="layout" size={14} />Back-office</Link> : null}
              </div>
            </div>
            <div className="mt-3 lg:hidden"><TeamMobileNav groups={groups} /></div>
            <main className="mt-4 min-w-0">
              {ok ? children : (
                <div className="mx-auto max-w-lg rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-slate-200">
                  <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500"><Icon name="lock" size={22} /></span>
                  <h1 className="mt-3 font-display text-xl font-extrabold text-ink">Accès refusé</h1>
                  <p className="mt-2 text-sm text-muted">Votre rôle ({account.adminRole?.name ?? "—"}) ne donne pas accès à cet écran.</p>
                  <Link href="/equipe" className="mt-5 inline-flex rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-800">Accueil de l’Espace équipe</Link>
                </div>
              )}
            </main>
          </div>
        </div>
      </div>
    );
  }

  const [settings, mod] = await Promise.all([
    getAdminSettings(),
    can(perms, "moderation") ? getModerationSummary() : Promise.resolve(null),
  ]);
  const disputes = can(perms, "disputes") ? await getDisputeCounts() : null;
  const svc = can(perms, "services") ? await getServicesBadges() : { edl: 0, leads: 0, missions: 0 };
  const am = can(perms, "accounts") ? await getAm<{ urgent: number; pending: number }>("/badge").catch(() => null) : null;
  const items: AdminNavItem[] = [
    { href: "/admin", label: "Tableau de bord", icon: "dashboard" },
    // Espace équipe (ep.moboo.ci) : la vue allégée de chaque membre de l'équipe, selon son rôle.
    { href: "/equipe", label: "Ouvrir l’Espace équipe", icon: "users" },
    // Statistiques (façon Zillow / Airbnb) : indicateurs, recherches, professionnels.
    // Intelligence immobilière : marché Moboo.ci en direct par zone, type et prix (version avancée de l'accueil Moboo Pro).
    { href: "/admin/intelligence", label: "Intelligence immobilière", icon: "gauge", group: "intel" },
    { href: "/admin/intelligence", label: "Tableau de bord du marché", icon: "gauge", child: true, group: "intel" },
    { href: "/admin/intelligence/catalogues", label: "Catalogues des agences", icon: "gauge", child: true, group: "intel" },
    { href: "/admin/intelligence/chiffres-publies", label: "Chiffres publiés", icon: "gauge", child: true, group: "intel" },
    { href: "/admin/statistiques", label: "Statistiques", icon: "gauge", group: "stats" },
    { href: "/admin/statistiques/recherches", label: "Recherches", icon: "gauge", child: true, group: "stats" },
    { href: "/admin/statistiques/professionnels", label: "Professionnels", icon: "gauge", child: true, group: "stats" },
    { href: "/admin/statistiques/prix", label: "Indice des prix", icon: "gauge", child: true, group: "stats" },
    // Utilisateurs (façon WordPress) : comptes, fiche 360°, rôles, journal.
    { href: "/admin/utilisateurs", label: "Utilisateurs", icon: "users", group: "utilisateurs" },
    { href: "/admin/utilisateurs/suppressions", label: "Demandes de suppression", icon: "users", child: true, group: "utilisateurs" },
    { href: "/admin/utilisateurs/diagnostic", label: "Diagnostic de connexion", icon: "users", child: true, group: "utilisateurs" },
    { href: "/admin/administrateurs", label: "Administrateurs", icon: "users", child: true, group: "utilisateurs" },
    { href: "/admin/roles", label: "Rôles et permissions", icon: "key", child: true, group: "utilisateurs" },
    { href: "/admin/journal", label: "Journal d’activité", icon: "history", child: true, group: "utilisateurs" },
    // Modération (façon Airbnb / Zillow) : annonces à valider, signalements.
    { href: "/admin/moderation", label: "Modération", icon: "flag", group: "moderation", badge: (mod?.pending ?? 0) + (mod?.reports ?? 0) },
    { href: "/admin/moderation?tab=reports", label: "Signalements", icon: "flag", child: true, group: "moderation", badge: mod?.reports ?? 0 },
    { href: "/admin/moderation/anti-fraude", label: "Anti-fraude", icon: "flag", child: true, group: "moderation" },
    { href: "/admin/moderation/reglages", label: "Réglages", icon: "flag", child: true, group: "moderation" },
    // Apparence : constructeur de la page d'accueil, menu et pied de page.
    { href: "/admin/accueil", label: "Page d’accueil", icon: "layout", group: "apparence" },
    { href: "/admin/accueil/menu", label: "Menus et pied de page", icon: "layout", child: true, group: "apparence" },
    { href: "/admin/accueil/resultats", label: "Affichage des résultats", icon: "layout", child: true, group: "apparence" },
    { href: "/admin/pages-site", label: "Pages du site", icon: "layout", child: true, group: "apparence" },
    { href: "/admin/pages-site#nouvelle", label: "Créer une page", icon: "layout", child: true, group: "apparence" },
    // Centre d'aide (moboo.ci/aide) : guides et questions fréquentes par public.
    // Espace « Moboo.ci pour les professionnels » (façon Zillow Partners).
    { href: "/admin/professionnels", label: "Espace professionnels", icon: "megaphone", group: "pros" },
    { href: "/admin/professionnels/demandes", label: "Demandes de rappel", icon: "megaphone", child: true, group: "pros" },
    { href: "/admin/aide", label: "Centre d’aide", icon: "search", group: "aide" },
    { href: "/admin/aide/nouveau", label: "Nouvel article", icon: "search", child: true, group: "aide" },
    // Pages SEO (façon Yoast) : pages d'atterrissage + SEO des pages du site.
    { href: "/admin/seo", label: "Pages SEO", icon: "search", group: "seo" },
    { href: "/admin/seo/nouvelle", label: "Nouvelle page SEO", icon: "search", child: true, group: "seo" },
    { href: "/admin/seo/nouvelle?type=page", label: "SEO d’une page du site", icon: "search", child: true, group: "seo" },
    { href: "/admin/seo/generateur", label: "Générateur SEO", icon: "search", child: true, group: "seo" },
    { href: "/admin/seo/qualite", label: "Qualité des pages", icon: "search", child: true, group: "seo" },
    { href: "/admin/seo/textes", label: "Textes du bas de page", icon: "search", child: true, group: "seo" },
    { href: "/admin/seo/quartiers", label: "Guides de quartier", icon: "search", child: true, group: "seo" },
    { href: "/admin/seo/console", label: "Search Console", icon: "search", child: true, group: "seo" },
    { href: "/admin/seo/backlinks", label: "Backlinks", icon: "search", child: true, group: "seo" },
    { href: "/admin/seo/tiktok", label: "Vidéos TikTok", icon: "search", child: true, group: "seo" },
    { href: "/admin/seo/redirections", label: "Redirections et 404", icon: "search", child: true, group: "seo" },
    // Marketing : bannières, flyers et pop-ups (application mobile + site).
    { href: "/admin/marketing", label: "Marketing", icon: "megaphone", group: "marketing" },
    { href: "/admin/marketing/nouvelle", label: "Nouvelle campagne", icon: "megaphone", child: true, group: "marketing" },
    // Documents imprimables : livres blancs, ebooks, magazines de quartier (export PDF).
    { href: "/admin/documents", label: "Documents imprimables", icon: "layout", group: "documents" },
    { href: "/admin/documents/nouveau", label: "Nouveau document", icon: "layout", child: true, group: "documents" },
    { href: "/admin/fiches", label: "Fiches d’annonces (A4, A3…)", icon: "layout", child: true, group: "documents" },
    // Marketing terrain : affiches QR à poser (agents, agences, annonces, pages SEO) et comptage des scans.
    { href: "/admin/affiches-qr", label: "Marketing terrain", icon: "megaphone", group: "terrain" },
    { href: "/admin/affiches-qr", label: "Affiches QR (agents, annonces)", icon: "megaphone", child: true, group: "terrain" },
    { href: "/admin/affiches-qr/seo", label: "QR pages SEO", icon: "megaphone", child: true, group: "terrain" },
    { href: "/admin/affiches-qr/scans", label: "Scans QR", icon: "megaphone", child: true, group: "terrain" },
    { href: "/admin/affiches-qr/modele", label: "Modèle des affiches SEO", icon: "megaphone", child: true, group: "terrain" },
    { href: "/admin/centre-marketing", label: "Centre marketing", icon: "megaphone", group: "centre" },
    { href: "/admin/centre-marketing/reservations", label: "Réservations déclarées", icon: "megaphone", child: true, group: "centre" },
    { href: "/admin/centre-marketing/promotions", label: "Promotions", icon: "megaphone", child: true, group: "centre" },
    { href: "/admin/centre-marketing/campagnes", label: "Campagnes ciblées", icon: "megaphone", child: true, group: "centre" },
    { href: "/admin/centre-marketing/informations", label: "Informations ciblées", icon: "megaphone", child: true, group: "centre" },
    { href: "/admin/centre-marketing/relances", label: "Relance des agents", icon: "megaphone", child: true, group: "centre" },
    { href: "/admin/centre-marketing/parcours", label: "Parcours de conversion", icon: "megaphone", child: true, group: "centre" },
    { href: "/admin/centre-marketing/messages-voyageur", label: "Messages au voyageur", icon: "megaphone", child: true, group: "centre" },
    { href: "/admin/centre-marketing/pixels", label: "Pixels et mesure", icon: "megaphone", child: true, group: "centre" },
    { href: "/admin/centre-marketing/canaux", label: "Canaux d’envoi (SMS, WhatsApp)", icon: "megaphone", child: true, group: "centre" },
    { href: "/admin/centre-marketing/reglages", label: "Réglages", icon: "megaphone", child: true, group: "centre" },
    { href: "/admin/publicite", label: "Publicité (annonceurs)", icon: "megaphone", group: "publicite" },
    { href: "/admin/publicite/tarifs", label: "Tarifs", icon: "megaphone", child: true, group: "publicite" },
    { href: "/admin/publicite/services", label: "Services (déménageurs, nettoyage…)", icon: "megaphone", child: true, group: "publicite" },
    { href: "/admin/publicite/bourse", label: "Bourse des demandes", icon: "megaphone", child: true, group: "publicite" },
    { href: "/admin/publicite/programmes", label: "Programmes neufs (promoteurs)", icon: "megaphone", child: true, group: "publicite" },
    { href: "/admin/publicite/confiance", label: "Biens vérifiés & diaspora", icon: "megaphone", child: true, group: "publicite" },
    // Immobilier (façon Houzez « Real Estate ») : annonces, listes, agences et agents.
    { href: "/admin/immobilier", label: "Immobilier", icon: "building", group: "immobilier" },
    ...[
      ["/admin/immobilier/nouvelle", "Nouvelle annonce"],
      ["/admin/immobilier/courte-duree", "Courte durée à classer"],
      ["/admin/immobilier/proprietaires", "Propriétaires des résidences et espaces"],
      ["/admin/immobilier/listes/type", "Types de bien"],
      ["/admin/immobilier/listes/status", "Statuts"],
      ["/admin/immobilier/listes/feature", "Équipements"],
      ["/admin/immobilier/listes/label", "Étiquettes"],
      ["/admin/immobilier/listes/city", "Villes"],
      ["/admin/immobilier/listes/area", "Quartiers et communes"],
      ["/admin/immobilier/equipe/agences", "Agences"],
      ["/admin/immobilier/equipe/agents", "Agents"],
      ["/admin/immobilier/partenaires", "Partenaires"],
      ["/admin/immobilier/api-partenaires", "API partenaires"],
      ["/admin/immobilier/avis", "Avis"],
      ["/admin/immobilier/pages-pros", "Pages des pros (vidéos, photos)"],
      ["/admin/immobilier/forfaits", "Forfaits"],
      ["/admin/immobilier/factures", "Factures"],
    ].map(([href, label]) => ({ href, label, icon: "building", child: true, group: "immobilier" })),
    // Account managers (façon Booking.com) : réservations à confirmer pour l'hôte, portefeuille, suivi.
    { href: "/admin/comptes", label: "Suivi des comptes", icon: "users", group: "comptes", badge: am?.urgent ?? 0 },
    { href: "/admin/comptes/appels", label: "Appels du jour", icon: "users", child: true, group: "comptes" },
    { href: "/admin/comptes/reservations", label: "Réservations à confirmer", icon: "users", child: true, group: "comptes", badge: am?.pending ?? 0 },
    { href: "/admin/comptes/sejours", label: "Séjours en cours", icon: "users", child: true, group: "comptes" },
    { href: "/admin/comptes/portefeuille", label: "Portefeuille", icon: "users", child: true, group: "comptes" },
    { href: "/admin/comptes/parcours", label: "Parcours de démarrage", icon: "users", child: true, group: "comptes" },
    { href: "/admin/comptes/studio", label: "Studio de publication", icon: "users", child: true, group: "comptes" },
    { href: "/admin/comptes/liens-rapides", label: "Liens rapides", icon: "users", child: true, group: "comptes" },
    { href: "/admin/comptes/opportunites", label: "Centre des opportunités", icon: "users", child: true, group: "comptes" },
    { href: "/admin/comptes/support", label: "Support de mes clients", icon: "users", child: true, group: "comptes" },
    { href: "/admin/comptes/academie", label: "Académie (messages)", icon: "users", child: true, group: "comptes" },
    { href: "/admin/comptes/guide", label: "Guide de l’account manager", icon: "users", child: true, group: "comptes" },
    { href: "/admin/comptes/taches", label: "Tâches", icon: "users", child: true, group: "comptes" },
    { href: "/admin/comptes/equipes", label: "Équipes et zones", icon: "users", child: true, group: "comptes" },
    { href: "/admin/comptes/performance", label: "Objectifs et performance", icon: "users", child: true, group: "comptes" },
    { href: "/admin/comptes/journal", label: "Mes actions (journal)", icon: "users", child: true, group: "comptes" },
    { href: "/admin/comptes/reglages", label: "Réglages", icon: "users", child: true, group: "comptes" },
    // Formulaires : champs de publication et onglets de l'espace membre.
    { href: "/admin/formulaires", label: "Formulaires", icon: "layout", group: "formulaires" },
    { href: "/admin/formulaires", label: "Publication d’annonce", icon: "layout", child: true, group: "formulaires" },
    { href: "/admin/formulaires/espace-membre", label: "Espace membre", icon: "layout", child: true, group: "formulaires" },
    // Réservations faites sur Moboo.ci et litiges (médiation, gel du reversement).
    { href: "/admin/reservations", label: "Réservations", icon: "calendar", group: "reservations", badge: disputes?.open ?? 0 },
    { href: "/admin/litiges", label: "Litiges", icon: "scale", child: true, group: "reservations", badge: disputes?.open ?? 0 },
    { href: "/admin/litiges/reglages", label: "Réglages", icon: "scale", child: true, group: "reservations" },
    // Séjours : visites « Vérifié sur place » (badge + confort réel) et kits Google Business.
    { href: "/admin/sejours/visites", label: "Vérifié sur place", icon: "scale", child: true, group: "reservations" },
    { href: "/admin/sejours/kits-google", label: "Kits Google", icon: "scale", child: true, group: "reservations" },
    { href: "/admin/sejours/assistant", label: "Assistant WhatsApp", icon: "scale", child: true, group: "reservations" },
    { href: "/admin/sejours/marche", label: "Prix du marché", icon: "scale", child: true, group: "reservations" },
    { href: "/admin/sejours/evenements", label: "Événements", icon: "scale", child: true, group: "reservations" },
    // Services Moboo (ex-extensions WordPress des applications).
    { href: "/admin/services", label: "Services Moboo", icon: "phone", group: "services", badge: svc.edl + svc.leads + svc.missions },
    ...[
      ["/admin/services/alertes", "Alertes", 0],
      ["/admin/services/missions", "Missions (Moboo Pro)", svc.missions],
      ["/admin/services/etats-des-lieux", "États des lieux", svc.edl],
      ["/admin/services/demandes", "Demandes du site", svc.leads],
      ["/admin/services/solvabilite", "Solvabilité locataire"],
      ["/admin/services/support", "Support"],
      ["/admin/services/estimations", "Estimations foncier / loyer"],
      ["/admin/services/cartes", "Cartes pro"],
      ["/admin/services/application", "Configuration des applications"],
      ["/admin/services/reglages", "Réglages"],
    ].map(([href, label, badge]) => ({ href: String(href), label: String(label), icon: "phone", child: true, group: "services", badge: Number(badge) || 0 })),
    // Vérification des comptes (demandes + réglages).
    { href: "/admin/verifications", label: "Vérification des comptes", icon: "shield", group: "verifications" },
    { href: "/admin/verifications/reglages", label: "Réglages", icon: "shield", child: true, group: "verifications" },
    // Moboo Pro : ce que géraient les extensions WordPress de l'application pro.
    // Placé avant « Application mobile » : ses pages /admin/application/*-pro ouvrent ce groupe.
    { href: "/admin/moboo-pro", label: "Moboo Pro", icon: "phone", group: "moboo-pro" },
    ...[
      ["/admin/moboo-pro", "Agences et liens"],
      ["/admin/moboo-pro/comptes", "Comptes"],
      ["/admin/moboo-pro/notifications", "Notifications"],
      ["/admin/moboo-pro/demandes-gestion", "Confier ma gestion"],
      ["/admin/moboo-pro/departs", "Départs signalés"],
      ["/admin/services/support?app=moboo_pro", "Support"],
      ["/admin/services/application", "Fonctions de l’application"],
      ["/admin/application/bascule-pro", "Bascule vers Render"],
      ["/admin/application/forfaits-pro", "Forfaits"],
      ["/admin/application/annonces-pro", "Annonces de l’application"],
    ].map(([href, label]) => ({ href, label, icon: "phone", child: true, group: "moboo-pro" })),
    // Application mobile Moboo.ci : statistiques, passerelle Houzi, push, contacts.
    { href: "/admin/application", label: "Application mobile", icon: "phone", group: "application" },
    ...[
      ["/admin/application/builder", "Builder de l’application"],
      ["/admin/application/reglages", "Réglages"],
      ["/admin/application/passerelle", "Passerelle Houzi"],
      ["/admin/application/push", "Notifications push"],
      ["/admin/application/videos", "Vidéos des annonces"],
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
    { href: "/admin/fonctionnalites", label: "Activation progressive", icon: "gauge" },
    { href: "/admin/sante", label: "Santé du site", icon: "gauge", group: "sante" },
    { href: "/admin/sante/taches", label: "Tâches en arrière-plan", icon: "gauge", child: true, group: "sante" },
    { href: "/admin/migration", label: "Migration WordPress", icon: "history" },
    { href: "/admin/securite", label: "Ma sécurité (2FA)", icon: "shield" },
  ];
  // Menu limité aux rubriques du rôle ; une adresse ouverte directement sans droit affiche « Accès refusé ».
  const visible = items.filter((it) => canAccess(perms, it.href));
  const allowed = canAccess(perms, path);

  return (
    <div className="bg-slate-100">
      <div className="mx-auto flex min-h-[calc(100dvh-4rem)] max-w-[1600px] flex-col lg:flex-row">
        <aside className="shrink-0 bg-[#1f2327] lg:w-64 print:hidden">
          <div className="hidden items-baseline gap-2 px-4 py-4 lg:flex">
            <span className="font-display text-lg font-black text-white">Moboo</span>
            <span className="text-xs font-semibold text-slate-400">Back-office</span>
          </div>
          <div className="px-4 pb-3 lg:pt-1"><SoundAlerts compact /></div>
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
