import Link from "next/link";
import { NudgeHistory, NudgePros, NudgeRules } from "@/components/backoffice/nudges-panel";
import { getNudgeOverview, listNudges, listPros } from "./actions";

export const dynamic = "force-dynamic";

const TABS = [["pros", "Professionnels à relancer"], ["scenarios", "Relances automatiques"], ["historique", "Historique"]] as const;
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)} %` : "—");

function Tile({ label, value, hint, href, tone = "" }: { label: string; value: string | number; hint?: string; href?: string; tone?: string }) {
  const body = (
    <div className={"h-full rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 " + (href ? "transition hover:ring-brand-300" : "")}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={"mt-1 font-display text-2xl font-extrabold tabular-nums " + (tone || "text-ink")}>{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

/** Centre marketing → Relance des agents (et autres professionnels) pour qu'ils continuent de publier. */
export default async function Nudges({ searchParams }: { searchParams: { tab?: string; segment?: string; q?: string; type?: string; page?: string } }) {
  const tab = TABS.some(([k]) => k === searchParams.tab) ? searchParams.tab! : "pros";
  const [o, pros, history] = await Promise.all([
    getNudgeOverview(),
    tab === "pros" ? listPros({ segment: searchParams.segment, search: searchParams.q, type: searchParams.type, page: searchParams.page }) : null,
    tab === "historique" ? listNudges() : null,
  ]);
  if (!o) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Relances indisponibles.</p>;
  const seg = (s: string) => `/admin/centre-marketing/relances?tab=pros&segment=${s}`;
  const active = o.rules.filter((r) => r.enabled).length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Relance des agents</h1>
        <p className="max-w-3xl text-sm text-muted">Gardez les agents, agences et propriétaires actifs : Moboo.ci les relance avec <strong>leurs vrais chiffres</strong> (vues, demandes reçues) et <strong>la demande de leur quartier</strong> (recherches des 7 derniers jours) pour leur donner envie de publier. Relances automatiques par scénario, ou relance manuelle des comptes choisis : message dans Mon espace, e-mail, WhatsApp.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Tile label="Professionnels" value={o.pros} hint="agents, agences, propriétaires…" href={seg("tous")} />
        <Tile label="Actifs" value={o.segments.actif} hint="annonce publiée < 30 j" tone="text-emerald-700" href={seg("actif")} />
        <Tile label="Inactifs" value={o.segments.inactif} hint="rien de neuf depuis 30 j" tone="text-amber-700" href={seg("inactif")} />
        <Tile label="Jamais publié" value={o.segments.sans_annonce} hint="inscrits sans annonce" tone="text-red-600" href={seg("sans_annonce")} />
        <Tile label="Annonces qui expirent" value={o.expiring} hint="comptes concernés" href={seg("expiration")} />
        <Tile label="Demandes en attente" value={o.pending} hint="comptes, depuis + de 2 j" href={seg("demandes")} />
        <Tile label="Relances · 30 j" value={o.last30.sent} hint={`clics ${pct(o.last30.clicked, o.last30.sent)} · réactivés ${pct(o.last30.converted, o.last30.sent)}`} />
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200">
        {TABS.map(([k, l]) => (
          <Link key={k} href={`/admin/centre-marketing/relances?tab=${k}`} className={"-mb-px border-b-2 px-3 py-2 text-sm font-semibold " + (tab === k ? "border-brand-700 text-brand-800" : "border-transparent text-slate-500 hover:text-ink")}>
            {l}{k === "scenarios" ? <span className={"ml-1.5 rounded-full px-1.5 py-0.5 text-[11px] " + (active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500")}>{active ? `${active} actif(s)` : "désactivées"}</span> : null}
          </Link>
        ))}
      </div>

      {tab === "pros" && pros ? <NudgePros data={pros} rules={o.rules} channels={o.channels} variables={o.variables} filters={{ segment: searchParams.segment ?? "tous", q: searchParams.q ?? "", type: searchParams.type ?? "" }} /> : null}
      {tab === "scenarios" ? <NudgeRules overview={o} /> : null}
      {tab === "historique" && history ? <NudgeHistory items={history} rules={o.rules} /> : null}
    </div>
  );
}
