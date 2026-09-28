import Link from "next/link";
import type { Host } from "@/lib/types";

/**
 * Briques communes des fiches (annonce, résidence meublée, espace événementiel),
 * sur le modèle de la fiche bien de l'appli Moboo.ci : caractéristiques clés,
 * équipements, vidéo, hôte, conditions, fil d'Ariane.
 */

const sv = { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2 } as const;
const lj = { strokeLinecap: "round", strokeLinejoin: "round" } as const;

export const Icons = {
  home: <svg {...sv}><path d="M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5" {...lj} /></svg>,
  bed: <svg {...sv}><path d="M3 7v10M21 11v6M3 12h18v-1a3 3 0 0 0-3-3H8a3 3 0 0 0-3 3" {...lj} /></svg>,
  bath: <svg {...sv}><path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-3ZM6 12V6a2 2 0 0 1 2-2h1M18 20l1 2M6 20l-1 2" {...lj} /></svg>,
  car: <svg {...sv}><path d="M5 13 6.5 8h11L19 13M4 17h16v-4H4zM7 17v2M17 17v2" {...lj} /></svg>,
  area: <svg {...sv}><path d="M4 4h16v16H4z M4 9h16M9 4v16" {...lj} /></svg>,
  cal: <svg {...sv}><path d="M4 6h16v14H4zM4 10h16M8 3v4M16 3v4" {...lj} /></svg>,
  users: <svg {...sv}><path d="M16 20v-1.5a3.5 3.5 0 0 0-3.5-3.5h-5A3.5 3.5 0 0 0 4 18.5V20M10 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM20 20v-1.5a3.5 3.5 0 0 0-2.5-3.35M15.5 4.15a3.5 3.5 0 0 1 0 6.7" {...lj} /></svg>,
  clock: <svg {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" {...lj} /></svg>,
  shield: <svg {...sv}><path d="M12 3 5 6v5c0 4.5 3 8.3 7 10 4-1.7 7-5.5 7-10V6l-7-3Z" {...lj} /></svg>,
  wallet: <svg {...sv}><path d="M4 7h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4V7Zm0 0V5.5A1.5 1.5 0 0 1 5.5 4H16v3M16 13.5h.01" {...lj} /></svg>,
  door: <svg {...sv}><path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18M15 12h.01" {...lj} /></svg>,
  tag: <svg {...sv}><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9ZM8 8h.01" {...lj} /></svg>,
  layers: <svg {...sv}><path d="m12 3 9 5-9 5-9-5 9-5ZM3 13l9 5 9-5" {...lj} /></svg>,
};

export type Fact = { icon: React.ReactNode; label: string; value: string };

/** Grille des caractéristiques clés (« valued features » de l'appli). */
export function KeyFacts({ items }: { items: Fact[] }) {
  if (!items.length) return null;
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((s) => (
        <div key={s.label} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-800">{s.icon}</span>
          <span className="min-w-0">
            <span className="block text-xs text-muted">{s.label}</span>
            <span className="block font-semibold leading-tight text-ink">{s.value}</span>
          </span>
        </div>
      ))}
    </section>
  );
}

export function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

/** Liste à coches (équipements, services inclus…). */
export function FeatureList({ items }: { items: string[] }) {
  const list = Array.from(new Set(items.map((s) => s.trim()).filter(Boolean)));
  if (!list.length) return null;
  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
      {list.map((f) => (
        <span key={f} className="flex items-center gap-2 text-sm text-slate-600">
          <svg className="shrink-0 text-accent-600" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
            <path d="m5 12 4 4 10-10" {...lj} />
          </svg>
          {f}
        </span>
      ))}
    </div>
  );
}

/** Extrait l'ID YouTube d'une URL (watch?v=, youtu.be, embed, shorts, live). */
export function youtubeId(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Vidéo de présentation : lecteur YouTube intégré, sinon lien (TikTok, Facebook…). */
export function VideoSection({ url }: { url?: string | null }) {
  if (!url || !/^https?:\/\//i.test(url)) return null;
  const yt = youtubeId(url);
  return (
    <Section title="Vidéo">
      {yt ? (
        <div className="aspect-video overflow-hidden rounded-2xl border border-slate-200 bg-black">
          <iframe
            title="Vidéo de présentation"
            src={`https://www.youtube-nocookie.com/embed/${yt}`}
            loading="lazy"
            allowFullScreen
            className="h-full w-full"
            style={{ border: 0 }}
          />
        </div>
      ) : (
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-ghost inline-flex">
          Voir la vidéo de présentation ↗
        </a>
      )}
    </Section>
  );
}

/** « IREHERMANN » / « jean » → « Irehermann » / « Jean ». */
export function displayName(name: string) {
  return name
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (_, sep: string, c: string) => sep + c.toUpperCase());
}

/** Carte hôte des fiches réservables — sans coordonnées (révélées après l'acompte). */
export function HostCard({ host, noun }: { host: Host; noun: "logement" | "espace" }) {
  const name = displayName(host.name);
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      {host.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={host.avatarUrl} alt="" className="h-14 w-14 shrink-0 rounded-full object-cover" />
      ) : (
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-brand-800 font-display text-xl font-bold text-white">
          {name.charAt(0)}
        </span>
      )}
      <div className="min-w-0">
        <p className="font-display text-base font-bold text-ink">Proposé par {name}</p>
        <p className="text-sm text-muted">
          {host.listingsCount > 1 ? `${host.listingsCount} ${noun}s sur Moboo.ci` : `Hôte Moboo.ci`}
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Les échanges et le paiement passent par Moboo.ci : les coordonnées de l'hôte et
          l'adresse exacte vous sont transmises dès que l'acompte est réglé.
        </p>
      </div>
    </div>
  );
}

/** Conditions de réservation (étapes façon Airbnb). */
export function BookingSteps({ steps }: { steps: { title: string; text: string }[] }) {
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => (
        <li key={s.title} className="flex gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-600 text-sm font-bold text-white">{i + 1}</span>
          <span>
            <span className="block font-semibold text-ink">{s.title}</span>
            <span className="block text-sm text-slate-600">{s.text}</span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={it.label + i} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden>›</span> : null}
            {it.href ? (
              <Link href={it.href} className="font-semibold hover:text-ink">{it.label}</Link>
            ) : (
              <span className="line-clamp-1 text-slate-500">{it.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Référence + date de mise à jour (comme l'appli). */
export function DetailMeta({ reference, updatedAt, views }: { reference?: number | string | null; updatedAt?: string; views?: number }) {
  const date = updatedAt ? new Date(updatedAt) : null;
  const parts = [
    reference ? `Réf. ${reference}` : null,
    date && !Number.isNaN(date.getTime())
      ? `Mis à jour le ${date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
      : null,
    views && views > 10 ? `${views} vues` : null,
  ].filter(Boolean);
  if (!parts.length) return null;
  return <p className="text-xs text-muted">{parts.join(" · ")}</p>;
}

/** Données structurées (SEO) : injectées telles quelles dans la page. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // Échappe « < » pour qu'un texte d'annonce ne puisse pas fermer la balise.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}

export const PinIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 21s-7-5.2-7-11a7 7 0 1 1 14 0c0 5.8-7 11-7 11Z" strokeLinejoin="round" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);
