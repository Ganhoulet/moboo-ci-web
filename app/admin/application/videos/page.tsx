import Link from "next/link";
import { AdminVideosTable } from "@/components/admin-videos-table";
import { getAdminVideos, getVideoLog, getVideoStatus } from "../actions";

export const dynamic = "force-dynamic";

const gb = (b: number) => (b / 1024 ** 3).toLocaleString("fr-FR", { maximumFractionDigits: 1 });

/** Filtres rapides (cumulables avec les listes déroulantes). */
const PRESETS: [string, string, Record<string, string>][] = [
  ["Toutes", "", {}],
  ["Locations de plus de 3 semaines", "rent21", { transaction: "rent", olderThan: "21" }],
  ["Louées, vendues ou expirées", "closed", { state: "closed" }],
  ["Ventes", "sale", { transaction: "sale" }],
  ["Liens YouTube", "youtube", { kind: "youtube" }],
];

export default async function Videos({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const preset = PRESETS.find(([, k]) => k === (searchParams.f ?? "")) ?? PRESETS[0];
  const params = { ...preset[2], ...Object.fromEntries(Object.entries(searchParams).filter(([k, v]) => k !== "f" && v)) };
  const [data, status, log] = await Promise.all([getAdminVideos(params), getVideoStatus(), searchParams.journal ? getVideoLog(searchParams.page) : null]);
  if (!data || !status) return <p className="text-muted">Vidéos indisponibles.</p>;
  const used = status.provider === "bunny" ? data.usage.bunny.bytes : data.usage.r2.bytes;
  const pct = Math.min(100, Math.round((used / data.quotaBytes) * 100));
  const on = (b: boolean) => (b ? <span className="font-semibold text-emerald-700">activé</span> : <span className="font-semibold text-slate-500">désactivé</span>);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Vidéos des annonces</h1>
          <p className="text-sm text-muted">Vidéos envoyées depuis l’application et le site. Supprimer une vidéo la retire chez le fournisseur ET de l’annonce (galerie automatique comprise).</p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link href="/admin/application/reglages" className="font-semibold text-brand-800 hover:underline">Réglages vidéo →</Link>
          <Link href={searchParams.journal ? "/admin/application/videos" : "/admin/application/videos?journal=1"} className="font-semibold text-brand-800 hover:underline">
            {searchParams.journal ? "← Vidéos" : "Journal des suppressions"}
          </Link>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <section className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200 md:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Espace utilisé · {status.provider === "r2" ? "Cloudflare R2" : "Bunny Stream"}</p>
          <p className="mt-1 font-display text-2xl font-extrabold text-ink">{gb(used)} Go <span className="text-base font-semibold text-muted">/ {gb(data.quotaBytes)} Go</span></p>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-slate-100">
            <div className={"h-full " + (pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : "bg-emerald-500")} style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-muted">
            {data.usage.r2.count} vidéo(s) chez R2 ({gb(data.usage.r2.bytes)} Go) · {data.usage.bunny.count} chez Bunny ({gb(data.usage.bunny.bytes)} Go) — calculé d’après la taille des fichiers envoyés.
          </p>
        </section>
        <section className="rounded-lg bg-white p-4 text-sm shadow-sm ring-1 ring-slate-200">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">Interrupteurs</p>
          <ul className="mt-1 space-y-0.5">
            <li>Fournisseur : <strong>{status.provider === "r2" ? "R2" : "Bunny"}</strong> {status.providerReady ? "✓" : <span className="text-red-700">(clés manquantes sur Render)</span>}</li>
            <li>Envoi dans l’application : {on(status.appUpload)}</li>
            <li>Envoi sur le site : {on(status.webUpload)}</li>
            <li>Découpe IA en images : {on(status.aiRooms)} {status.aiRooms && !status.workerKeySet ? <span className="text-red-700">(worker non configuré)</span> : null}</li>
            <li>Nettoyage auto : {on(status.cleanup.enabled)}{status.cleanup.enabled ? ` · ${status.cleanup.days} j · ${status.cleanup.target === "rent" ? "locations" : status.cleanup.target === "closed" ? "louées/vendues/expirées" : "toutes"}` : ""}</li>
          </ul>
        </section>
      </div>

      {log ? (
        <div className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
          {log.items.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {log.items.map((x) => (
                <li key={x.id} className="flex flex-wrap gap-x-3 px-4 py-2.5">
                  <span className="text-muted">{new Date(x.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</span>
                  <span className="font-semibold text-ink">{x.title || x.listingId}</span>
                  <span className="text-slate-600">{x.reasonLabel}</span>
                  <span className="text-muted">{x.provider}{x.size ? ` · ${(x.size / 1024 / 1024).toFixed(1)} Mo` : ""}</span>
                </li>
              ))}
            </ul>
          ) : <p className="p-8 text-center text-sm text-muted">Aucune suppression pour l’instant.</p>}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 text-sm">
            {PRESETS.map(([label, k]) => (
              <Link key={k} href={k ? `/admin/application/videos?f=${k}` : "/admin/application/videos"}
                className={"rounded-full px-3.5 py-1.5 font-semibold " + (preset[1] === k ? "bg-brand-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200")}>
                {label}
              </Link>
            ))}
          </div>
          <form className="flex flex-wrap items-end gap-2 text-sm" action="/admin/application/videos">
            {preset[1] ? <input type="hidden" name="f" value={preset[1]} /> : null}
            <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Titre de l’annonce" className="input w-56" />
            <select name="state" defaultValue={searchParams.state ?? ""} className="input w-48">
              <option value="">Tous les statuts</option><option value="active">En ligne</option><option value="closed">Louées / vendues / expirées</option><option value="deleted">Supprimées</option>
            </select>
            <select name="olderThan" defaultValue={searchParams.olderThan ?? ""} className="input w-44">
              <option value="">Toutes les dates</option><option value="14">Plus de 2 semaines</option><option value="21">Plus de 3 semaines</option><option value="30">Plus d’un mois</option><option value="90">Plus de 3 mois</option>
            </select>
            <button className="rounded-full bg-brand-700 px-4 py-2 font-semibold text-white">Filtrer</button>
          </form>
          <AdminVideosTable items={data.items} total={data.total} />
          {data.total > data.perPage ? (
            <div className="flex gap-3 text-sm">
              {data.page > 1 ? <Link className="font-semibold text-brand-800" href={`?${new URLSearchParams({ ...(searchParams as Record<string, string>), page: String(data.page - 1) })}`}>← Précédentes</Link> : null}
              {data.page * data.perPage < data.total ? <Link className="font-semibold text-brand-800" href={`?${new URLSearchParams({ ...(searchParams as Record<string, string>), page: String(data.page + 1) })}`}>Suivantes →</Link> : null}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
