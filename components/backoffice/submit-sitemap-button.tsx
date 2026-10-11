"use client";

import { useState, useTransition } from "react";
import { submitSitemapAction } from "@/app/admin/seo/console/actions";

export function SubmitSitemapButton() {
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center gap-2">
      {msg ? <span className="text-xs text-muted">{msg}</span> : null}
      <button type="button" disabled={pending} onClick={() => start(async () => { const r = await submitSitemapAction(); setMsg(r.ok ? `Envoyé : ${r.sitemap}` : r.error ?? "Envoi impossible."); })}
        className="rounded-md bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">{pending ? "Envoi…" : "Envoyer le plan du site"}</button>
    </div>
  );
}
