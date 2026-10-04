import Link from "next/link";
import { VerificationActions } from "@/components/admin-verification-actions";
import { getSiteSettings, roleName } from "@/lib/settings";
import { listVerifications } from "./actions";

export const dynamic = "force-dynamic";

const TABS: [string, string][] = [["pending", "À examiner"], ["more_info", "Complément demandé"], ["approved", "Validées"], ["rejected", "Refusées"], ["", "Toutes"]];
const LEVELS: [string, string][] = [["", "Tous les niveaux"], ["identity", "Identité"], ["business", "Professionnel"]];
const CLS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800", approved: "bg-emerald-100 text-emerald-800", rejected: "bg-red-100 text-red-700", more_info: "bg-sky-100 text-sky-800",
};
const SEV: Record<string, string> = { high: "bg-red-50 text-red-800 ring-red-200", medium: "bg-amber-50 text-amber-900 ring-amber-200", low: "bg-slate-50 text-slate-700 ring-slate-200" };
const SEV_ICON: Record<string, string> = { high: "⛔", medium: "⚠", low: "ℹ" };
const fr = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

function Doc({ label, url }: { label: string; url: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="group block w-40">
      <span className="grid h-28 w-40 place-items-center overflow-hidden rounded-md bg-slate-100 text-xs font-semibold text-brand-800 ring-1 ring-slate-200 group-hover:ring-brand-400">
        {/\.pdf(\?|$)/i.test(url) ? `📄 ${label} (PDF)` : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} className="h-full w-full object-cover" />
        )}
      </span>
      <span className="mt-1 block text-center text-xs text-slate-600">{label}</span>
    </a>
  );
}

