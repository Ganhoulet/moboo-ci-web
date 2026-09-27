import type { ListingItem } from "@/lib/types";

type Agent = NonNullable<ListingItem["agent"]>;

function initials(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "•";
}

export function AgentCard({ agent }: { agent: Agent }) {
  const phoneDigits = (agent.whatsapp || agent.phone || "").replace(/[^0-9]/g, "");
  const subtitle = agent.kind === "agency"
    ? "Agence"
    : [agent.position, agent.company].filter(Boolean).join(" · ") || "Agent";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
        {agent.kind === "agency" ? "Agence" : "Votre interlocuteur"}
      </p>
      <div className="flex items-center gap-3">
        {agent.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={agent.photoUrl} alt={agent.name} className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-800 text-sm font-bold text-white">
            {initials(agent.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{agent.name}</p>
          <p className="truncate text-sm text-muted">{subtitle}</p>
        </div>
      </div>

      {agent.serviceArea ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" strokeLinejoin="round" /><circle cx="12" cy="10" r="2.5" /></svg>
          {agent.serviceArea}
        </p>
      ) : null}

      {phoneDigits ? (
        <div className="mt-4 grid gap-2">
          <a href={`tel:${agent.phone || agent.whatsapp}`} className="btn-primary w-full bg-brand-800 hover:bg-brand-900">Appeler</a>
          <a href={`https://wa.me/${phoneDigits}`} className="btn-ghost w-full" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </div>
      ) : null}
    </div>
  );
}
