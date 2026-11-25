import Link from "next/link";
import { getSession } from "@/lib/session";
import { authedFetch } from "@/lib/server-api";
import type { SiteAccount } from "@/lib/api";
import { getAm } from "../actions";

export const dynamic = "force-dynamic";

type Entry = { id: string; actorName: string | null; action: string; entityType: string | null; entityId: string | null; summary: string; createdAt: string };

/** Journal des account managers : mes actions, ou celles de toute l'équipe pour le responsable. */
export default async function AmJournal({ searchParams }: { searchParams: { scope?: string; page?: string; q?: string } }) {
  const me = getSession() ? await authedFetch("/site/auth/me", { method: "GET" }) : null;
  const lead = ((me?.data as SiteAccount | undefined)?.permissions ?? []).includes("accounts.all");
  const scope = lead && searchParams.scope === "team" ? "team" : "mine";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const q = (searchParams.q ?? "").slice(0, 100);
  const params = new URLSearchParams({ scope, page: String(page), ...(q ? { q } : {}) });
  const d = await getAm<{ total: number; perPage: number; items: Entry[] }>(`/journal?${params}`);
  if (!d) return <p className="rounded-lg bg-white p-6 text-sm text-red-600 ring-1 ring-slate-200">Journal indisponible.</p>;
  const pages = Math.max(1, Math.ceil(d.total / d.perPage));
  const href = (p: number) => `?${new URLSearchParams({ scope, page: String(p), ...(q ? { q } : {}) })}`;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink">{scope === "team" ? "Actions de l’équipe" : "Mes actions"}</h1>
        <p className="mt-1 text-sm text-muted">
          Tout ce qui est fait depuis le suivi des comptes est noté ici et dans le journal d’activité du site : accès assisté, publications pour un annonceur, liens envoyés, réservations confirmées…
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {lead ? [["mine", "Mes actions"], ["team", "Toute l’équipe"]].map(([k, l]) => (
          <Link key={k} href={`?scope=${k}`} className={"rounded-full px-3 py-1 font-semibold " + (scope === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</Link>
        )) : null}
        <form className="ml-auto flex gap-2">
          <input type="hidden" name="scope" value={scope} />
          <input name="q" defaultValue={q} placeholder="Rechercher…" className="rounded-md border border-slate-300 px-3 py-1.5" />
          <button className="rounded-md bg-brand-700 px-3 py-1.5 font-semibold text-white hover:bg-brand-800">OK</button>
        </form>
      </div>
      <ul className="divide-y divide-slate-100 rounded-lg bg-white px-4 ring-1 ring-slate-200">
        {d.items.map((e) => (
          <li key={e.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5 text-sm">
            <span>
              {e.summary}
              {e.entityType === "account" && e.entityId && !e.entityId.includes(":") ? (
                <> · <Link href={`/admin/comptes/site/${e.entityId}`} className="font-semibold text-brand-700 hover:underline">voir le compte</Link></>
              ) : null}
            </span>
            <span className="text-xs text-muted">
              {new Date(e.createdAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Abidjan" })}
              {scope === "team" && e.actorName ? ` · ${e.actorName}` : ""}
            </span>
          </li>
        ))}
        {!d.items.length ? <li className="py-3 text-sm text-muted">Aucune action pour l’instant.</li> : null}
      </ul>
      {pages > 1 ? (
        <div className="flex items-center justify-between text-sm">
          {page > 1 ? <Link href={href(page - 1)} className="font-semibold text-brand-700">← Plus récentes</Link> : <span />}
          <span className="text-muted">Page {page} / {pages}</span>
          {page < pages ? <Link href={href(page + 1)} className="font-semibold text-brand-700">Plus anciennes →</Link> : <span />}
        </div>
      ) : null}
    </div>
  );
}
