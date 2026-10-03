"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reportErrorAction } from "./error-actions";

/** Erreur dans une page : message clair au visiteur, erreur transmise à l'équipe. */
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void reportErrorAction({ message: error.message, digest: error.digest, path: window.location.pathname, stack: error.stack?.slice(0, 4000) });
  }, [error]);
  return (
    <div className="bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-xl px-4 text-center">
        <p className="text-5xl">😕</p>
        <h1 className="mt-3 font-display text-2xl font-extrabold text-ink">Un problème est survenu</h1>
        <p className="mt-2 text-muted">L’équipe Moboo est prévenue automatiquement. Réessayez dans un instant.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" onClick={() => reset()} className="btn-primary bg-accent-600 hover:bg-accent-700">Réessayer</button>
          <Link href="/" className="btn-ghost">Accueil</Link>
        </div>
        {error.digest ? <p className="mt-6 text-xs text-slate-400">Référence : {error.digest}</p> : null}
      </div>
    </div>
  );
}
