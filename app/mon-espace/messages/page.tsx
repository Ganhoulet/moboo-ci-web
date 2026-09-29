import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/dashboard-ui";
import { getSession } from "@/lib/session";
import { isPublisher } from "@/lib/accounts";
import { listConversations, type ConversationSummary } from "../actions";
import { NotificationPermission } from "@/components/live-notifications";

function when(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  return d.toDateString() === today.toDateString()
    ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function Row({ c }: { c: ConversationSummary }) {
  const letter = (c.counterpart.name || "?").trim().charAt(0).toUpperCase();
  return (
    <Link href={`/mon-espace/messages/${c.id}`}
      className={"flex items-center gap-3 px-4 py-3 transition hover:bg-slate-50 " + (c.unread ? "bg-brand-50/40" : "")}>
      <div className="relative shrink-0">
        {c.counterpart.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.counterpart.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-800 font-bold text-white">{letter}</span>
        )}
        {c.listingPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.listingPhoto} alt="" className="absolute -bottom-1 -right-1 h-6 w-6 rounded-md object-cover ring-2 ring-white" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={"truncate text-ink " + (c.unread ? "font-bold" : "font-semibold")}>{c.counterpart.name}</p>
          <span className={"shrink-0 text-xs " + (c.unread ? "font-semibold text-accent-700" : "text-muted")}>{when(c.lastMessageAt)}</span>
        </div>
        <p className="truncate text-xs text-muted">
          {c.role === "owner" ? "Intéressé · " : "Annonceur · "}{c.listingTitle ?? "Annonce"}
        </p>
        <div className="flex items-center gap-2">
          <p className={"min-w-0 flex-1 truncate text-sm " + (c.unread ? "font-semibold text-ink" : "text-slate-500")}>{c.lastMessage ?? "—"}</p>
          {c.unread ? <span className="shrink-0 rounded-full bg-accent-600 px-2 py-0.5 text-[11px] font-bold text-white">{c.unread}</span> : null}
        </div>
      </div>
    </Link>
  );
}

export default async function Messages() {
  const account = getSession()!;
  const items = await listConversations();
  const publisher = isPublisher(account.accountType ?? "particulier");
  return (
    <div>
      <PageHeader
        title="Messages"
        sub={publisher
          ? "Échangez avec les personnes intéressées par vos annonces, et avec les annonceurs que vous avez contactés."
          : "Vos échanges avec les annonceurs que vous avez contactés depuis une annonce."}
        action={<NotificationPermission />}
      />
      {items.length ? (
        <div className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-card">
          {items.map((c) => <Row key={c.id} c={c} />)}
        </div>
      ) : (
        <EmptyState
          title="Aucune conversation"
          text={publisher
            ? "Chaque demande envoyée sur vos annonces ouvre une conversation ici. Vous pouvez aussi répondre depuis l'onglet Demandes."
            : "Envoyez une demande depuis une annonce : la conversation avec l'annonceur s'ouvre ici."}
          action={<Link href="/annonces" className="btn-primary bg-brand-800 hover:bg-brand-900">Explorer les annonces</Link>}
        />
      )}
    </div>
  );
}
