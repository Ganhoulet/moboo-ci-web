import Link from "next/link";
import { authedFetch } from "@/lib/server-api";
import { displayName } from "@/lib/session";
import type { SiteAccount } from "@/lib/api";
import { can } from "@/lib/admin-perms";
import { teamGroupsFor } from "@/lib/team-space";
import { getAm } from "../comptes/actions";
import { listInvoices } from "../immobilier/actions";
import { listCampaigns } from "../marketing/actions";
import { listProLeads } from "../professionnels/demandes/actions";
import { getOverview } from "../statistiques/actions";
import { getModerationSummary } from "../backoffice-actions";
import { getDisputeCounts } from "../litiges/actions";
import { getServices } from "../services/actions";

export const metadata = { title: "Espace équipe" };
export const dynamic = "force-dynamic";

const hello = () => {
  const h = Number(new Date().toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "Africa/Abidjan" }));
  return h < 12 ? "Bonjour" : h < 18 ? "Bon après-midi" : "Bonsoir";
};
const n = (v: number | null | undefined) => (v ?? 0).toLocaleString("fr-FR");
const fcfa = (v: number | null | undefined) => `${(v ?? 0).toLocaleString("fr-FR")} F`;
const safe = <T,>(p: Promise<T>) => p.catch(() => null);

/** Une tuile du tableau de bord : un chiffre, ce qu'il veut dire, où aller. « todo » : à traiter (orange si > 0). */
interface Tile { label: string; value: string; href: string; todo?: number; hint?: string; change?: number | null }
interface Block { id: string; title: string; emoji: string; tiles: Tile[] }

function TileCard({ t }: { t: Tile }) {
  const hot = (t.todo ?? 0) > 0;
  return (
    <Link href={t.href} className={"block rounded-xl p-3.5 ring-1 transition hover:-translate-y-0.5 " + (hot ? "bg-amber-50 ring-amber-200 hover:ring-amber-400" : "bg-white ring-slate-200 hover:ring-brand-400")}>
      <span className={"block font-display text-2xl font-extrabold " + (hot ? "text-amber-800" : "text-ink")}>{t.value}</span>
      <span className="block text-sm font-semibold text-ink">{t.label}</span>
      {t.hint || t.change != null ? (
        <span className="mt-0.5 block text-xs text-muted">
          {t.change != null ? <span className={t.change >= 0 ? "font-semibold text-emerald-700" : "font-semibold text-red-700"}>{t.change >= 0 ? "▲" : "▼"} {Math.abs(Math.round(t.change))} % </span> : null}
          {t.hint}
        </span>
      ) : null}
    </Link>
  );
}

