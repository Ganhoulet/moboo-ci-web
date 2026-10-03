"use client";

import { useEffect } from "react";
import { reportErrorAction } from "./error-actions";

/** Erreur dans la mise en page elle-même (dernier recours) : page minimale autonome. */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    void reportErrorAction({ message: `[layout] ${error.message}`, digest: error.digest, path: window.location.pathname, stack: error.stack?.slice(0, 4000) });
  }, [error]);
  return (
    <html lang="fr">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "80px 16px", color: "#0f172a" }}>
        <h1 style={{ fontSize: 24 }}>Un problème est survenu</h1>
        <p style={{ color: "#64748b" }}>L’équipe Moboo est prévenue. Réessayez dans un instant.</p>
        <button type="button" onClick={() => reset()} style={{ marginTop: 16, padding: "10px 20px", borderRadius: 999, border: 0, background: "#ea580c", color: "#fff", fontWeight: 700 }}>Réessayer</button>
      </body>
    </html>
  );
}
