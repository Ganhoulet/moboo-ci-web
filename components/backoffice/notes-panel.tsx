"use client";

import { useState, useTransition } from "react";
import { addNoteAction, removeNoteAction, type AdminNote } from "@/app/admin/backoffice-actions";
import { fmtDateTime } from "./ui";

/** Notes internes de l'équipe (jamais visibles par l'utilisateur). */
export function NotesPanel({ type, id, initial, meId }: { type: "account" | "listing"; id: string; initial: AdminNote[]; meId?: string }) {
  const [notes, setNotes] = useState(initial);
  const [text, setText] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="space-y-3">
      <form onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await addNoteAction(type, id, text);
          if (r.ok && r.data) { setNotes([r.data, ...notes]); setText(""); setErr(null); } else setErr(r.error ?? "Note non enregistrée.");
        });
      }}>
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex. appelé le 30/09 : dit avoir été piraté, à surveiller." className="input text-sm" required />
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className="text-xs text-muted">Visible uniquement par l’équipe.</span>
          <button disabled={pending || !text.trim()} className="rounded-md bg-brand-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-800 disabled:opacity-50">Ajouter la note</button>
        </div>
        {err ? <p className="mt-1 text-sm text-red-600">{err}</p> : null}
      </form>
      {notes.length ? (
        <ul className="space-y-2">
          {notes.map((n) => (
            <li key={n.id} className="rounded-md bg-amber-50/70 p-3 text-sm ring-1 ring-amber-100">
              <p className="whitespace-pre-line text-ink">{n.body}</p>
              <p className="mt-1 flex items-center justify-between gap-2 text-xs text-muted">
                <span>{n.authorName ?? "—"} · {fmtDateTime(n.createdAt)}</span>
                {!meId || !n.authorId || n.authorId === meId ? (
                  <button type="button" className="font-semibold text-slate-500 hover:text-red-600" disabled={pending}
                    onClick={() => window.confirm("Supprimer cette note ?") && start(async () => {
                      const r = await removeNoteAction(n.id);
                      if (r.ok) setNotes(notes.filter((x) => x.id !== n.id)); else setErr(r.error ?? "Suppression impossible.");
                    })}>Supprimer</button>
                ) : null}
              </p>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted">Aucune note pour l’instant.</p>}
    </div>
  );
}