/** Back-office → Vérification des comptes : identité (pièce + selfie) et activité professionnelle. */
export default async function Verifications({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const status = searchParams.status ?? "pending";
  const level = searchParams.level ?? "";
  const flagged = searchParams.flagged === "1";
  const [data, settings] = await Promise.all([listVerifications({ status, page: searchParams.page, level, flagged: flagged ? "1" : undefined }), getSiteSettings()]);
  const counts = data?.counts ?? {};
  const qs = (o: Record<string, string>) => `/admin/verifications?${new URLSearchParams({ status, level, ...(flagged ? { flagged: "1" } : {}), ...o }).toString()}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Vérification des comptes</h1>
          <p className="text-sm text-muted">Pièces d’identité avec selfie, et documents professionnels. Les fichiers s’ouvrent par un lien temporaire (10 min).</p>
        </div>
        <Link href="/admin/verifications/reglages" className="text-sm font-semibold text-brand-800 hover:underline">Réglages de la vérification →</Link>
      </div>
      {!settings.verification.enabled ? <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200">La vérification est désactivée : activez-la dans les réglages pour que les comptes puissent envoyer leurs pièces.</p> : null}
      <div className="flex flex-wrap gap-2 text-sm">
        {TABS.map(([k, l]) => (
          <Link key={k || "all"} href={qs({ status: k })}
            className={"rounded-full px-3.5 py-1.5 font-semibold " + (status === k ? "bg-brand-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200")}>
            {l} <span className="opacity-70">({k ? counts[k] ?? 0 : Object.values(counts).reduce((s, n) => s + n, 0)})</span>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        {LEVELS.map(([k, l]) => <Link key={k || "all"} href={qs({ level: k })} className={level === k ? "font-bold text-ink" : "text-brand-800 hover:underline"}>{l}</Link>)}
        <span className="text-slate-300">|</span>
        <Link href={`/admin/verifications?${new URLSearchParams({ status, level, ...(flagged ? {} : { flagged: "1" }) }).toString()}`} className={flagged ? "font-bold text-ink" : "text-brand-800 hover:underline"}>
          {flagged ? "✓ " : ""}Avec alertes seulement
        </Link>
      </div>

      <div className="space-y-3">
        {data?.items.length ? data.items.map((v) => (
          <article key={v.id} className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[16rem] flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={"rounded px-2 py-0.5 text-xs font-bold " + (v.level === "business" ? "bg-violet-100 text-violet-800" : "bg-sky-100 text-sky-800")}>{v.level === "business" ? "Professionnel" : "Identité"}</span>
                  <p className="font-semibold text-ink">{v.account?.name ?? "Compte supprimé"}</p>
                  <span className={"rounded px-2 py-0.5 text-xs font-bold " + (CLS[v.status] ?? "")}>{v.statusLabel}</span>
                  {v.account?.verified ? <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">✓ Identité</span> : null}
                  {v.account?.businessVerified ? <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">✓ Pro</span> : null}
                </div>
                <p className="text-sm text-slate-600">
                  {v.account ? <>
                    {roleName(settings, v.account.accountType)} · {v.account.phone} {v.account.phoneVerified ? <span className="text-emerald-700">(confirmé)</span> : <span className="text-amber-800">(non confirmé)</span>}
                    {v.account.email ? ` · ${v.account.email}` : ""} · inscrit le {fr(v.account.createdAt)}
                  </> : null}
                </p>
                <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-sm">
                  <dt className="text-muted">Document</dt><dd className="font-medium text-ink">{v.docType}</dd>
                  {v.level === "business" ? <><dt className="text-muted">Raison sociale</dt><dd className="font-medium text-ink">{v.businessName ?? "—"} <span className="text-xs text-muted">(compte : {v.account?.companyName || "—"})</span></dd></> : null}
                  <dt className="text-muted">{v.level === "business" ? "Responsable" : "Nom sur la pièce"}</dt>
                  <dd className="font-medium text-ink">{v.fullName}{v.level === "identity" && v.account?.personName ? <span className="text-xs font-normal text-muted"> (compte : {v.account.personName})</span> : null}</dd>
                  <dt className="text-muted">Numéro</dt><dd className="font-mono text-ink">{v.businessNumber ?? v.docNumber ?? "—"}</dd>
                  {v.level === "identity" ? <><dt className="text-muted">Expire le</dt><dd className="text-ink">{v.docExpiry ? fr(v.docExpiry) : "—"}</dd></> : null}
                </dl>
                {v.note ? <p className="mt-1 text-sm text-slate-600">« {v.note} »</p> : null}
                {v.adminNote ? <p className="mt-1 text-xs text-slate-500">Réponse envoyée : {v.adminNote}</p> : null}
                <p className="mt-1 text-xs text-muted">
                  Envoyée le {new Date(v.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}
                  {v.account ? <> · <Link href={`/admin/utilisateurs/${v.account.id}`} className="text-brand-800 hover:underline">fiche utilisateur</Link></> : null}
                  {v.account?.username ? <> · <Link href={`/pro/${v.account.username}`} target="_blank" className="text-brand-800 hover:underline">page publique</Link></> : null}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {v.frontUrl ? <Doc label={v.level === "business" ? "Document" : "Recto"} url={v.frontUrl} /> : <span className="text-xs text-muted">Document indisponible (stockage).</span>}
                {v.backUrl ? <Doc label={v.level === "business" ? "Page 2" : "Verso"} url={v.backUrl} /> : null}
                {v.selfieUrl ? <Doc label="Selfie avec la pièce" url={v.selfieUrl} /> : null}
              </div>
            </div>
            {v.flags.length ? (
              <ul className="space-y-1">
                {v.flags.map((f, i) => (
                  <li key={i} className={"flex flex-wrap items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm ring-1 " + (SEV[f.severity] ?? SEV.low)}>
                    <span aria-hidden="true">{SEV_ICON[f.severity] ?? "ℹ"}</span>{f.label}
                    {f.accountId ? <Link href={`/admin/utilisateurs/${f.accountId}`} className="font-semibold underline">voir l’autre compte</Link> : null}
                  </li>
                ))}
              </ul>
            ) : null}
            {data.meta ? <VerificationActions v={v} meta={data.meta} /> : null}
          </article>
        )) : <p className="rounded-lg bg-white p-8 text-center text-sm text-muted shadow-sm ring-1 ring-slate-200">Aucune demande.</p>}
      </div>
    </div>
  );
}
