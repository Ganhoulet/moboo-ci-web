import type { Metadata } from "next";
import { ProStoreButtons } from "@/components/pro-invitation/store-buttons";

export const metadata: Metadata = { title: "Demande de dossier — Moboo Pro", robots: { index: false, follow: false } };

/** Lien de demande de dossier : il s'ouvre dans l'application Moboo Pro (lien universel), sinon on propose de l'installer. */
export default function Dossier() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-card ring-1 ring-slate-200">
        <p className="text-4xl" aria-hidden="true">📄</p>
        <h1 className="mt-3 font-display text-xl font-extrabold text-ink">Demande de dossier</h1>
        <p className="mt-2 text-sm text-muted">Complétez votre dossier directement depuis l’application Moboo Pro. Si elle est installée, ce lien l’ouvre automatiquement.</p>
        <ProStoreButtons />
      </div>
    </div>
  );
}
