import Link from "next/link";

/** Pagination serveur : conserve tous les filtres, change juste `page`. */
export function Pagination({
  page,
  perPage,
  total,
  params,
}: {
  page: number;
  perPage: number;
  total: number;
  params: Record<string, string | undefined>;
}) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;

  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) q.set(k, v);
    if (p > 1) q.set("page", String(p));
    else q.delete("page");
    return `/annonces${q.toString() ? `?${q}` : ""}`;
  };

  // Fenêtre de pages autour de la page courante.
  const win: number[] = [];
  const from = Math.max(1, page - 2);
  const to = Math.min(pages, page + 2);
  for (let i = from; i <= to; i++) win.push(i);

  const btn =
    "grid h-10 min-w-10 place-items-center rounded-xl px-3 text-sm font-semibold transition";

  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className={`${btn} border border-slate-200 bg-white text-slate-700 hover:border-slate-300`}>
          ← Précédent
        </Link>
      ) : null}

      {from > 1 ? (
        <>
          <Link href={href(1)} className={`${btn} border border-slate-200 bg-white text-slate-700 hover:border-slate-300`}>1</Link>
          {from > 2 ? <span className="px-1 text-muted">…</span> : null}
        </>
      ) : null}

      {win.map((p) => (
        <Link
          key={p}
          href={href(p)}
          aria-current={p === page ? "page" : undefined}
          className={`${btn} ${p === page ? "bg-brand-800 text-white" : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300"}`}
        >
          {p}
        </Link>
      ))}

      {to < pages ? (
        <>
          {to < pages - 1 ? <span className="px-1 text-muted">…</span> : null}
          <Link href={href(pages)} className={`${btn} border border-slate-200 bg-white text-slate-700 hover:border-slate-300`}>{pages}</Link>
        </>
      ) : null}

      {page < pages ? (
        <Link href={href(page + 1)} className={`${btn} border border-slate-200 bg-white text-slate-700 hover:border-slate-300`}>
          Suivant →
        </Link>
      ) : null}
    </nav>
  );
}
