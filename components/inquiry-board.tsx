"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { INQUIRY_STEPS } from "@/lib/accounts";
import { openInquiryConversationAction, updateInquiryAction, type Inquiry } from "@/app/mon-espace/actions";
import { USER_TYPES } from "@/lib/api";
const USER_TYPE_LABEL = Object.fromEntries(USER_TYPES);

/**
 * Suivi des demandes (reprise du « Board » CRM de moboo.ci) : colonnes par
 * étape sur ordinateur, liste filtrable sur mobile ; changement d'étape, note,
 * appel et WhatsApp en un geste.
 */
export function InquiryBoard({ items: initial }: { items: Inquiry[] }) {
  const [items, setItems] = useState(initial);
  const [filter, setFilter] = useState<string>("all");
  const [open, setOpen] = useState<string | null>(null);

  const byStep = useMemo(() => {
    const m: Record<string, Inquiry[]> = {};
    for (const s of INQUIRY_STEPS) m[s.key] = [];
    for (const q of items) (m[q.status] ?? m.new).push(q);
    return m;
  }, [items]);

  const patch = (id: string, p: Partial<Inquiry>) => setItems((xs) => xs.map((q) => (q.id === id ? { ...q, ...p } : q)));
  const list = filter === "all" ? items : items.filter((q) => q.status === filter);

  return (
    <>
      {/* Mobile : filtres + liste */}
      <div className="lg:hidden">
        <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 [scrollbar-width:none] sm:-mx-6 sm:px-6 [&::-webkit-scrollbar]:hidden">
          {[{ key: "all", label: "Toutes", color: "bg-ink" }, ...INQUIRY_STEPS].map((s) => {
            const n = s.key === "all" ? items.length : byStep[s.key]?.length ?? 0;
            return (
              <button key={s.key} type="button" onClick={() => setFilter(s.key)}
                className={"inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-semibold " + (filter === s.key ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-slate-600")}>
                <span className={`h-2 w-2 rounded-full ${s.color}`} /> {s.label} <span className="opacity-60">{n}</span>
              </button>
            );
          })}
        </div>
        <div className="space-y-3">
          {list.map((q) => <Card key={q.id} q={q} open={open === q.id} onToggle={() => setOpen(open === q.id ? null : q.id)} onPatch={(p) => patch(q.id, p)} />)}
        </div>
      </div>

      {/* Desktop : colonnes par étape */}
      <div className="hidden gap-3 overflow-x-auto pb-3 lg:flex">
        {INQUIRY_STEPS.map((s) => (
          <div key={s.key} className="w-64 shrink-0 self-start rounded-2xl bg-slate-100/70 p-2">
            <div className="flex items-center gap-2 px-1.5 py-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${s.color}`} />
              <span className="text-sm font-bold text-ink">{s.label}</span>
              <span className="ml-auto rounded-full bg-white px-2 text-xs font-semibold text-slate-500">{byStep[s.key].length}</span>
            </div>
            <div className="mt-1 space-y-2">
              {byStep[s.key].map((q) => <Card key={q.id} q={q} compact open={open === q.id} onToggle={() => setOpen(open === q.id ? null : q.id)} onPatch={(p) => patch(q.id, p)} />)}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function Card({ q, compact, open, onToggle, onPatch }: {
  q: Inquiry; compact?: boolean; open: boolean; onToggle: () => void; onPatch: (p: Partial<Inquiry>) => void;
}) {
  const [note, setNote] = useState(q.note ?? "");
  const [pending, start] = useTransition();
  const [opening, startOpen] = useTransition();
  const [chatError, setChatError] = useState<string | null>(null);
  const router = useRouter();
  const openChat = () => startOpen(async () => {
    setChatError(null);
    const r = await openInquiryConversationAction(q.id);
    if (r.ok && r.id) router.push(`/mon-espace/messages/${r.id}`);
    else setChatError(r.error ?? "Conversation indisponible.");
  });
  const digits = q.phone.replace(/[^0-9]/g, "");
  const wa = digits.startsWith("225") ? digits : `225${digits}`;
  const date = new Date(q.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  const setStatus = (status: string) => { onPatch({ status }); start(async () => { await updateInquiryAction(q.id, { status }); }); };
  const saveNote = () => { onPatch({ note }); start(async () => { await updateInquiryAction(q.id, { note }); }); };

  return (
    <div className={"rounded-xl bg-white shadow-sm ring-1 ring-slate-200/70 " + (compact ? "p-2.5" : "p-4")}>
      <button type="button" onClick={onToggle} className="block w-full text-left">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate font-semibold text-ink">{q.name}</p>
          <span className="shrink-0 text-[11px] text-muted">{date}</span>
        </div>
        <p className="truncate text-xs text-muted">
          {q.kind === "visit" ? `🗓 Visite${q.preferredDate ? ` · ${q.preferredDate}` : ""}` : "💬 Contact"} · {q.listingTitle ?? "Votre profil"}
        </p>
        {q.userType || q.source === "app" ? (
          <p className="mt-1 flex flex-wrap gap-1">
            {q.userType ? <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-800">{USER_TYPE_LABEL[q.userType] ?? q.userType}</span> : null}
            {q.source === "app" ? <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">📱 Application</span> : null}
          </p>
        ) : null}
        {!open && q.note ? <p className="mt-1 truncate text-xs italic text-slate-500">📝 {q.note}</p> : null}
      </button>

      {open ? (
        <div className="mt-3 space-y-3 border-t border-slate-100 pt-3">
          {q.message ? <p className="whitespace-pre-line text-sm text-slate-600">{q.message}</p> : null}
          <button type="button" onClick={openChat} disabled={opening}
            className="btn-primary w-full bg-brand-800 py-2 text-sm hover:bg-brand-900 disabled:opacity-60">
            {opening ? "Ouverture…" : "💬 Répondre dans Messages"}
          </button>
          {chatError ? <p className="text-xs font-medium text-red-600">{chatError}</p> : null}
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${q.phone}`} className="rounded-full bg-brand-800 px-3 py-1.5 text-xs font-semibold text-white">📞 Appeler</a>
            <a href={`https://wa.me/${wa}?text=${encodeURIComponent(`Bonjour ${q.name}, suite à votre demande sur Moboo.ci concernant « ${q.listingTitle ?? "votre recherche"} »…`)}`}
              target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366] px-3 py-1.5 text-xs font-semibold text-white">WhatsApp</a>
            {q.email ? <a href={`mailto:${q.email}`} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-ink">E-mail</a> : null}
          </div>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">Étape</span>
            <select className="input py-2 text-sm" value={q.status} onChange={(e) => setStatus(e.target.value)} disabled={pending}>
              {INQUIRY_STEPS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink">Note privée</span>
            <textarea className="input min-h-[70px] text-sm" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex. rappeler lundi, budget 200 000 F…" />
          </label>
          <button type="button" onClick={saveNote} disabled={pending || note === (q.note ?? "")}
            className="btn-primary w-full bg-accent-600 py-2 text-sm hover:bg-accent-700 disabled:opacity-50">
            {pending ? "Enregistrement…" : "Enregistrer la note"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
