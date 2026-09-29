import Link from "next/link";
import { VerificationActions } from "@/components/admin-verification-actions";
import { getSiteSettings, roleName } from "@/lib/settings";
import { listVerifications } from "./actions";

export const dynamic = "force-dynamic";

const TABS: [string, string][] = [["pending", "À examiner"], ["more_info", "Complément demandé"], ["approved", "Validées"], ["rejected", "Refusées"], ["", "Toutes"]];
const CLS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800", approved: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-700", more_info: "bg-sky-100 text-sky-800",
};

export default async function Verifications({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const status = searchParams.status ?? "pending";
  const [data, settings] = await Promise.all([listVerifications({ status, page: searchParams.page }), getSiteSettings()]);
  const counts = data?.counts ?? {};
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Vérification des comptes</h1>
          <p className="text-sm text-muted">Pièces envoyées par les professionnels. Les documents s’ouvrent par un lien temporaire (10 min).</p>
        </div>
        <Link href="/admin/verifications/reglages" className="text-sm font-semibold text-brand-800 hover:underline">Réglages de la vérification →</Link>
      </div>
      {!settings.verification.enabled ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">La vérification est désactivée : activez-la dans les réglages pour que les professionnels puissent envoyer leurs pièces.</p> : null}
      <div className="flex flex-wrap gap-2 text-sm">
        {TABS.map(([k, l]) => (
          <Link key={k || "all"} href={`/admin/verifications?status=${k}`}
            className={"rounded-full px-3.5 py-1.5 font-semibold " + (status === k ? "bg-brand-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200")}>
            {l} <span className="opacity-70">({k ? counts[k] ?? 0 : Object.values(counts).reduce((s, n) => s + n, 0)})</span>
          </Link>
        ))}
      </div>
      <div className="space-y-3">
        {data?.items.length ? data.items.map((v) => (
          <article key={v.id} className="flex flex-wrap gap-4 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="min-w-[14rem] flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-ink">{v.account?.name ?? "Compte supprimé"}</p>
                <span className={"rounded px-2 py-0.5 text-xs font-bold " + (CLS[v.status] ?? "")}>{v.statusLabel}</span>
                {v.account?.verified ? <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">✓ Badge actif</span> : null}
              </div>
              <p className="text-sm text-slate-600">{v.account ? `${roleName(settings, v.account.accountType)} · ${v.account.phone}${v.account.email ? ` · ${v.account.email}` : ""}` : ""}</p>
              <p className="mt-2 text-sm"><strong>{v.docType}</strong> au nom de <strong>{v.fullName}</strong></p>
              {v.note ? <p className="mt-1 text-sm text-slate-600">« {v.note} »</p> : null}
              {v.adminNote ? <p className="mt-1 text-xs text-slate-500">Note : {v.adminNote}</p> : null}
              <p className="mt-1 text-xs text-muted">Envoyée le {new Date(v.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}{v.account?.username ? <> · <Link href={`/pro/${v.account.username}`} target="_blank" className="text-brand-800 hover:underline">page publique</Link></> : null}</p>
            </div>
            <div className="flex gap-2">
              {[["Recto", v.frontUrl], ["Verso", v.backUrl]].filter(([, u]) => u).map(([l, u]) => (
                <a key={l} href={u!} target="_blank" rel="noopener noreferrer" className="grid h-24 w-32 place-items-center overflow-hidden rounded-md bg-slate-100 text-xs font-semibold text-brand-800 ring-1 ring-slate-200 hover:ring-brand-400">
                  {/\.pdf(\?|$)/i.test(u!) ? `📄 ${l} (PDF)` : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={u!} alt={l!} className="h-full w-full object-cover" />
                  )}
                </a>
              ))}
              {!v.frontUrl ? <span className="text-xs text-muted">Document indisponible (stockage).</span> : null}
            </div>
            <div className="w-full">
              <VerificationActions id={v.id} status={v.status} accountId={v.account?.id ?? null} verified={!!v.account?.verified} />
            </div>
          </article>
        )) : <p className="rounded-lg bg-white p-8 text-center text-sm text-muted shadow-sm ring-1 ring-slate-200">Aucune demande.</p>}
      </div>
    </div>
  );
}
