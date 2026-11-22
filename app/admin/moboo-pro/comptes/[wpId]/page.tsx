import Link from "next/link";
import { getProAccount } from "../../comptes-actions";
import { ago, fmtDate, Pill, Section, Stat } from "../../ui";
import { NotifyControl, PlanControl, RoleControl, SuspendControl } from "../controls";
import { PLAN_LABEL, PLANS, ROLE_LABEL, SETTABLE_ROLES } from "../labels";

export const dynamic = "force-dynamic";

const COUNT_LABEL: Record<string, string> = {
  biens: "Biens", locataires: "Locataires", proprietaires: "Propriétaires", baux: "Baux", demandes: "Demandes", contrats: "Contrats", etatsDesLieux: "États des lieux", scansQr: "Scans QR",
};

export default async function ProCompte({ params }: { params: { wpId: string } }) {
  const wpId = Number(params.wpId);
  const d = await getProAccount(wpId);
  if (!d) return <p className="text-muted">Compte introuvable ou accès refusé (droit « Application » requis).</p>;
  const a = d.account;
  const isAdmin = a.role === "administrator";
  const counts = Object.entries(d.insights.counts).filter(([k]) => k !== "loyersSuivis");
  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin/moboo-pro/comptes" className="text-sm font-semibold text-brand-800 hover:underline">← Comptes</Link>
        <h1 className="mt-1 flex flex-wrap items-center gap-2 font-display text-2xl font-extrabold text-ink">
          {a.display_name || `Compte ${a.id}`}
          <Pill tone={isAdmin ? "blue" : "slate"}>{ROLE_LABEL[a.role] ?? a.role}</Pill>
          {a.suspended ? <Pill tone="red">Suspendu</Pill> : <Pill tone="green">Actif</Pill>}
        </h1>
        <p className="text-sm text-muted">
          {[a.email, a.phone].filter(Boolean).join(" · ") || "Pas de contact"} · n° {a.id}
          {a.registered ? ` · inscrit le ${fmtDate(a.registered.replace(" ", "T"))}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Forfait" value={PLAN_LABEL[a.plan] ?? a.plan} hint={a.expires_at && a.plan !== "starter" ? `jusqu’au ${fmtDate(a.expires_at)}` : undefined} />
        <Stat label="Crédits EDL" value={a.edl_credits} />
        <Stat label="Appli" value={a.app_last_seen ? ago(a.app_last_seen) : a.app_active ? "Oui" : "Jamais"} />
        <Stat label="Loyers suivis" value={`${Number(d.insights.counts.loyersSuivis ?? 0).toLocaleString("fr-FR")} F`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SuspendControl wpId={a.id} suspended={a.suspended} isAdmin={isAdmin} />
        <RoleControl wpId={a.id} role={a.role} roles={SETTABLE_ROLES} isAdmin={isAdmin} />
        <PlanControl wpId={a.id} plan={a.plan} plans={PLANS} credits={a.edl_credits} />
        <NotifyControl wpId={a.id} />
      </div>

      <Section title="Contenu du compte" hint={d.insights.linked ? "Données sur Render (agence du compte)." : "Ce compte n’est pas encore rattaché à une agence sur Render."}>
        <ul className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-4">
          {counts.map(([k, n]) => (
            <li key={k} className="bg-white px-4 py-3"><p className="text-xs text-muted">{COUNT_LABEL[k] ?? k}</p><p className="font-display text-xl font-extrabold text-ink">{n}</p></li>
          ))}
        </ul>
      </Section>

      <Section title="Historique" hint="Biens, baux, demandes, paiements de forfait et actions de l’équipe Moboo (40 derniers).">
        {d.insights.timeline.length ? (
          <ul className="divide-y divide-slate-100">
            {d.insights.timeline.map((t, i) => (
              <li key={i} className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm">
                <span className="text-ink">{t.label}</span>
                <span className="shrink-0 text-xs text-muted">{fmtDate(t.date)}</span>
              </li>
            ))}
          </ul>
        ) : <p className="p-6 text-center text-sm text-muted">Rien pour l’instant.</p>}
      </Section>
    </div>
  );
}
