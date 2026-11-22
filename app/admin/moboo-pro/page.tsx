import Link from "next/link";
import { getProAgencies } from "./actions";
import { ago, fmtDate, Pill, Stat } from "./ui";

export const dynamic = "force-dynamic";

const MODE_LABEL = { off: "WordPress", pilot: "Pilotes", on: "Toutes" } as const;

export default async function ProAgences({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const q = (searchParams.q ?? "").trim();
  const page = Number(searchParams.page) || 1;
  const data = await getProAgencies(q, page);
  if (!data) return <p className="text-muted">Agences indisponibles (droit « Application » requis).</p>;
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const label = (k: string) => data.domains.find((d) => d.key === k)?.label ?? k;
  const href = (p: number) => `/admin/moboo-pro?${q ? `q=${encodeURIComponent(q)}&` : ""}page=${p}`;
  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">Moboo Pro › Agences et liens</h1>
        <p className="max-w-3xl text-sm text-muted">
          Chaque agence Moboo Pro avec ses agents, ses liens publics (pro.moboo.ci), ses invitations, les demandes et mandats reçus et l’état de sa bascule.
          Remplace les écrans des extensions WordPress « Moboo Demandes », « Moboo Invitations » et « Houzez Sync ».
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Agences" value={data.totals.orgs} />
        <Stat label="Liens publics" value={data.totals.tokens} hint="jetons de formulaires" />
        <Stat label="Demandes" value={data.totals.demandes} hint={`${data.totals.demandes7} sur 7 jours`} />
        <Stat label="Mandats web" value={data.totals.mandats} />
        <Stat label="Invitations" value={data.totals.invitesPending} hint="en attente" />
        <Stat label="WordPress" value={data.wordpress.off ? "Arrêté" : "Actif"} hint={data.wordpress.off ? fmtDate(data.wordpress.at) : "pour Moboo Pro"} />
      </div>

      <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-ink">Domaines servis par Render</h2>
          <Link href="/admin/application/bascule-pro" className="text-sm font-semibold text-brand-800 hover:underline">Gérer la bascule →</Link>
        </div>
        <ul className="mt-3 flex flex-wrap gap-2">
          {data.domains.map((d) => (
            <li key={d.key}><Pill tone={d.mode === "on" ? "green" : d.mode === "pilot" ? "amber" : "slate"}>{d.label} · {MODE_LABEL[d.mode]}</Pill></li>
          ))}
        </ul>
      </section>

      <form className="flex flex-wrap gap-2" action="/admin/moboo-pro">
        <input name="q" defaultValue={q} placeholder="Nom d’agence, e-mail, téléphone, nom d’agent…" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button className="rounded-md bg-brand-700 px-4 py-2 text-sm font-semibold text-white">Rechercher</button>
        {q ? <Link href="/admin/moboo-pro" className="rounded-md px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-200">Effacer</Link> : null}
      </form>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {data.orgs.length ? (
          <table className="w-full min-w-[60rem] text-sm">
            <thead className="border-b border-slate-200 text-left">
              <tr>
                <th className="px-4 py-3">Agence</th>
                <th className="px-4 py-3 text-right">Agents</th>
                <th className="px-4 py-3 text-right">Liens</th>
                <th className="px-4 py-3 text-right">Demandes</th>
                <th className="px-4 py-3 text-right">Mandats</th>
                <th className="px-4 py-3 text-right">Invitations</th>
                <th className="px-4 py-3">Bascule</th>
                <th className="px-4 py-3">Appli</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.orgs.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5">
                    <Link href={`/admin/moboo-pro/agence/${o.id}`} className="font-semibold text-brand-800 hover:underline">{o.name}</Link>
                    <span className="block text-xs text-muted">{o.contact ?? "—"}{o.plan ? ` · forfait ${o.plan}` : ""}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">{o.members}</td>
                  <td className="px-4 py-2.5 text-right">{o.tokens}</td>
                  <td className="px-4 py-2.5 text-right">
                    {o.demandes}
                    {o.demandes7 ? <span className="block text-xs text-emerald-700">+{o.demandes7} (7 j)</span> : null}
                  </td>
                  <td className="px-4 py-2.5 text-right">{o.mandats}</td>
                  <td className="px-4 py-2.5 text-right">{o.invitesPending ? <Pill tone="amber">{o.invitesPending} en attente</Pill> : "0"}</td>
                  <td className="px-4 py-2.5">
                    {o.wpAdmin ? (
                      <Pill tone="blue">Administrateur : reste sur WordPress</Pill>
                    ) : (
                      <span className="flex flex-wrap gap-1">
                        <Pill tone={o.bascule.render.length ? "green" : "slate"}>{o.bascule.render.length} / {o.bascule.total} sur Render</Pill>
                        {o.bascule.waiting.length ? <span title={o.bascule.waiting.map(label).join(", ")}><Pill tone="amber">{o.bascule.waiting.length} en attente de connexion</Pill></span> : null}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-xs text-muted">{ago(o.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="p-8 text-center text-sm text-muted">Aucune agence{q ? ` pour « ${q} »` : ""}.</p>}
      </div>

      {pages > 1 ? (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 ? <Link href={href(page - 1)} className="rounded bg-white px-3 py-1.5 ring-1 ring-slate-200">← Précédent</Link> : null}
          <span className="px-2 py-1.5 text-muted">Page {page} / {pages} · {data.total} agence(s)</span>
          {page < pages ? <Link href={href(page + 1)} className="rounded bg-white px-3 py-1.5 ring-1 ring-slate-200">Suivant →</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
