import Link from "next/link";
import type { AuditRow } from "@/app/admin/backoffice-actions";
import { ACTION_LABEL, fmtDateTime } from "./ui";

const show = (v: unknown) => (v == null || v === "" ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v));

/** Détail d'une ligne : « avant → après » ou données envoyées. */
function Changes({ c }: { c: any }) {
  if (!c) return null;
  const d = c.diff as Record<string, { from: unknown; to: unknown }> | undefined;
  return (
    <details className="mt-1 text-xs">
      <summary className="cursor-pointer select-none font-semibold text-brand-800">Détails</summary>
      {d ? (
        <table className="mt-1 w-full max-w-2xl">
          <tbody>
            {Object.entries(d).map(([k, v]) => (
              <tr key={k} className="align-top">
                <td className="py-0.5 pr-3 font-mono text-slate-500">{k}</td>
                <td className="py-0.5 pr-2 text-red-700 line-through decoration-red-300">{show(v.from)}</td>
                <td className="py-0.5 text-emerald-700">→ {show(v.to)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <pre className="mt-1 max-h-60 max-w-full overflow-auto whitespace-pre-wrap break-all rounded bg-slate-50 p-2 text-[11px] text-slate-600">{JSON.stringify(c, null, 2)}</pre>
      )}
    </details>
  );
}

/** Lien vers l'élément concerné (fiche utilisateur, annonce…). */
function target(r: AuditRow) {
  if (!r.entityId) return null;
  if (r.entityType === "account") return `/admin/utilisateurs/${r.entityId}`;
  if (r.entityType === "listing") return `/admin/immobilier/${r.entityId}`;
  if (r.entityType === "seo") return `/admin/seo/${r.entityId}`;
  if (r.entityType === "marketing") return `/admin/marketing/${r.entityId}`;
  if (r.entityType === "settings") return `/admin/reglages/${r.entityId}`;
  return null;
}

export function AuditList({ items, showActor = true }: { items: AuditRow[]; showActor?: boolean }) {
  if (!items.length) return <p className="text-sm text-muted">Aucune activité enregistrée.</p>;
  return (
    <ol className="relative space-y-3 border-l border-slate-200 pl-4">
      {items.map((r) => {
        const href = target(r);
        return (
          <li key={r.id} className="relative">
            <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-brand-600 ring-4 ring-white" />
            <p className="text-sm text-ink">
              {r.entityType ? <span className="mr-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">{ACTION_LABEL[r.entityType] ?? r.entityType}</span> : null}
              {href ? <Link href={href} className="hover:underline">{r.summary}</Link> : r.summary}
            </p>
            <p className="text-xs text-muted">
              {fmtDateTime(r.createdAt)}
              {showActor ? <> · {r.actorId ? <Link href={`/admin/journal?actor=${r.actorId}`} className="font-semibold text-slate-600 hover:underline">{r.actorName ?? "—"}</Link> : <span className="font-semibold">Système</span>}</> : null}
              {r.ip ? <> · IP {r.ip}</> : null}
            </p>
            <Changes c={r.changes} />
          </li>
        );
      })}
    </ol>
  );
}
