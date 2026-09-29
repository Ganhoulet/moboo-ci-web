"use client";

import { useEffect, useState, useTransition } from "react";
import { previewEmailAction, testEmailAction } from "@/app/admin/actions";

/**
 * Aperçu d'un e-mail (valeurs d'exemple) qui suit les modifications non
 * enregistrées, + « Envoyer un test ». `template` = modèle à afficher ;
 * pour la mise en page commune, `emails` porte les valeurs en cours.
 */
export function EmailPreview({ template, hasAdmin, section, emails, smtpConfigured }: {
  template: string; hasAdmin: boolean;
  section?: Record<string, unknown>; emails?: Record<string, unknown>;
  smtpConfigured: boolean;
}) {
  const [audience, setAudience] = useState<"user" | "admin">("user");
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [to, setTo] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [sending, start] = useTransition();
  const key = JSON.stringify({ template, audience, section, emails });

  useEffect(() => {
    let alive = true;
    const t = setTimeout(async () => {
      const r = await previewEmailAction({ template, audience, section, emails });
      if (!alive) return;
      if (r.ok && r.html) { setPreview({ subject: r.subject ?? "", html: r.html }); setError(null); }
      else setError(r.error ?? "Aperçu indisponible.");
    }, 500);
    return () => { alive = false; clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-slate-50 px-4 py-3">
        <h2 className="font-display font-bold text-ink">Aperçu</h2>
        {hasAdmin ? (
          <div className="inline-flex overflow-hidden rounded-md border border-slate-300 text-sm font-semibold">
            {(["user", "admin"] as const).map((a, i) => (
              <button key={a} type="button" onClick={() => setAudience(a)}
                className={(i ? "border-l border-slate-300 " : "") + "px-3 py-1.5 " + (audience === a ? "bg-brand-700 text-white" : "bg-white text-ink hover:bg-slate-50")}>
                {a === "user" ? "Utilisateur" : "Administrateur"}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      {!smtpConfigured ? (
        <p className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-900">
          Le serveur d’e-mails (SMTP) n’est pas encore configuré sur l’API : les modèles sont prêts, mais aucun e-mail ne part.
        </p>
      ) : null}
      <div className="px-4 py-3 text-sm">
        <span className="text-muted">Objet : </span>
        <span className="font-semibold text-ink">{preview?.subject ?? "…"}</span>
      </div>
      {error ? <p className="px-4 pb-3 text-sm font-medium text-red-600">{error}</p> : null}
      <iframe title="Aperçu de l’e-mail" sandbox="" srcDoc={preview?.html ?? ""} className="h-[520px] w-full border-t border-slate-200 bg-[#eef2f7]" />
      <form className="flex flex-wrap items-center gap-2 border-t border-slate-200 px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            setMsg(null);
            const r = await testEmailAction({ template, audience, section, emails, to: to.trim() || undefined });
            setMsg({ ok: r.ok, text: r.message });
          });
        }}>
        <input type="email" className="input min-w-[12rem] flex-1 py-2 text-sm" placeholder="Adresse de test (par défaut : la vôtre)" value={to} onChange={(e) => setTo(e.target.value)} />
        <button type="submit" disabled={sending} className="rounded-md border border-brand-700 bg-white px-4 py-2 text-sm font-semibold text-brand-800 hover:bg-brand-50 disabled:opacity-50">
          {sending ? "Envoi…" : "Envoyer un test"}
        </button>
        {msg ? <p className={"w-full text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
      </form>
    </section>
  );
}
