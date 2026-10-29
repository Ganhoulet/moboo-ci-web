"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { COMMUNES, PROPERTY_TYPES } from "@/lib/accounts";
import { uploadImageAction } from "@/app/mon-espace/actions";
import {
  createProfileAction, declareMandateAction, duplicatesAction, extractAction, publishAction, requestMandateAction, searchAgentsAction,
} from "@/app/admin/comptes/studio/actions";

type Mandate = { status: string; managerName: string; grantedAt: string | null; mine: boolean; canPublish: boolean } | null;
type Agent = { id: string; name: string; type: string; phone: string; whatsapp: string | null; commune: string | null; unclaimed: boolean; mandate: Mandate; listings: number; teamListings: number };
type Dup = { id: string; title: string; price: number; owner: string | null; sameAccount: boolean; url: string };
type Draft = {
  title: string; transaction: "rent" | "sale"; propertyType: string; furnished: boolean; price: string; priceUnit: string;
  city: string; commune: string; quartier: string; bedrooms: string; bathrooms: string; surface: string; features: string; description: string;
};

const EMPTY: Draft = { title: "", transaction: "rent", propertyType: "appartement", furnished: false, price: "", priceUnit: "month", city: "Abidjan", commune: "", quartier: "", bedrooms: "", bathrooms: "", surface: "", features: "", description: "" };
const TYPE_LABEL: Record<string, string> = { agent: "Agent", entreprise: "Agence", proprietaire: "Propriétaire" };
const input = "w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm";

