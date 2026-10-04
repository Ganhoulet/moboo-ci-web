/** Badges de confiance : « Identité vérifiée » (pièce + selfie) et « Pro vérifié » (RCCM, agrément…). */
export function VerifiedBadge({ tone = "light", kind = "identity" }: { tone?: "light" | "dark"; kind?: "identity" | "business" }) {
  const biz = kind === "business";
  const cls = tone === "dark"
    ? (biz ? "bg-violet-400/25 text-violet-50 ring-1 ring-violet-200/50" : "bg-emerald-400/20 text-emerald-100 ring-1 ring-emerald-300/40")
    : (biz ? "bg-violet-50 text-violet-800 ring-1 ring-violet-200" : "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200");
  return (
    <span title={biz ? "Activité professionnelle vérifiée par Moboo (registre du commerce, agrément…)" : "Identité vérifiée par Moboo (pièce d’identité et selfie)"}
      className={"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold " + cls}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      {biz ? "Pro vérifié" : "Identité vérifiée"}
    </span>
  );
}
