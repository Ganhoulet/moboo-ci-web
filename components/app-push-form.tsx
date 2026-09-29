"use client";

import { useState, useTransition } from "react";
import { sendPushAction } from "@/app/admin/application/actions";

export function AppPushForm({ configured }: { configured: boolean }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("");
  const [segment, setSegment] = useState("all");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form className="space-y-3 rounded-lg bg-white p-5 shadow-sm ring-1 ring-slate-200"
      onSubmit={(e) => {
        e.preventDefault();
        if (!window.confirm("Envoyer cette notification à tous les destinataires choisis ?")) return;
        start(async () => {
          setMsg(null);
          const r = await sendPushAction({ title, body, url: url || undefined, segment });
          setMsg(r.ok ? { ok: true, text: `Notification envoyée${r.recipients != null ? ` à ${r.recipients} appareil(s)` : ""}.` } : { ok: false, text: r.error ?? "Envoi impossible." });
          if (r.ok) { setTitle(""); setBody(""); setUrl(""); }
        });
      }}>
      <p className="font-semibold text-ink">Nouvelle notification</p>
      {!configured ? <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">Renseignez d’abord l’App ID et la clé REST OneSignal dans « Réglages ».</p> : null}
      <label className="block text-sm font-semibold">Titre<input className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} required /></label>
      <label className="block text-sm font-semibold">Message<textarea className="input mt-1" rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={300} required /></label>
      <label className="block text-sm font-semibold">Lien à l’ouverture (facultatif)<input className="input mt-1" type="url" placeholder="https://moboo.ci/annonce/…" value={url} onChange={(e) => setUrl(e.target.value)} /></label>
      <label className="block text-sm font-semibold">Destinataires
        <select className="input mt-1" value={segment} onChange={(e) => setSegment(e.target.value)}>
          <option value="all">Tous les abonnés</option>
          <option value="active">Utilisateurs actifs</option>
          <option value="inactive">Utilisateurs inactifs (relance)</option>
        </select>
      </label>
      <button disabled={pending || !configured} className="rounded-md bg-brand-700 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">{pending ? "Envoi…" : "Envoyer"}</button>
      {msg ? <p className={"text-sm font-medium " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</p> : null}
    </form>
  );
}
