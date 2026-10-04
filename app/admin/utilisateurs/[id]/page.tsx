import Link from "next/link";
import { notFound } from "next/navigation";
import { authedFetch } from "@/lib/server-api";
import type { SiteAccount } from "@/lib/api";
import { formatXOF } from "@/lib/api";
import { can } from "@/lib/admin-perms";
import { getUser } from "../../backoffice-actions";
import { Avatar, Card, Pill, TYPE_LABEL, ago, fmtDate, fmtDateTime } from "@/components/backoffice/ui";
import { UserActions, SessionRevoke } from "@/components/backoffice/user-actions";
import { NotesPanel } from "@/components/backoffice/notes-panel";
import { UserDeletionActions } from "@/components/backoffice/deletion-actions";
import { AuditList } from "@/components/backoffice/audit-list";

const METHOD: Record<string, string> = {
  phone: "Code par téléphone", password: "Mot de passe", google: "Google",
  "2fa:totp": "2FA (application)", "2fa:email": "2FA (e-mail)", "2fa:backup": "2FA (code de secours)",
};

/** Back-office → Utilisateurs → fiche 360° (façon Airbnb « User profile » interne). */
export default async function AdminUserPage({ params }: { params: { id: string } }) {
  const [d, meRes] = await Promise.all([getUser(params.id), authedFetch("/site/auth/me", { method: "GET" })]);
  if (!d) notFound();
  const me = meRes.data as SiteAccount;
  const a = d.account;
  const s = d.stats;
  const canManage = can(me?.permissions, "users.manage");
  const listingsTotal = Object.values(s.listings as Record<string, number>).reduce((x, y) => x + y, 0);
  const kpis: [string, string | number][] = [
    ["Annonces", listingsTotal], ["Vues", s.views], ["Appels + WhatsApp", s.calls + s.whatsapp], ["Demandes (30 j)", s.inquiries30],
    ["Conversations", s.conversations], ["Favoris", s.favorites], ["Payé au total", formatXOF(s.paidTotal)],
    ["Note reçue", s.rating ? `${s.rating} ★ (${s.ratingCount})` : "—"],
  ];

  return (
    <div className="space-y-4">
      <Link href="/admin/utilisateurs" className="text-sm font-semibold text-brand-800 hover:underline">← Utilisateurs</Link>

      {/* En-tête */}
      <div className="flex flex-wrap items-start gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
        <Avatar name={a.name || a.phone} url={a.avatarUrl} size={64} />
        <div className="min-w-0 flex-1">
          <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl font-extrabold text-ink">
            {a.name || a.phone}
            {a.verified ? <span className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-bold text-sky-700 ring-1 ring-sky-200">✔ Identité vérifiée</span> : null}{a.businessVerified ? <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-800 ring-1 ring-violet-200">✔ Pro vérifié</span> : null}
            <Pill s={a.accountStatus} />
            {a.role ? <span className="rounded bg-ink px-2 py-0.5 text-xs font-bold text-white">{a.role.name}</span> : null}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {TYPE_LABEL[a.accountType] ?? a.accountType}{a.companyName ? ` · ${a.companyName}` : ""} · n° {a.appId}
            {a.username ? <> · <Link href={`/pro/${a.username}`} className="text-brand-800 hover:underline" target="_blank">@{a.username}</Link></> : null}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            <a href={`tel:${a.phone}`} className="hover:underline">{a.phone}</a>
            {a.email ? <> · <a href={`mailto:${a.email}`} className="hover:underline">{a.email}</a></> : null}
            {a.whatsapp ? <> · <a href={`https://wa.me/${String(a.whatsapp).replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener" className="hover:underline">WhatsApp</a></> : null}
            {[a.commune, a.city].filter(Boolean).length ? <> · {[a.commune, a.city].filter(Boolean).join(", ")}</> : null}
          </p>
          {a.accountStatus === "deleting" ? (
            <div className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-900 ring-1 ring-rose-200">
              Suppression demandée par l’utilisateur le {fmtDateTime(a.statusChangedAt)} — définitive le <strong>{fmtDate(a.deletionScheduledAt)}</strong>.
              {canManage ? <UserDeletionActions id={a.id} canPurge={can(me?.permissions, "roles")} /> : null}
            </div>
          ) : a.accountStatus === "deleted" ? (
            <p className="mt-2 rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-700">Compte supprimé le {fmtDateTime(a.statusChangedAt)} : les données personnelles ont été effacées.</p>
          ) : a.accountStatus !== "active" ? (
            <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200">
              {a.accountStatus === "banned" ? "Banni" : "Suspendu"} le {fmtDateTime(a.statusChangedAt)}{a.statusChangedBy ? ` par ${a.statusChangedBy}` : ""}
              {a.suspendedUntil ? ` · jusqu’au ${fmtDateTime(a.suspendedUntil)}` : ""}
              {a.statusReason ? <> — <strong>{a.statusReason}</strong></> : null}
            </p>
          ) : null}
        </div>
        <div className="text-right text-xs text-muted">
          <p>Inscrit le {fmtDate(a.createdAt)}</p>
          <p>Dernière connexion : {ago(a.lastLoginAt)}</p>
          <p>Connexion : {[a.hasPassword ? "mot de passe" : null, a.googleLinked ? "Google" : null, "téléphone"].filter(Boolean).join(", ")}</p>
          <p>2FA : {a.twoFactor ? "activée" : "non"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map(([l, v]) => (
          <div key={l} className="rounded-lg bg-white p-3 shadow-sm ring-1 ring-slate-200">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{l}</p>
            <p className="mt-0.5 font-display text-xl font-extrabold text-ink">{typeof v === "number" ? v.toLocaleString("fr-FR") : v}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-4">
          <Card title={`Annonces (${listingsTotal})`} action={<Link href={`/admin/immobilier?q=${encodeURIComponent(a.phone)}`} className="text-sm font-semibold text-brand-800 hover:underline">Tout voir</Link>}>
            {d.listings.length ? (
              <ul className="divide-y divide-slate-100">
                {d.listings.map((l: any) => (
                  <li key={l.id} className="flex items-center gap-3 py-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    {l.photo ? <img src={l.photo} alt="" className="h-12 w-16 shrink-0 rounded object-cover" /> : <span className="h-12 w-16 shrink-0 rounded bg-slate-100" />}
                    <div className="min-w-0 flex-1">
                      <Link href={`/admin/immobilier/${l.id}`} className="block truncate text-sm font-semibold text-ink hover:underline">{l.title}</Link>
                      <p className="text-xs text-muted">{formatXOF(l.price)}{l.priceUnit === "month" ? " / mois" : ""} · {[l.commune, l.city].filter(Boolean).join(", ")} · {l.views} vues · {fmtDate(l.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <Pill s={l.status} />
                      {l.moderation !== "approved" ? <Pill s={l.moderation} label={l.moderation === "suspended" ? "Masquée (compte)" : undefined} /> : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Aucune annonce.</p>}
          </Card>

          <Card title={`Signalements (${d.reports.length})`} action={d.reports.length ? <Link href="/admin/moderation?tab=reports" className="text-sm font-semibold text-brand-800 hover:underline">Modération</Link> : null}>
            {d.reports.length ? (
              <ul className="space-y-2 text-sm">
                {d.reports.map((r: any) => (
                  <li key={r.id} className="flex items-start justify-between gap-2">
                    <span><strong>{r.targetType === "account" ? "Compte" : "Annonce"}</strong> · {r.reason}{r.details ? ` — ${r.details}` : ""} <span className="text-xs text-muted">({fmtDate(r.createdAt)})</span></span>
                    <Pill s={r.status} />
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Aucun signalement contre ce compte ou ses annonces.</p>}
          </Card>

          <Card title="Paiements">
            {d.subscription ? (
              <p className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
                Forfait <strong>{d.subscription.packageName}</strong> jusqu’au {fmtDate(d.subscription.endsAt)} · {d.subscription.listings} annonces, {d.subscription.featuredUsed}/{d.subscription.featured} vedettes
              </p>
            ) : null}
            {d.invoices.length ? (
              <table className="w-full text-sm">
                <tbody className="divide-y divide-slate-100">
                  {d.invoices.map((i: any) => (
                    <tr key={i.id}>
                      <td className="py-1.5"><Link href={`/admin/immobilier/factures?q=${i.number}`} className="font-mono text-xs text-brand-800 hover:underline">{i.number}</Link></td>
                      <td className="py-1.5 text-slate-600">{i.label}</td>
                      <td className="py-1.5 text-right font-semibold">{formatXOF(i.amount)}</td>
                      <td className="py-1.5 pl-2 text-right"><Pill s={i.status === "paid" ? "resolved" : i.status === "pending" ? "open" : "dismissed"} label={i.status === "paid" ? "Payée" : i.status === "pending" ? "En attente" : i.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="text-sm text-muted">Aucune facture.</p>}
          </Card>

          <Card title="Historique (actions de l’équipe sur ce compte)">
            <AuditList items={d.activity} />
          </Card>
          {d.actions.length ? (
            <Card title="Actions de cet administrateur dans le back-office" action={<Link href={`/admin/journal?actor=${a.id}`} className="text-sm font-semibold text-brand-800 hover:underline">Journal complet</Link>}>
              <AuditList items={d.actions} showActor={false} />
            </Card>
          ) : null}
        </div>

        <div className="space-y-4">
          <Card title="Actions">
            <UserActions a={a} canManage={canManage} sessions={d.sessions.length} />
          </Card>
          <Card title="Notes internes">
            <NotesPanel type="account" id={a.id} initial={d.notes} meId={me?.id} />
          </Card>
          <Card title={`Appareils connectés (${d.sessions.length})`}>
            {d.sessions.length ? (
              <ul className="space-y-2 text-sm">
                {d.sessions.map((x: any) => (
                  <li key={x.id} className="flex items-center justify-between gap-2">
                    <span className="min-w-0"><span className="block truncate font-medium text-ink">{x.deviceName || (x.deviceId ? "Application / appareil" : "Navigateur")}</span><span className="text-xs text-muted">depuis le {fmtDate(x.createdAt)}</span></span>
                    {canManage ? <SessionRevoke accountId={a.id} sessionId={x.id} /> : null}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Aucune session ouverte.</p>}
          </Card>
          <Card title="Dernières connexions">
            {d.logins.length ? (
              <ul className="space-y-1.5 text-sm">
                {d.logins.map((x: any) => (
                  <li key={x.id} className="flex justify-between gap-2">
                    <span className="text-slate-700">{METHOD[x.method] ?? x.method}</span>
                    <span className="text-right text-xs text-muted">{fmtDateTime(x.createdAt)}{x.ip ? <><br />IP {x.ip}</> : null}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Aucune connexion enregistrée depuis la mise en place du suivi.</p>}
          </Card>
          <Card title="Vérification">
            {d.verifications.length ? (
              <ul className="space-y-1.5 text-sm">
                {d.verifications.map((v: any) => (
                  <li key={v.id} className="flex justify-between gap-2"><span>{v.docType} <span className="text-xs text-muted">({fmtDate(v.createdAt)})</span></span><Pill s={v.status === "approved" ? "resolved" : v.status === "rejected" ? "banned" : "open"} label={v.status === "approved" ? "Validée" : v.status === "rejected" ? "Refusée" : "En attente"} /></li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">Aucune demande de vérification.</p>}
          </Card>
          <Card title="Activité">
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <dt className="text-muted">Recherches sauvegardées</dt><dd className="text-right">{s.savedSearches}</dd>
              <dt className="text-muted">Avis écrits</dt><dd className="text-right">{s.reviewsWritten}</dd>
              <dt className="text-muted">Signalements envoyés</dt><dd className="text-right">{s.reportsFiled}</dd>
              <dt className="text-muted">Factures payées</dt><dd className="text-right">{s.paidCount}</dd>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
