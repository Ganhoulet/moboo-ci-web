/** Score de santé d'un hôte (calculé par l'API) : pastille du portefeuille et panneau de la fiche. */

export type Health = {
  score: number;
  level: "good" | "watch" | "risk";
  label: string;
  isNew: boolean;
  signals: { key: string; label: string; points: number; max: number; reason?: string; action?: string }[];
  actions: string[];
};

const TONE: Record<Health["level"], { pill: string; bar: string; ring: string }> = {
  good: { pill: "bg-emerald-50 text-emerald-800 ring-emerald-200", bar: "bg-emerald-500", ring: "ring-emerald-200" },
  watch: { pill: "bg-amber-50 text-amber-800 ring-amber-200", bar: "bg-amber-500", ring: "ring-amber-200" },
  risk: { pill: "bg-red-50 text-red-700 ring-red-200", bar: "bg-red-500", ring: "ring-red-200" },
};

export function HealthBadge({ h }: { h?: Health | null }) {
  if (!h) return <span className="text-xs text-muted">—</span>;
  const t = TONE[h.level];
  return (
    <span title={h.actions[0] ?? h.label} className={"inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-bold ring-1 " + t.pill}>
      <span className="font-display text-sm">{h.score}</span>{h.label}{h.isNew ? <span className="font-normal">· nouveau</span> : null}
    </span>
  );
}

export function HealthPanel({ h }: { h: Health }) {
  const t = TONE[h.level];
  return (
    <section className={"rounded-lg bg-white p-4 ring-1 " + t.ring}>
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-display text-4xl font-extrabold text-ink">{h.score}<span className="text-base font-bold text-muted">/100</span></p>
        <div>
          <h2 className="font-display text-lg font-bold text-ink">Santé du compte</h2>
          <HealthBadge h={h} />
        </div>
      </div>
      <div className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
        {h.signals.map((s) => (
          <div key={s.key}>
            <div className="flex justify-between text-xs"><span className="font-semibold text-ink">{s.label}</span><span className="text-muted">{s.points}/{s.max}</span></div>
            <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className={"h-1.5 rounded-full " + (s.points === s.max ? "bg-emerald-500" : t.bar)} style={{ width: `${Math.round((s.points / s.max) * 100)}%` }} /></div>
            {s.reason ? <p className="mt-1 text-xs text-slate-600">{s.reason}</p> : null}
          </div>
        ))}
      </div>
      {h.actions.length ? (
        <div className="mt-4 rounded-md bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">À faire en priorité</p>
          <ol className="mt-1 list-decimal space-y-0.5 pl-5 text-sm text-ink">{h.actions.map((a) => <li key={a}>{a}</li>)}</ol>
        </div>
      ) : <p className="mt-4 text-sm text-emerald-700">Tout va bien : un appel de suivi suffit.</p>}
    </section>
  );
}