/** Accueil de l'Espace équipe : le tableau de bord de son métier, puis ses rubriques. */
export default async function TeamHome() {
  const me = await authedFetch("/site/auth/me", { method: "GET" });
  const account = me.data as SiteAccount;
  const perms = account?.permissions ?? [];
  const groups = teamGroupsFor({ perms });
  const first = (displayName(account) || "").split(" ")[0];

  // Données de chaque métier (seulement celles du rôle ; une source en panne n'empêche pas les autres).
  const [am, amSupport, invoices, campaigns, leads, stats, mod, disputes, help] = await Promise.all([
    can(perms, "accounts") ? safe(getAm<any>("/overview")) : null,
    can(perms, "am.support") ? safe(getAm<{ unread: number }>("/support?status=ouvert")) : null,
    can(perms, "billing") ? safe(listInvoices({ status: "pending" })) : null,
    can(perms, "marketing") ? safe(listCampaigns()) : null,
    can(perms, "marketing") ? safe(listProLeads("new")) : null,
    can(perms, "analytics") ? safe(getOverview("7")) : null,
    can(perms, "moderation") ? safe(getModerationSummary()) : null,
    can(perms, "disputes") ? safe(getDisputeCounts()) : null,
    can(perms, "services") ? safe(getServices<{ unread: number }>("/support?status=ouvert")) : null,
  ]);

  const blocks: Block[] = [];
  if (am) {
    const portfolio = Object.values((am.portfolio ?? {}) as Record<string, number>).reduce((s, v) => s + (Number(v) || 0), 0);
    blocks.push({ id: "comptes", title: "Mes comptes", emoji: "💼", tiles: [
      ...(am.canBookings !== false ? [
        { label: "À appeler maintenant", value: n(am.urgent?.length), todo: am.urgent?.length ?? 0, href: "/equipe/comptes", hint: "Hôtes sans réponse" },
        { label: "Réservations en attente", value: n(am.pendingCount), todo: am.pendingCount ?? 0, href: "/equipe/comptes/reservations" },
      ] : []),
      { label: "Rappels du jour", value: n(am.tasksDue?.length), todo: am.tasksDue?.length ?? 0, href: "/equipe/comptes/taches", hint: am.tasksLater ? `+${am.tasksLater} à venir` : undefined },
      ...(amSupport ? [{ label: "Support à traiter", value: n(amSupport.unread), todo: amSupport.unread, href: "/equipe/comptes/support" }] : []),
      { label: "Comptes suivis", value: n(portfolio), href: "/equipe/comptes/portefeuille" },
    ] });
  }
  if (invoices) {
    const c = invoices.counts ?? {};
    blocks.push({ id: "compta", title: "Comptabilité", emoji: "🧾", tiles: [
      { label: "Factures en attente", value: n(c.pending), todo: c.pending ?? 0, href: "/equipe/immobilier/factures?status=pending" },
      { label: "Factures payées", value: n(c.paid), href: "/equipe/immobilier/factures?status=paid" },
      { label: "Encaissé", value: fcfa(invoices.revenue), href: "/equipe/immobilier/factures", hint: "Total des factures payées" },
    ] });
  }
  if (campaigns || leads) {
    const live = (campaigns ?? []).filter((c) => c.active);
    const views = live.reduce((s, c) => s + (c.views ?? 0), 0);
    const clicks = live.reduce((s, c) => s + (c.clicks ?? 0), 0);
    blocks.push({ id: "marketing", title: "Marketing", emoji: "📣", tiles: [
      { label: "Campagnes en cours", value: n(live.length), href: "/equipe/marketing" },
      { label: "Vues des campagnes", value: n(views), href: "/equipe/marketing", hint: views ? `${((clicks / views) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % de clics` : undefined },
      ...(leads ? [{ label: "Demandes de rappel", value: n(leads.counts?.new), todo: leads.counts?.new ?? 0, href: "/equipe/professionnels/demandes?status=new", hint: "Nouvelles, à rappeler" }] : []),
    ] });
  }
  if (stats) {
    const k = stats.kpis;
    blocks.push({ id: "donnees", title: "Données (7 derniers jours)", emoji: "📊", tiles: [
      { label: "Nouveaux comptes", value: n(k.accounts.value), change: k.accounts.change, href: "/equipe/statistiques?range=7" },
      { label: "Vues des annonces", value: n(k.views.value), change: k.views.change, href: "/equipe/statistiques?range=7" },
      { label: "Contacts", value: n(k.contacts.value), change: k.contacts.change, href: "/equipe/statistiques?range=7", hint: `${n(k.contacts.calls)} appels · ${n(k.contacts.whatsapp)} WhatsApp` },
      { label: "Recherches sans résultat", value: `${(k.searches?.zeroRate ?? 0).toLocaleString("fr-FR")} %`, href: "/equipe/statistiques/recherches?range=7" },
    ] });
  }
  if (mod) {
    blocks.push({ id: "moderation", title: "Modération", emoji: "🛡️", tiles: [
      { label: "Annonces à valider", value: n(mod.pending), todo: mod.pending, href: "/equipe/moderation" },
      { label: "Modifications à revoir", value: n(mod.changes), todo: mod.changes, href: "/equipe/moderation" },
      { label: "Signalements", value: n(mod.reports), todo: mod.reports, href: "/equipe/moderation?tab=reports" },
    ] });
  }
  if (disputes || help) {
    blocks.push({ id: "support", title: "Support client", emoji: "🎧", tiles: [
      ...(help ? [{ label: "Demandes d’aide à lire", value: n(help.unread), todo: help.unread, href: "/equipe/services/support" }] : []),
      ...(disputes ? [
        { label: "Litiges ouverts", value: n(disputes.open), todo: disputes.open, href: "/equipe/litiges" },
        { label: "Litiges en retard", value: n(disputes.overdue), todo: disputes.overdue, href: "/equipe/litiges", hint: "Délai de réponse dépassé" },
      ] : []),
    ] });
  }
  const todo = blocks.flatMap((b) => b.tiles).reduce((s, t) => s + (t.todo ?? 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{hello()}{first ? ` ${first}` : ""} 👋</h1>
        <p className="text-sm text-muted">
          {account?.adminRole ? `${account.adminRole.name} · ` : ""}
          {blocks.length ? (todo ? `${n(todo)} élément(s) vous attendent aujourd’hui.` : "Rien d’urgent pour l’instant : beau travail !") : "Votre espace de travail Moboo."}
        </p>
      </div>

      {blocks.map((b) => (
        <section key={b.id}>
          <h2 className="mb-2 flex items-center gap-2 font-display text-base font-bold text-ink"><span aria-hidden>{b.emoji}</span>{b.title}</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">{b.tiles.map((t) => <TileCard key={t.label} t={t} />)}</div>
        </section>
      ))}

      <section>
        <h2 className="mb-2 font-display text-base font-bold text-ink">Vos rubriques</h2>
        {groups.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {groups.map((g) => (
              <Link key={g.id} href={g.tabs[0].href} className="rounded-xl bg-white p-4 ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:ring-brand-400">
                <span className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-lg" aria-hidden>{g.emoji}</span>
                  <span className="font-display font-bold text-ink">{g.label}</span>
                </span>
                <span className="mt-1.5 block text-sm text-muted">{g.desc}</span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="rounded-lg bg-white p-6 text-sm text-muted ring-1 ring-slate-200">Votre rôle ne donne encore accès à aucune rubrique. Demandez à un administrateur de compléter vos permissions.</p>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/mon-espace/profil" className="rounded-xl bg-white p-4 text-sm ring-1 ring-slate-200 hover:ring-brand-400"><b className="text-ink">👤 Mon profil</b><br /><span className="text-muted">Photo, coordonnées et présentation visibles par les clients.</span></Link>
        <Link href="/admin/securite" className="rounded-xl bg-white p-4 text-sm ring-1 ring-slate-200 hover:ring-brand-400"><b className="text-ink">🔐 Ma sécurité</b><br /><span className="text-muted">Double authentification de votre accès.</span></Link>
      </div>
    </div>
  );
}