/** Compresse une image dans le navigateur (1600 px max, JPEG ~75 %) → data URI. */
async function compress(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.75);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function MandateBadge({ m, unclaimed }: { m: Mandate; unclaimed: boolean }) {
  const chip = (cls: string, t: string) => <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>{t}</span>;
  return (
    <span className="flex flex-wrap gap-1">
      {!m ? chip("bg-slate-100 text-slate-600", "Pas d’accord")
        : m.status === "active" ? chip("bg-emerald-100 text-emerald-800", "Accord validé")
        : m.status === "declared" ? chip(m.canPublish ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-600", "Accord noté")
        : chip("bg-amber-100 text-amber-800", "Lien envoyé")}
      {unclaimed ? chip("bg-violet-100 text-violet-800", "Profil non récupéré") : null}
    </span>
  );
}

/**
 * Studio de publication : 1. annonceur (accord), 2. message WhatsApp → fiche par l'IA,
 * 3. photos et vérification, publication dans le compte de l'annonceur.
 */
export function GrowthStudio({ initialAgents, mode, allowUnclaimed, preselect }: { initialAgents: Agent[]; mode: string; allowUnclaimed: boolean; preselect: string | null }) {
  const [agents, setAgents] = useState<Agent[]>(initialAgents);
  const [q, setQ] = useState("");
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [agent, setAgent] = useState<Agent | null>(initialAgents.find((a) => a.id === preselect) ?? null);
  const [creating, setCreating] = useState(false);
  const [profile, setProfile] = useState<Record<string, string>>({ firstName: "", lastName: "", companyName: "", accountType: "agent", phone: "", whatsapp: "", commune: "", proof: "" });
  const [text, setText] = useState("");
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [missing, setMissing] = useState<string[]>([]);
  const [dups, setDups] = useState<Dup[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [msg, setMsg] = useState<{ tone: "ok" | "err"; text: string } | null>(null);
  const [done, setDone] = useState<{ url: string; wa: string | null; moderation?: string } | null>(null);
  const [pending, start] = useTransition();

  const canPublish = !!agent?.mandate?.canPublish;
  const set = (k: keyof Draft, v: string | boolean) => setDraft((d) => ({ ...d, [k]: v }));

  async function search(nextScope = scope, term = q) {
    const r = await searchAgentsAction(term, nextScope === "mine" ? "mine" : "");
    if (r.ok) {
      setAgents(r.data.items);
      if (agent) setAgent(r.data.items.find((a: Agent) => a.id === agent.id) ?? agent);
    } else setMsg({ tone: "err", text: r.error! });
  }
  const lastQuery = useRef("mine|"); // liste « Mes agents » déjà chargée par la page
  useEffect(() => {
    const key = `${scope}|${q}`;
    if (key === lastQuery.current || (q.length > 0 && q.length < 2)) return;
    const t = setTimeout(() => { lastQuery.current = key; void search(scope, q); }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, scope]);

  const refreshAgent = async (id: string) => {
    const r = await searchAgentsAction("", "mine");
    const found = r.ok ? (r.data.items as Agent[]).find((a) => a.id === id) : null;
    if (found) { setAgent(found); setAgents(r.data.items); }
  };

  function sendLink(a: Agent) {
    start(async () => {
      const r = await requestMandateAction(a.id);
      if (!r.ok) return setMsg({ tone: "err", text: r.error! });
      if (r.data.wa) window.open(r.data.wa, "_blank", "noopener");
      try { await navigator.clipboard.writeText(r.data.link); } catch { /* presse-papiers indisponible */ }
      setMsg({ tone: "ok", text: "Lien d’accord prêt : WhatsApp s’ouvre avec le message (lien aussi copié). L’agent valide en se connectant avec son numéro." });
      await refreshAgent(a.id);
    });
  }

  function declare(a: Agent) {
    const proof = window.prompt("Comment l’agent a-t-il donné son accord ? (ex. « OK par WhatsApp le 29/10 »)");
    if (!proof) return;
    start(async () => {
      const r = await declareMandateAction(a.id, proof);
      if (!r.ok) return setMsg({ tone: "err", text: r.error! });
      setMsg({ tone: "ok", text: "Accord noté : l’agent est prévenu et peut le retirer à tout moment." });
      await refreshAgent(a.id);
    });
  }

  function createProfile() {
    start(async () => {
      const r = await createProfileAction(profile);
      if (!r.ok) return setMsg({ tone: "err", text: r.error! });
      setCreating(false);
      setMsg({ tone: "ok", text: r.data.existing ? "Ce numéro a déjà un compte : il est sélectionné." : "Profil créé : l’agent le récupérera en se connectant avec son numéro." });
      setScope("mine");
      await refreshAgent(r.data.id);
    });
  }

  function fillWithAi() {
    start(async () => {
      setMsg(null);
      const r = await extractAction(text, agent?.id);
      if (!r.ok) return setMsg({ tone: "err", text: r.error! });
      const f = r.data.fields;
      setDraft({
        title: f.title || "", transaction: f.transaction === "sale" ? "sale" : "rent", propertyType: f.propertyType || "autre", furnished: !!f.furnished,
        price: f.price ? String(f.price) : "", priceUnit: f.priceUnit || "month", city: f.city || "Abidjan", commune: f.commune || "", quartier: f.quartier || "",
        bedrooms: f.bedrooms ? String(f.bedrooms) : "", bathrooms: f.bathrooms ? String(f.bathrooms) : "", surface: f.surface ? String(f.surface) : "",
        features: (f.features ?? []).join(", "), description: f.description || "",
      });
      setMissing(f.missing ?? []);
      setDups(r.data.duplicates ?? []);
    });
  }

  async function checkDuplicates() {
    if (!draft.commune) return;
    const r = await duplicatesAction({ transaction: draft.transaction, propertyType: draft.propertyType, commune: draft.commune, price: Number(draft.price) || 0, title: draft.title, accountId: agent?.id });
    if (r.ok) setDups(r.data);
  }

  async function addPhotos(files: FileList | File[] | null) {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/")).slice(0, 20 - photos.length);
    setUploading((n) => n + list.length);
    for (const f of list) {
      try {
        const r = await uploadImageAction(await compress(f), "annonce");
        if (r.ok && r.url) setPhotos((p) => [...p, r.url!]);
        else setMsg({ tone: "err", text: r.error ?? "Envoi de la photo impossible." });
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function publish() {
    if (!agent) return;
    start(async () => {
      setMsg(null);
      const r = await publishAction({
        accountId: agent.id, source: "whatsapp", photos,
        listing: {
          ...draft, price: Number(draft.price) || 0, bedrooms: Number(draft.bedrooms) || null, bathrooms: Number(draft.bathrooms) || null, surface: Number(draft.surface) || null,
          features: draft.features.split(",").map((x) => x.trim()).filter(Boolean),
        },
      });
      if (!r.ok) return setMsg({ tone: "err", text: r.error! });
      setDone({ url: r.data.url, wa: r.data.wa, moderation: r.data.moderation });
      setText(""); setDraft(EMPTY); setPhotos([]); setDups([]); setMissing([]);
      await refreshAgent(agent.id);
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
      {/* 1. Annonceur */}
      <section className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
        <h2 className="font-bold text-ink">1. Annonceur</h2>
        <div className="flex gap-1 text-xs">
          {(["mine", "all"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setScope(s)} className={"rounded-full px-3 py-1 font-semibold " + (scope === s ? "bg-ink text-white" : "bg-slate-100 text-slate-700")}>
              {s === "mine" ? "Mes agents" : "Tous les annonceurs"}
            </button>
          ))}
        </div>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, agence ou téléphone…" className={input} />
        <ul className="max-h-[420px] space-y-1 overflow-y-auto">
          {agents.map((a) => (
            <li key={a.id}>
              <button type="button" onClick={() => { setAgent(a); setDone(null); }}
                className={"w-full rounded-md p-2 text-left text-sm ring-1 " + (agent?.id === a.id ? "bg-brand-50 ring-brand-300" : "ring-slate-100 hover:bg-slate-50")}>
                <span className="block font-semibold text-ink">{a.name}</span>
                <span className="block text-xs text-muted">{TYPE_LABEL[a.type] ?? a.type} · {a.phone}{a.commune ? ` · ${a.commune}` : ""} · {a.listings} annonce(s){a.teamListings ? ` dont ${a.teamListings} par l’équipe` : ""}</span>
                <span className="mt-1 block"><MandateBadge m={a.mandate} unclaimed={a.unclaimed} /></span>
              </button>
            </li>
          ))}
          {!agents.length ? <li className="p-2 text-xs text-muted">{scope === "mine" ? "Aucun agent dans votre portefeuille Studio : cherchez dans « Tous les annonceurs » ou créez un profil." : "Aucun annonceur trouvé."}</li> : null}
        </ul>
        {allowUnclaimed ? (
          creating ? (
            <div className="space-y-2 rounded-md bg-slate-50 p-3 text-sm">
              <p className="font-semibold">Agent pas encore inscrit</p>
              <div className="grid grid-cols-2 gap-2">
                <input className={input} placeholder="Prénom" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} />
                <input className={input} placeholder="Nom" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} />
              </div>
              <input className={input} placeholder="Agence (facultatif)" value={profile.companyName} onChange={(e) => setProfile({ ...profile, companyName: e.target.value })} />
              <select className={input} value={profile.accountType} onChange={(e) => setProfile({ ...profile, accountType: e.target.value })}>
                <option value="agent">Agent immobilier</option><option value="entreprise">Agence immobilière</option><option value="proprietaire">Propriétaire</option>
              </select>
              <input className={input} placeholder="Téléphone (connexion)" inputMode="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
              <input className={input} placeholder="WhatsApp (si différent)" inputMode="tel" value={profile.whatsapp} onChange={(e) => setProfile({ ...profile, whatsapp: e.target.value })} />
              <input className={input} placeholder="Commune" list="studio-communes" value={profile.commune} onChange={(e) => setProfile({ ...profile, commune: e.target.value })} />
              {mode !== "link_only" ? <input className={input} placeholder="Accord reçu (ex. OK par WhatsApp le 29/10)" value={profile.proof} onChange={(e) => setProfile({ ...profile, proof: e.target.value })} /> : null}
              <div className="flex gap-2">
                <button type="button" disabled={pending} onClick={createProfile} className="rounded-md bg-brand-800 px-3 py-1.5 font-semibold text-white disabled:opacity-50">Créer le profil</button>
                <button type="button" onClick={() => setCreating(false)} className="rounded-md px-3 py-1.5 text-muted">Annuler</button>
              </div>
            </div>
          ) : <button type="button" onClick={() => setCreating(true)} className="w-full rounded-md border border-dashed border-slate-300 py-2 text-sm font-semibold text-brand-800">+ Agent pas encore inscrit</button>
        ) : null}
        <datalist id="studio-communes">{COMMUNES.map((c) => <option key={c} value={c} />)}</datalist>
      </section>

      <div className="space-y-4">
        {msg ? <p className={"rounded-lg p-3 text-sm " + (msg.tone === "ok" ? "bg-emerald-50 text-emerald-900" : "bg-red-50 text-red-800")}>{msg.text}</p> : null}

        {!agent ? (
          <p className="rounded-lg bg-white p-6 text-sm text-muted ring-1 ring-slate-200">Choisissez l’annonceur à gauche (ou créez son profil) pour publier pour lui.</p>
        ) : (
          <>
            <section className="flex flex-wrap items-center gap-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ink">{agent.name}</p>
                <p className="text-xs text-muted">{agent.mandate?.status === "pending" ? "Lien d’accord envoyé : en attente de sa validation." : agent.mandate ? `Accord ${agent.mandate.status === "active" ? "validé" : "noté"} par ${agent.mandate.managerName || "l’équipe"}` : "Aucun accord : envoyez le lien ou notez l’accord reçu par WhatsApp."}</p>
              </div>
              <MandateBadge m={agent.mandate} unclaimed={agent.unclaimed} />
              {agent.mandate?.status !== "active" ? (
                <>
                  <button type="button" disabled={pending} onClick={() => sendLink(agent)} className="rounded-md bg-[#25D366] px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50">Envoyer le lien d’accord</button>
                  {mode !== "link_only" ? <button type="button" disabled={pending} onClick={() => declare(agent)} className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold ring-1 ring-slate-300">Noter l’accord</button> : null}
                </>
              ) : null}
            </section>

            {done ? (
              <section className="space-y-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
                <p className="font-bold">Annonce publiée pour {agent.name}{done.moderation === "pending" ? " (en attente de modération)" : ""}.</p>
                <div className="flex flex-wrap gap-2">
                  <a href={done.url} target="_blank" rel="noreferrer" className="rounded-md bg-white px-3 py-1.5 font-semibold ring-1 ring-emerald-300">Voir l’annonce</a>
                  {done.wa ? <a href={done.wa} target="_blank" rel="noreferrer" className="rounded-md bg-[#25D366] px-3 py-1.5 font-semibold text-white">Prévenir l’agent sur WhatsApp</a> : null}
                  <button type="button" onClick={() => setDone(null)} className="rounded-md px-3 py-1.5 font-semibold">Publier une autre annonce</button>
                </div>
              </section>
            ) : (
              <>
                {/* 2. Message WhatsApp */}
                <section className="space-y-2 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <h2 className="font-bold text-ink">2. Message WhatsApp de l’annonce</h2>
                  <textarea value={text} onChange={(e) => setText(e.target.value)} rows={6} placeholder="Collez ici le message reçu (ex. « AL Cocody Angré 3 pièces 250k, 2 sdb, parking, gardien… »)" className={input} />
                  <button type="button" disabled={pending || text.trim().length < 15} onClick={fillWithAi} className="rounded-md bg-brand-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                    {pending ? "Lecture en cours…" : "Remplir la fiche avec l’IA"}
                  </button>
                  {missing.length ? <p className="text-xs text-amber-800">À compléter : {missing.join(", ")}.</p> : null}
                </section>

                {/* 3. Fiche et photos */}
                <section className="space-y-3 rounded-lg bg-white p-4 shadow-sm ring-1 ring-slate-200">
                  <h2 className="font-bold text-ink">3. Fiche et photos</h2>
                  {dups.length ? (
                    <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                      <p className="font-semibold">Annonce peut-être déjà en ligne :</p>
                      <ul className="mt-1 list-disc pl-5">
                        {dups.map((d) => <li key={d.id}><a href={d.url} target="_blank" rel="noreferrer" className="underline">{d.title}</a> — {d.price.toLocaleString("fr-FR")} F{d.owner ? ` · ${d.owner}` : ""}{d.sameAccount ? " (même annonceur)" : ""}</li>)}
                      </ul>
                    </div>
                  ) : null}
                  <input className={input} placeholder="Titre" value={draft.title} onChange={(e) => set("title", e.target.value)} />
                  <div className="grid gap-2 sm:grid-cols-3">
                    <select className={input} value={draft.transaction} onChange={(e) => set("transaction", e.target.value)}><option value="rent">À louer</option><option value="sale">À vendre</option></select>
                    <select className={input} value={draft.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
                      {[...PROPERTY_TYPES.map((t) => ({ key: t.key, label: t.label })), ...(PROPERTY_TYPES.some((t) => t.key === draft.propertyType) ? [] : [{ key: draft.propertyType, label: draft.propertyType }])].map((t) => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                    <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.furnished} onChange={(e) => set("furnished", e.target.checked)} /> Meublé</label>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input className={input} placeholder="Prix (FCFA)" inputMode="numeric" value={draft.price} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} onBlur={checkDuplicates} />
                    {draft.transaction === "rent" ? (
                      <select className={input} value={draft.priceUnit} onChange={(e) => set("priceUnit", e.target.value)}><option value="month">par mois</option><option value="day">par jour</option><option value="week">par semaine</option><option value="year">par an</option></select>
                    ) : <span />}
                    <input className={input} placeholder="Surface (m²)" inputMode="numeric" value={draft.surface} onChange={(e) => set("surface", e.target.value.replace(/\D/g, ""))} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input className={input} placeholder="Ville" value={draft.city} onChange={(e) => set("city", e.target.value)} />
                    <input className={input} placeholder="Commune" list="studio-communes" value={draft.commune} onChange={(e) => set("commune", e.target.value)} onBlur={checkDuplicates} />
                    <input className={input} placeholder="Quartier" value={draft.quartier} onChange={(e) => set("quartier", e.target.value)} />
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input className={input} placeholder="Chambres" inputMode="numeric" value={draft.bedrooms} onChange={(e) => set("bedrooms", e.target.value.replace(/\D/g, ""))} />
                    <input className={input} placeholder="Salles de bain" inputMode="numeric" value={draft.bathrooms} onChange={(e) => set("bathrooms", e.target.value.replace(/\D/g, ""))} />
                    <input className={input} placeholder="Équipements (séparés par des virgules)" value={draft.features} onChange={(e) => set("features", e.target.value)} />
                  </div>
                  <textarea className={input} rows={4} placeholder="Description" value={draft.description} onChange={(e) => set("description", e.target.value)} />

                  <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void addPhotos(e.dataTransfer.files); }}
                    onPaste={(e) => { const files = Array.from(e.clipboardData.files); if (files.length) void addPhotos(files); }}
                    className="rounded-md border-2 border-dashed border-slate-300 p-3 text-sm">
                    <div className="flex flex-wrap gap-2">
                      {photos.map((p, i) => (
                        <span key={p} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={p} alt="" className="h-20 w-24 rounded object-cover" />
                          <button type="button" aria-label="Retirer" onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))} className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-ink text-xs text-white">×</button>
                        </span>
                      ))}
                      {Array.from({ length: uploading }).map((_, i) => <span key={i} className="h-20 w-24 animate-pulse rounded bg-slate-200" />)}
                    </div>
                    <label className="mt-2 inline-block cursor-pointer font-semibold text-brand-800">
                      + Ajouter les photos reçues <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => void addPhotos(e.target.files)} />
                    </label>
                    <span className="ml-2 text-xs text-muted">ou glissez-les / collez-les ici. La 1re est la couverture.</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button type="button" disabled={pending || uploading > 0 || !canPublish || !draft.title} onClick={publish} className="rounded-md bg-accent-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                      Publier pour {agent.name}
                    </button>
                    {!canPublish ? <span className="text-xs text-red-700">Accord de l’annonceur nécessaire avant de publier.</span> : null}
                  </div>
                </section>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
