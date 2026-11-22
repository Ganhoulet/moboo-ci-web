import Link from "next/link";
import { getProAgency } from "../../actions";
import { CopyLink } from "../../copy-link";
import { ago, fmtDate, Pill, Section, Stat } from "../../ui";

export const dynamic = "force-dynamic";

const ROLE: Record<string, string> = { houzez_agency: "Agence", houzez_agent: "Agent", apporteur_affaires: "Apporteur", administrator: "Administrateur WordPress", houzez_owner: "Propriétaire", moboo_tenant: "Locataire" };
const INVITE: Record<string, string> = { locataire: "Locataire", proprietaire: "Propriétaire", rattachement: "Rattachement" };
const STATUT: Record<string, string> = { nouvelle: "Nouvelle", en_cours: "En cours", satisfaite: "Satisfaite", annulee: "Annulée", nouveau: "Nouveau", en_traitement: "En traitement", accepte: "Accepté", refuse: "Refusé" };
const statut = (s: string) => STATUT[s] ?? s.replace(/_/g, " ");
const money = (n: number | null) => (n ? `${Math.round(n).toLocaleString("fr-FR")} FCFA` : "—");

export default async function ProAgence({ params }: { params: { orgId: string } }) {
  const d = await getProAgency(params.orgId);
  if (!d) return <p className="text-muted">Agence introuvable ou accès refusé (droit « Application » requis).</p>;
  const pending = d.invitations.filter((i) => i.status === "en_attente");
  const onRender = d.bascule.filter((b) => b.render).length;
  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/moboo-pro" className="text-sm font-semibold text-brand-800 hover:underline">← Agences et liens</Link>
        <h1 className="mt-1 font-display text-2xl font-extrabold text-ink">{d.org.name}</h1>
        <p className="text-sm text-muted">
          {[d.org.city, d.org.email, d.org.phone].filter(Boolean).join(" · ") || "Coordonnées non renseignées"} · compte créé le {fmtDate(d.org.createdAt)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label="Agents" value={d.members.length} />
        <Stat label="Liens publics" value={d.links.length} />
        <Stat label="Demandes" value={d.demandes.total} />
        <Stat label="Mandats web" value={d.mandats.length} />
        <Stat label="Sur Render" value={`${onRender} / ${d.bascule.length}`} hint="domaines" />
      </div>

      <Section title="Agents et comptes" hint="Membres de l’agence sur Render, avec leur compte Moboo Pro (WordPress repris).">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-slate-200 text-left"><tr><th className="px-4 py-2">Nom</th><th className="px-4 py-2">Contact</th><th className="px-4 py-2">Rôle</th><th className="px-4 py-2">Forfait</th><th className="px-4 py-2">Adresse Moboo</th><th className="px-4 py-2">Appli</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {d.members.map((m) => (
                <tr key={m.userId}>
                  <td className="px-4 py-2.5">
                    <span className="font-semibold text-ink">{m.name}</span>
                    {m.login ? <span className="block text-xs text-muted">identifiant {m.login}{m.wpId ? ` · n° ${m.wpId}` : ""}</span> : null}
                  </td>
                  <td className="px-4 py-2.5 text-xs">{m.email ?? "—"}<span className="block text-muted">{m.phone ?? ""}</span></td>
                  <td className="px-4 py-2.5">
                    <span className="flex flex-wrap gap-1">
                      {m.wpRoles.map((r) => <Pill key={r} tone={r === "administrator" ? "blue" : "slate"}>{ROLE[r] ?? r}</Pill>)}
                      {m.teamRole ? <Pill tone="slate">équipe : {m.teamRole}</Pill> : null}
                      {m.suspended ? <Pill tone="red">Suspendu</Pill> : null}
                      {!m.active ? <Pill tone="red">Retiré</Pill> : null}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs">{m.plan ?? "—"}{m.planExpires ? <span className="block text-muted">jusqu’au {fmtDate(m.planExpires)}</span> : null}</td>
                  <td className="px-4 py-2.5 text-xs">{m.accountCode ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-muted">{ago(m.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Liens publics" hint="Formulaires servis par pro.moboo.ci. Les anciens liens moboo.ci/demande?ag=… restent valables (même jeton).">
        {d.links.length ? (
          <ul className="divide-y divide-slate-100">
            {d.links.map((l) => (
              <li key={l.token} className="space-y-2 px-4 py-3">
                <p className="text-sm"><span className="font-semibold text-ink">{l.owner}</span> <span className="text-xs text-muted">· créé le {fmtDate(l.createdAt)}</span></p>
                <CopyLink label="Demande" href={l.demande} />
                <CopyLink label="Confier mon bien" href={l.mandat} />
                <details className="text-sm">
                  <summary className="cursor-pointer text-xs font-semibold text-brand-800">Autres formulaires ({l.objectifs.length - 1})</summary>
                  <div className="mt-2 space-y-2">
                    {l.objectifs.filter((o) => o.key !== "demande").map((o) => <CopyLink key={o.key} label={o.label} href={o.link} />)}
                  </div>
                </details>
              </li>
            ))}
          </ul>
        ) : <p className="p-6 text-center text-sm text-muted">Aucun lien : il sera créé à la première ouverture de « Mes liens » dans l’application.</p>}
      </Section>

      <Section title="Invitations" hint="Locataires, propriétaires et rattachements envoyés depuis l’application (100 dernières)." right={pending.length ? <Pill tone="amber">{pending.length} en attente</Pill> : undefined}>
        {d.invitations.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="border-b border-slate-200 text-left"><tr><th className="px-4 py-2">Personne</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Envoyée par</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">État</th><th className="px-4 py-2">Lien</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {d.invitations.map((i) => (
                  <tr key={i.id}>
                    <td className="px-4 py-2.5"><span className="font-semibold text-ink">{i.name}</span><span className="block text-xs text-muted">{[i.contact, i.bien].filter(Boolean).join(" · ")}</span></td>
                    <td className="px-4 py-2.5">{INVITE[i.type] ?? i.type}</td>
                    <td className="px-4 py-2.5 text-xs">{i.by ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-muted">{fmtDate(i.createdAt)}</td>
                    <td className="px-4 py-2.5">{i.status === "acceptee" ? <Pill tone="green">Acceptée {fmtDate(i.usedAt)}</Pill> : <Pill tone="amber">En attente</Pill>}</td>
                    <td className="max-w-[22rem] px-4 py-2.5">{i.link ? <CopyLink href={i.link} /> : <span className="text-xs text-muted">—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="p-6 text-center text-sm text-muted">Aucune invitation envoyée depuis Render.</p>}
      </Section>

      <Section
        title="Demandes reçues"
        hint="50 dernières demandes venues des formulaires publics ou saisies dans l’application."
        right={<span className="flex flex-wrap gap-1">{d.demandes.byObjectif.map((o) => <Pill key={o.objectif} tone="slate">{o.label} : {o.total}</Pill>)}</span>}
      >
        {d.demandes.latest.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-sm">
              <thead className="border-b border-slate-200 text-left"><tr><th className="px-4 py-2">Client</th><th className="px-4 py-2">Demande</th><th className="px-4 py-2">Lieu</th><th className="px-4 py-2">Budget</th><th className="px-4 py-2">Statut</th><th className="px-4 py-2">Date</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {d.demandes.latest.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5"><span className="font-semibold text-ink">{r.client}</span><span className="block text-xs text-muted">{[r.contact, r.email].filter(Boolean).join(" · ")}</span></td>
                    <td className="px-4 py-2.5 text-xs">{d.demandes.byObjectif.find((o) => o.objectif === r.objectif)?.label ?? r.objectif}<span className="block text-muted">{r.typeTransaction} · {r.typeBien} · {r.source}</span></td>
                    <td className="px-4 py-2.5 text-xs">{[r.quartier, r.ville].filter(Boolean).join(", ") || "—"}</td>
                    <td className="px-4 py-2.5 text-xs">{money(r.budgetMax)}</td>
                    <td className="px-4 py-2.5"><Pill tone={r.statut === "nouvelle" ? "amber" : "slate"}>{statut(r.statut)}</Pill></td>
                    <td className="px-4 py-2.5 text-xs text-muted">{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="p-6 text-center text-sm text-muted">Aucune demande sur Render.</p>}
      </Section>

      <Section title="Mandats web" hint="Biens confiés par des propriétaires via « Confier mon bien ».">
        {d.mandats.length ? (
          <ul className="divide-y divide-slate-100">
            {d.mandats.map((m) => (
              <li key={m.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3 text-sm">
                <span>
                  <span className="font-semibold text-ink">{m.proprietaire_nom || "—"}</span>
                  <span className="block text-xs text-muted">{[m.proprietaire_tel, m.proprietaire_email].filter(Boolean).join(" · ")}</span>
                  <span className="block text-xs">{m.bien_type} · {m.type_mandat.replace(/_/g, " ")}{m.bien_adresse ? ` · ${m.bien_adresse}` : ""}</span>
                  {m.fichiers.length ? (
                    <span className="mt-1 flex flex-wrap gap-2 text-xs">
                      {m.fichiers.map((f, k) => (f.url ? <a key={k} href={f.url} target="_blank" rel="noreferrer" className="font-semibold text-brand-800 underline">{f.name}</a> : <span key={k}>{f.name}</span>))}
                    </span>
                  ) : null}
                </span>
                <span className="flex items-center gap-2"><Pill tone={m.statut === "nouveau" ? "amber" : "slate"}>{statut(m.statut)}</Pill><span className="text-xs text-muted">{fmtDate(m.created_at)}</span></span>
              </li>
            ))}
          </ul>
        ) : <p className="p-6 text-center text-sm text-muted">Aucun mandat web sur Render.</p>}
      </Section>

      <Section title="Bascule de l’agence" hint="Un domaine passe sur Render quand Moboo l’a ouvert et que l’application a repris les données de l’agence." right={<Link href="/admin/application/bascule-pro" className="text-sm font-semibold text-brand-800 hover:underline">Gérer la bascule →</Link>}>
        <ul className="grid gap-px bg-slate-100 sm:grid-cols-2">
          {d.bascule.map((b) => (
            <li key={b.key} className="flex items-center justify-between gap-2 bg-white px-4 py-2.5 text-sm">
              <span className="text-ink">{b.label}</span>
              {b.render ? <Pill tone="green">Render{b.migratedAt ? ` · ${fmtDate(b.migratedAt)}` : ""}</Pill>
                : b.open ? <Pill tone="amber">Ouvert · reprise à la prochaine connexion</Pill>
                : b.migrated ? <Pill tone="slate">Repris, domaine fermé</Pill>
                : <Pill tone="slate">WordPress</Pill>}
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
