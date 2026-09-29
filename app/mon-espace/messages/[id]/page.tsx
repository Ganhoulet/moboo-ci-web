import Link from "next/link";
import { notFound } from "next/navigation";
import { ChatThread } from "@/components/chat-thread";
import { getConversation } from "../../actions";

export default async function Thread({ params }: { params: { id: string } }) {
  const c = await getConversation(params.id);
  if (!c) notFound();
  const phone = c.counterpart.phone ?? "";
  const digits = phone.replace(/[^0-9]/g, "");
  const wa = digits.startsWith("225") ? digits : `225${digits}`;
  const letter = (c.counterpart.name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="flex h-[calc(100dvh-12rem)] min-h-[480px] flex-col overflow-hidden rounded-2xl bg-slate-50 shadow-card lg:h-[calc(100dvh-10rem)]">
      {/* En-tête : interlocuteur + annonce concernée */}
      <div className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-3 sm:px-4">
        <Link href="/mon-espace/messages" aria-label="Retour aux messages" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 hover:bg-slate-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </Link>
        {c.counterpart.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.counterpart.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
        ) : (
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-800 font-bold text-white">{letter}</span>
        )}
        <div className="min-w-0 flex-1">
          {c.role === "client" && c.counterpart.username ? (
            <Link href={`/pro/${c.counterpart.username}`} className="block truncate font-semibold text-ink hover:underline">{c.counterpart.name}</Link>
          ) : (
            <p className="truncate font-semibold text-ink">{c.counterpart.name}</p>
          )}
          <p className="truncate text-xs text-muted">{c.role === "owner" ? "Intéressé par votre annonce" : "Annonceur"}</p>
        </div>
        {c.role === "owner" && digits ? (
          <div className="flex shrink-0 gap-1.5">
            <a href={`tel:${phone}`} aria-label="Appeler" className="grid h-9 w-9 place-items-center rounded-full bg-brand-800 text-white">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" strokeLinejoin="round" /></svg>
            </a>
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" className="grid h-9 w-9 place-items-center rounded-full bg-[#25D366] text-xs font-bold text-white">WA</a>
          </div>
        ) : null}
      </div>

      {c.listingId ? (
        <Link href={`/annonce/${c.listingId}`} className="flex items-center gap-3 border-b border-slate-200 bg-white/70 px-4 py-2 text-sm hover:bg-white">
          {c.listingPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={c.listingPhoto} alt="" className="h-9 w-12 shrink-0 rounded-md object-cover" />
          ) : null}
          <span className="min-w-0 flex-1 truncate font-medium text-ink">{c.listingTitle ?? "Voir l'annonce"}</span>
          <span className="shrink-0 text-xs font-semibold text-brand-800">Voir l'annonce ↗</span>
        </Link>
      ) : null}

      <ChatThread conversationId={c.id} messages={c.messages} />
    </div>
  );
}
