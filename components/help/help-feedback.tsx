"use client";

import { useEffect, useState } from "react";
import { helpFeedbackAction, helpViewAction } from "@/app/aide/actions";

/** « Cet article vous a-t-il aidé ? » + comptage de la lecture (une fois par jour). */
export function HelpFeedback({ slug }: { slug: string }) {
  const [done, setDone] = useState<null | boolean>(null);
  useEffect(() => {
    const key = `moboo_help_${slug}`;
    const today = new Date().toISOString().slice(0, 10);
    try {
      if (localStorage.getItem(key) === today) return;
      localStorage.setItem(key, today);
    } catch { /* navigation privée */ }
    void helpViewAction(slug).catch(() => {});
  }, [slug]);
  const vote = (v: boolean) => { setDone(v); void helpFeedbackAction(slug, v).catch(() => {}); };
  return (
    <div className="mt-10 rounded-2xl bg-slate-50 p-5 text-center ring-1 ring-slate-200">
      {done === null ? (
        <>
          <p className="font-semibold text-ink">Cet article vous a-t-il aidé ?</p>
          <div className="mt-3 flex justify-center gap-3">
            <button type="button" onClick={() => vote(true)} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink ring-1 ring-slate-300 hover:bg-emerald-50 hover:ring-emerald-300">👍 Oui</button>
            <button type="button" onClick={() => vote(false)} className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-ink ring-1 ring-slate-300 hover:bg-red-50 hover:ring-red-300">👎 Non</button>
          </div>
        </>
      ) : done ? (
        <p className="font-semibold text-emerald-700">Merci pour votre retour ! 🙏</p>
      ) : (
        <p className="text-sm text-slate-700"><strong>Merci, nous allons améliorer cet article.</strong> Besoin d’aide tout de suite ? Contactez-nous ci-dessous.</p>
      )}
    </div>
  );
}
