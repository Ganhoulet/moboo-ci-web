"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { VerificationDeadline } from "@/app/mon-espace/actions";

const KEY = "moboo:verif-bar-hidden";

/** Barre de décompte : bleue, orange les 7 derniers jours, rouge une fois le délai dépassé (non masquable). */
export function VerificationDeadlineBar({ d, docs }: { d: VerificationDeadline; docs: string[] }) {
  const path = usePathname() || "/";
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    try { if (sessionStorage.getItem(KEY) === "1") setHidden(true); } catch { /* stockage indisponible */ }
  }, []);
  if (path.startsWith("/admin") || path.startsWith("/mon-espace/verification")) return null;
  const urgent = d.overdue || d.daysLeft <= 7;
  if (hidden && !urgent) return null;

  const tone = d.pending ? "bg-sky-50 text-sky-900 border-sky-200"
    : d.overdue ? "bg-red-600 text-white border-red-700"
    : urgent ? "bg-amber-50 text-amber-900 border-amber-300"
    : "bg-brand-50 text-brand-900 border-brand-100";
  const date = new Date(d.at).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
  const pct = Math.min(100, Math.max(0, Math.round(((d.days - d.daysLeft) / d.days) * 100)));
  const title = d.pending ? "Identification en cours d’examen"
    : d.overdue ? "Délai pour vous identifier dépassé"
    : `Identifiez-vous : ${d.daysLeft} jour${d.daysLeft > 1 ? "s" : ""} restant${d.daysLeft > 1 ? "s" : ""}`;
  const text = d.pending ? "Merci ! L’équipe Moboo vérifie votre pièce."
    : d.overdue ? (d.action === "block_publish" ? "Envoyez votre pièce d’identité pour publier de nouveau." : "Envoyez votre pièce d’identité dès maintenant.")
    : `Avant le ${date}${docs.length ? ` : ${docs.join(", ")}…` : ""}`;

  return (
    <div role="status" className={`border-b print:hidden ${tone}`}>
      <div className="container-page flex items-center gap-3 py-2 text-sm">
        <span className={"grid h-8 w-8 shrink-0 place-items-center rounded-full " + (d.overdue ? "bg-white/20" : "bg-white shadow-sm")} aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.6-1.4 1.7-2 3-2s2.4.6 3 2M14 10h4M14 13h3" strokeLinecap="round" /></svg>
        </span>
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block font-bold">{title}</span>
          <span className={"block truncate text-xs " + (d.overdue ? "text-red-50" : "opacity-80")}>{text}</span>
          {!d.pending && !d.overdue ? (
            <span className="mt-1 block h-1 overflow-hidden rounded-full bg-black/10" aria-hidden="true">
              <span className={"block h-full rounded-full " + (urgent ? "bg-amber-500" : "bg-brand-700")} style={{ width: `${pct}%` }} />
            </span>
          ) : null}
        </span>
        {d.pending ? null : (
          <Link href="/mon-espace/verification" className={"shrink-0 rounded-lg px-3 py-1.5 text-xs font-bold " + (d.overdue ? "bg-white text-red-700" : "bg-brand-800 text-white")}>
            M’identifier
          </Link>
        )}
        {urgent ? null : (
          <button type="button" aria-label="Masquer" className="shrink-0 rounded p-1 opacity-60 hover:opacity-100"
            onClick={() => { setHidden(true); try { sessionStorage.setItem(KEY, "1"); } catch { /* ignoré */ } }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}
