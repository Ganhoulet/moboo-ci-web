/** Mise en page commune des formulaires publics des conseillers Moboo Pro. */
export function CaptureShell({ agentName, children }: { agentName: string | null; children: React.ReactNode }) {
  return (
    <div className="min-h-[70vh] bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-xl rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">
        {agentName ? (
          <div className="mb-5 flex items-center gap-3 rounded-xl bg-brand-50 p-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-800 font-bold text-white" aria-hidden="true">{agentName.slice(0, 1).toUpperCase()}</span>
            <span className="text-sm"><strong className="block text-ink">{agentName}</strong><span className="text-muted">Conseiller immobilier — Moboo.ci</span></span>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

export function InvalidLink() {
  return (
    <CaptureShell agentName={null}>
      <h1 className="font-display text-xl font-extrabold text-ink">Lien invalide ou expiré</h1>
      <p className="mt-2 text-sm text-slate-600">Demandez à votre conseiller de vous renvoyer son lien, ou faites votre recherche directement sur Moboo.ci.</p>
    </CaptureShell>
  );
}
