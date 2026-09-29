/** Badge « Vérifié » (pièce justificative validée par Moboo). */
export function VerifiedBadge({ tone = "light" }: { tone?: "light" | "dark" }) {
  return (
    <span title="Identité / activité vérifiée par Moboo"
      className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold " + (tone === "dark" ? "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/40" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200")}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      Vérifié
    </span>
  );
}
