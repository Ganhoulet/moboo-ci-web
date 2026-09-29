import Link from "next/link";
import { ReviewActions } from "@/components/admin-row-actions";
import { Stars } from "@/components/reviews";
import { listReviews } from "../actions";

const TABS = [
  { key: "", label: "Tous" },
  { key: "pending", label: "À modérer" },
  { key: "approved", label: "Approuvés" },
  { key: "rejected", label: "Refusés" },
];
const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "À modérer", cls: "bg-amber-100 text-amber-800" },
  approved: { label: "Approuvé", cls: "bg-emerald-100 text-emerald-800" },
  rejected: { label: "Refusé", cls: "bg-slate-200 text-slate-700" },
};

export default async function AdminReviews({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const status = searchParams.status ?? "";
  const page = Number(searchParams.page) || 1;
  const data = await listReviews({ status, type: searchParams.type, page: String(page) });
  const counts = data?.counts ?? {};
  const all = Object.values(counts).reduce((s, n) => s + n, 0);
  const href = (p: Record<string, string | number | undefined>) => {
    const q = new URLSearchParams(Object.entries({ status, type: searchParams.type, ...p }).filter(([, v]) => v).map(([k, v]) => [k, String(v)])).toString();
    return `/admin/immobilier/avis${q ? `?${q}` : ""}`;
  };
  const pages = data ? Math.max(1, Math.ceil(data.total / data.perPage)) : 1;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">Avis</h1>
          <p className="text-sm text-muted">Avis laissés sur les annonces et les pages des professionnels. Réglages : <Link href="/admin/reglages/reviews" className="font-semibold text-brand-800 hover:underline">Avis</Link>.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 text-sm">
        {TABS.map((t) => (
          <Link key={t.key} href={href({ status: t.key, page: undefined })}
            className={"rounded-full px-3.5 py-1.5 font-semibold " + (status === t.key ? "bg-brand-700 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50")}>
            {t.label} <span className="opacity-70">({t.key ? counts[t.key] ?? 0 : all})</span>
          </Link>
        ))}
      </div>
      <div className="overflow-x-auto rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
        {data?.items.length ? (
          <table className="w-full min-w-[52rem] text-sm">
            <thead className="border-b border-slate-200 text-left">
              <tr><th className="px-4 py-3">Avis</th><th className="px-4 py-3">Sur</th><th className="px-4 py-3">Auteur</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3" /></tr>
            </thead>
            <tbody className="divide-y divide-slate-100 align-top">
              {data.items.map((r) => (
                <tr key={r.id}>
                  <td className="max-w-md px-4 py-3">
                    <Stars value={r.rating} />
                    {r.title ? <p className="mt-1 font-semibold text-ink">{r.title}</p> : null}
                    <p className="mt-0.5 whitespace-pre-line text-slate-600">{r.comment}</p>
                    <p className="mt-1 text-xs text-muted">{new Date(r.createdAt).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold uppercase text-muted">{r.targetType === "listing" ? "Annonce" : "Profil"}</p>
                    {r.target.href ? <a href={r.target.href} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-800 hover:underline">{r.target.title}</a> : <span>{r.target.title}</span>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-ink">{r.author?.name ?? r.authorName}</p>
                    {r.author?.phone ? <p className="text-xs text-muted">{r.author.phone}</p> : null}
                    {r.author?.email ? <p className="text-xs text-muted">{r.author.email}</p> : null}
                  </td>
                  <td className="px-4 py-3"><span className={"rounded px-2 py-0.5 text-xs font-bold " + STATUS[r.status].cls}>{STATUS[r.status].label}</span></td>
                  <td className="px-4 py-3"><ReviewActions id={r.id} status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="p-8 text-center text-sm text-muted">Aucun avis {status ? "dans cette catégorie" : "pour l’instant"}.</p>}
      </div>
      {pages > 1 ? (
        <div className="flex justify-center gap-2 text-sm">
          {page > 1 ? <Link href={href({ page: page - 1 })} className="rounded bg-white px-3 py-1.5 ring-1 ring-slate-200">← Précédent</Link> : null}
          <span className="px-2 py-1.5 text-muted">Page {page} / {pages}</span>
          {page < pages ? <Link href={href({ page: page + 1 })} className="rounded bg-white px-3 py-1.5 ring-1 ring-slate-200">Suivant →</Link> : null}
        </div>
      ) : null}
    </div>
  );
}
