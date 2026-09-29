"use client";

/** « Imprimer / enregistrer en PDF » (boîte d'impression du navigateur). */
export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-full bg-brand-800 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-900 print:hidden">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2" /><rect x="6" y="14" width="12" height="7" /></svg>
      Imprimer / PDF
    </button>
  );
}
