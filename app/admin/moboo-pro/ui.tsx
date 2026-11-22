export const fmtDate = (d: string | null | undefined) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

export const ago = (d: string | null | undefined) => {
  if (!d) return "jamais";
  const m = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  return m < 1 ? "à l’instant" : m < 60 ? `il y a ${m} min` : m < 1440 ? `il y a ${Math.round(m / 60)} h` : m < 43200 ? `il y a ${Math.round(m / 1440)} j` : new Date(d).toLocaleDateString("fr-FR");
};

export function Stat({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold text-ink">{value}</p>
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

export function Pill({ tone, children }: { tone: "green" | "amber" | "slate" | "red" | "blue"; children: React.ReactNode }) {
  const c = { green: "bg-emerald-100 text-emerald-800", amber: "bg-amber-100 text-amber-800", slate: "bg-slate-100 text-slate-600", red: "bg-red-100 text-red-700", blue: "bg-sky-100 text-sky-800" }[tone];
  return <span className={"inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold " + c}>{children}</span>;
}

export function Section({ title, hint, children, right }: { title: string; hint?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <section className="rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="font-semibold text-ink">{title}</h2>
          {hint ? <p className="text-xs text-muted">{hint}</p> : null}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}
