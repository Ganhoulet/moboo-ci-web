"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import type { ProMedia } from "@/lib/api";
import { addVideoLinks, arrangeMedia, leaveAgency, mediaUploadUrl, refreshProPage, removeMedia, saveProPage } from "@/app/mon-espace/page-pro/actions";
import { parseVideoLink, PROVIDER_LABEL } from "@/lib/video-embed";
import { VideoPlayer } from "./video-player";
import { uploadImageAction } from "@/app/mon-espace/actions";

interface Settings { enabled: boolean; maxPhotos: number; maxVideos: number; maxPhotoMb: number }
interface Data {
  username: string | null; accountType: string; settings: Settings; agency: { username: string | null; name: string; role: string } | null;
  profile: { title: string; licenseNumber: string; experienceSince: number | null; languages: string[]; specialties: string[]; tagline: string; coverUrl: string; officeAddress: string; media: ProMedia[] };
}

const input = "w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm text-ink focus:border-ink focus:outline-none focus:ring-1 focus:ring-ink";
const LANGS = ["Français", "Anglais", "Dioula", "Baoulé", "Bété", "Arabe", "Espagnol"];
const SPECS = ["Location résidentielle", "Vente de villas", "Terrains et lotissements", "Bureaux et commerces", "Meublés et courte durée", "Gestion locative", "Premier achat", "Investissement locatif", "Diaspora", "Luxe et prestige"];

/** Photo réduite dans le navigateur (≤ 1600 px, JPEG) avant envoi. */
async function shrink(file: File, max = 1600): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const im = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    const k = Math.min(1, max / Math.max(im.width, im.height));
    const c = document.createElement("canvas"); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
    c.getContext("2d")!.drawImage(im, 0, 0, c.width, c.height);
    return await new Promise<Blob>((res) => c.toBlob((b) => res(b!), "image/jpeg", 0.85));
  } finally { URL.revokeObjectURL(url); }
}

const toDataUri = (b: Blob) => new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(b); });

/** Envoi direct vers l'API avec la progression (les vidéos peuvent peser plusieurs dizaines de Mo). */
function send(url: string, body: FormData, onProgress: (p: number) => void) {
  return new Promise<{ ok: boolean; data: any }>((resolve) => {
    const x = new XMLHttpRequest();
    x.open("POST", url);
    x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    x.onload = () => { let d: any = null; try { d = JSON.parse(x.responseText); } catch { /* réponse vide */ } resolve({ ok: x.status < 300, data: d?.data ?? d }); };
    x.onerror = () => resolve({ ok: false, data: { message: "Connexion interrompue." } });
    x.send(body);
  });
}

function Chips({ value, onChange, suggestions, placeholder }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[]; placeholder: string }) {
  const [t, setT] = useState("");
  const add = (s: string) => { const v = s.trim(); if (v && !value.includes(v)) onChange([...value, v]); setT(""); };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((v) => (
          <span key={v} className="inline-flex items-center gap-1 rounded-full bg-ink px-3 py-1 text-sm font-medium text-white">
            {v}<button type="button" onClick={() => onChange(value.filter((x) => x !== v))} className="ml-1 text-white/70 hover:text-white" aria-label={`Retirer ${v}`}>×</button>
          </span>
        ))}
        <input value={t} onChange={(e) => setT(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(t); } }} onBlur={() => t && add(t)}
          placeholder={placeholder} className="min-w-[180px] flex-1 rounded-full border border-slate-300 px-3 py-1 text-sm focus:border-ink focus:outline-none" />
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {suggestions.filter((s) => !value.includes(s)).map((s) => (
          <button key={s} type="button" onClick={() => add(s)} className="rounded-full border border-dashed border-slate-300 px-2.5 py-0.5 text-xs text-slate-600 hover:border-ink hover:text-ink">+ {s}</button>
        ))}
      </div>
    </div>
  );
}

function Card({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-card sm:p-6">
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      {sub ? <p className="mt-0.5 text-sm text-muted">{sub}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function ProPageEditor({ initial }: { initial: Data }) {
  const [d, setD] = useState<Data>(initial);
  const p = d.profile;
  const [f, setF] = useState({
    title: p.title, licenseNumber: p.licenseNumber, experienceSince: p.experienceSince ? String(p.experienceSince) : "",
    tagline: p.tagline, officeAddress: p.officeAddress, coverUrl: p.coverUrl,
  });
  const [languages, setLanguages] = useState(p.languages);
  const [specialties, setSpecialties] = useState(p.specialties);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [mediaMsg, setMediaMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [links, setLinks] = useState("");
  const [pending, start] = useTransition();
  const photoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const s = d.settings;
  const photos = p.media.filter((m) => m.type === "photo").length;
  const videos = p.media.filter((m) => m.type === "video").length;
  const isAgency = d.accountType === "entreprise";

  const apply = (r: { ok: boolean; data?: any; error?: string }, okText: string, set = setMediaMsg) => {
    if (r.ok && r.data?.profile) setD(r.data);
    set(r.ok ? { ok: true, text: okText } : { ok: false, text: r.error ?? "Erreur" });
  };

  const save = () => start(async () => {
    const r = await saveProPage({ ...f, experienceSince: f.experienceSince ? Number(f.experienceSince) : null, languages, specialties }, d.username);
    apply(r, "Page enregistrée : elle est à jour sur Moboo.ci.", setMsg);
  });

  const upload = async (file: File) => {
    setMediaMsg(null);
    const blob = await shrink(file);
    if (blob.size > s.maxPhotoMb * 1024 * 1024) { setMediaMsg({ ok: false, text: `Photo trop lourde : ${s.maxPhotoMb} Mo maximum.` }); return; }
    const t = await mediaUploadUrl();
    if (!t.ok) { setMediaMsg({ ok: false, text: t.error ?? "Envoi impossible." }); return; }
    const fd = new FormData();
    fd.append("file", blob, "photo.jpg");
    setProgress(0);
    const r = await send(t.data.url, fd, setProgress);
    setProgress(null);
    if (!r.ok) { setMediaMsg({ ok: false, text: (Array.isArray(r.data?.error?.message) ? r.data.error.message.join(" ") : r.data?.error?.message ?? r.data?.message) || "Envoi impossible." }); return; }
    apply(await refreshProPage(d.username), "Photo ajoutée.");
  };

  // Liens collés (un par ligne) : aperçu immédiat de chaque vidéo reconnue.
  const pasted = links.split(/\s+/).map((x) => x.trim()).filter(Boolean).map((raw) => ({ raw, v: parseVideoLink(raw) }));
  const addLinks = () => start(async () => {
    const ok = pasted.filter((x) => x.v).map((x) => x.raw);
    if (!ok.length) { setMediaMsg({ ok: false, text: "Collez le lien d’une vidéo YouTube, TikTok ou Vimeo." }); return; }
    const r = await addVideoLinks(ok, "", d.username);
    apply(r, ok.length > 1 ? `${ok.length} vidéos ajoutées.` : "Vidéo ajoutée.");
    if (r.ok) setLinks("");
  });

  const move = (id: string, dir: -1 | 1) => start(async () => {
    const list = [...p.media];
    const i = list.findIndex((m) => m.id === id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    apply(await arrangeMedia(list.map((m) => ({ id: m.id, caption: m.caption })), d.username), "Ordre enregistré.");
  });

  const caption = (id: string, c: string) => start(async () => {
    apply(await arrangeMedia(p.media.map((m) => ({ id: m.id, caption: m.id === id ? c : m.caption })), d.username), "Légende enregistrée.");
  });

  const year = new Date().getFullYear();
  return (
    <div className="space-y-5">
      {d.username ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-brand-800 to-brand-700 p-5 text-white">
          <div><p className="font-semibold">Votre page publique</p><p className="text-sm text-white/80">moboo.ci/pro/{d.username}</p></div>
          <Link href={`/pro/${d.username}`} target="_blank" className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-brand-900 hover:bg-brand-50">Voir ma page ↗</Link>
        </div>
      ) : (
        <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">Choisissez d’abord un identifiant public dans <Link href="/mon-espace/profil" className="font-semibold underline">Mon profil</Link> pour activer votre page.</p>
      )}

      <Card title="Photos et vidéos de présentation" sub={`Présentez-vous, votre agence, vos réalisations : jusqu’à ${s.maxVideos} vidéo(s) (liens YouTube, TikTok, Vimeo) et ${s.maxPhotos} photo(s). La première vidéo s’affiche en grand en haut de votre page.`}>
        {!s.enabled ? <p className="text-sm text-muted">Les médias sont désactivés pour le moment.</p> : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {p.media.map((m, i) => (
                <div key={m.id} className="overflow-hidden rounded-xl border border-slate-200">
                  <div className="relative aspect-video bg-slate-900">
                    {m.type === "photo" || m.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.type === "photo" ? m.url : m.thumb} alt="" className="h-full w-full object-cover" />
                    ) : m.provider === "upload" ? <video src={`${m.url}#t=0.5`} preload="metadata" muted className="h-full w-full object-cover" /> : <span className="grid h-full place-items-center text-xs font-semibold text-white/80">{m.provider}</span>}
                    <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">{m.type === "video" ? "▶ Vidéo" : "Photo"}</span>
                  </div>
                  <div className="space-y-1.5 p-2">
                    <input defaultValue={m.caption} placeholder="Légende" maxLength={120} onBlur={(e) => e.target.value !== m.caption && caption(m.id, e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-1 text-xs" />
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex gap-1">
                        <button type="button" disabled={pending || i === 0} onClick={() => move(m.id, -1)} className="rounded bg-slate-100 px-2 py-0.5 disabled:opacity-40" aria-label="Avancer">←</button>
                        <button type="button" disabled={pending || i === p.media.length - 1} onClick={() => move(m.id, 1)} className="rounded bg-slate-100 px-2 py-0.5 disabled:opacity-40" aria-label="Reculer">→</button>
                      </span>
                      <button type="button" disabled={pending} onClick={() => { if (confirm("Retirer ce média ?")) start(async () => apply(await removeMedia(m.id, d.username), "Média retiré.")); }} className="font-semibold text-red-600 hover:underline">Retirer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!p.media.length ? <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-muted">Aucun média pour l’instant. Une courte vidéo de présentation (30 s à 2 min) inspire confiance aux clients.</p> : null}

            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-sm font-semibold text-ink">Ajouter des vidéos YouTube, TikTok ou Vimeo <span className="font-normal text-muted">({videos}/{s.maxVideos})</span></p>
              <p className="text-xs text-muted">Copiez le lien de la vidéo (bouton « Partager » → « Copier le lien ») et collez-le ici. Plusieurs liens : un par ligne.</p>
              <textarea value={links} onChange={(e) => setLinks(e.target.value)} rows={2} disabled={videos >= s.maxVideos}
                placeholder={"https://youtu.be/…\nhttps://www.tiktok.com/@agence/video/…"} className={input + " mt-2 font-mono text-xs"} />
              {pasted.length ? (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {pasted.map(({ raw, v }) => (
                    <div key={raw} className="rounded-xl bg-white p-2 ring-1 ring-slate-200">
                      {v && v.url ? <VideoPlayer provider={v.provider} url={v.url} thumb={v.thumb} />
                        : v ? <p className="p-3 text-xs text-slate-600">Lien court TikTok : la vidéo sera reconnue à l’ajout.</p>
                        : <p className="p-3 text-xs text-red-600">Lien non reconnu : {raw.slice(0, 60)}</p>}
                      {v ? <p className="mt-1 px-1 text-xs font-semibold text-emerald-700">✓ {PROVIDER_LABEL[v.provider]}</p> : null}
                    </div>
                  ))}
                </div>
              ) : null}
              <button type="button" disabled={pending || !pasted.some((x) => x.v) || videos >= s.maxVideos} onClick={addLinks} className="mt-3 rounded-xl bg-ink px-4 py-2 text-sm font-bold text-white disabled:opacity-40">Ajouter {pasted.filter((x) => x.v).length > 1 ? `les ${pasted.filter((x) => x.v).length} vidéos` : "la vidéo"}</button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button type="button" disabled={photos >= s.maxPhotos || progress !== null} onClick={() => photoInput.current?.click()} className="rounded-xl border border-ink px-4 py-2 text-sm font-bold text-ink hover:bg-slate-50 disabled:opacity-40">+ Photo ({photos}/{s.maxPhotos})</button>
              <span className="text-xs text-muted">JPG, PNG ou WEBP, réduite automatiquement.</span>
              <input ref={photoInput} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(e) => { const x = e.target.files?.[0]; if (x) void upload(x); e.target.value = ""; }} />
            </div>
            {progress !== null ? (
              <div className="mt-3"><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-accent-500 transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-1 text-xs text-muted">Envoi… {progress} %</p></div>
            ) : null}
            {mediaMsg ? <p className={"mt-2 text-sm " + (mediaMsg.ok ? "text-emerald-700" : "text-red-600")}>{mediaMsg.text}</p> : null}
          </>
        )}
      </Card>

      <Card title="Identité professionnelle" sub="Les informations clés affichées dans votre carte de profil, comme sur Zillow.">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm"><span className="font-semibold text-ink">Titre affiché</span>
            <input className={input + " mt-1"} value={f.title} maxLength={80} placeholder={isAgency ? "Agence immobilière à Cocody" : "Agent immobilier senior"} onChange={(e) => setF({ ...f, title: e.target.value })} /></label>
          <label className="text-sm"><span className="font-semibold text-ink">Référence de l’agent</span>
            <input className={input + " mt-1 font-mono"} value={f.licenseNumber} maxLength={60} placeholder="N° d’agrément, carte pro, RCCM…" onChange={(e) => setF({ ...f, licenseNumber: e.target.value })} /></label>
          <label className="text-sm"><span className="font-semibold text-ink">En activité depuis (année)</span>
            <input className={input + " mt-1"} type="number" min={1950} max={year} value={f.experienceSince} placeholder={String(year - 5)} onChange={(e) => setF({ ...f, experienceSince: e.target.value })} /></label>
          {!isAgency ? (
            <div className="text-sm">
              <span className="font-semibold text-ink">Agence</span>
              {d.agency ? (
                <div className="mt-1 flex flex-wrap items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 ring-1 ring-emerald-200">
                  <span className="text-emerald-900">✓ Membre de <strong>{d.agency.name}</strong> · {d.agency.role}</span>
                  <button type="button" className="ml-auto text-xs font-semibold text-red-600 hover:underline" onClick={() => { if (confirm(`Quitter l’équipe de ${d.agency!.name} ?`)) start(async () => apply(await leaveAgency(d.username), "Vous avez quitté l’équipe.", setMsg)); }}>Quitter</button>
                </div>
              ) : <p className="mt-1 rounded-xl bg-slate-50 px-3 py-2 text-xs text-muted">Indépendant. Pour apparaître « Membre de … », votre agence vous ajoute à son équipe depuis son espace, avec votre numéro de téléphone.</p>}
            </div>
          ) : null}
          <label className="text-sm sm:col-span-2"><span className="font-semibold text-ink">Phrase d’accroche</span>
            <input className={input + " mt-1"} value={f.tagline} maxLength={140} placeholder="Je vous trouve le bon logement à Cocody, sans perte de temps." onChange={(e) => setF({ ...f, tagline: e.target.value })} /></label>
          <label className="text-sm sm:col-span-2"><span className="font-semibold text-ink">Adresse du bureau</span>
            <input className={input + " mt-1"} value={f.officeAddress} maxLength={200} placeholder="Riviera 3, rue des Jardins, Cocody" onChange={(e) => setF({ ...f, officeAddress: e.target.value })} /></label>
        </div>
      </Card>

      <Card title="Langues et spécialités">
        <p className="mb-2 text-sm font-semibold text-ink">Langues parlées</p>
        <Chips value={languages} onChange={setLanguages} suggestions={LANGS} placeholder="Ajouter une langue…" />
        <p className="mb-2 mt-5 text-sm font-semibold text-ink">Spécialités</p>
        <Chips value={specialties} onChange={setSpecialties} suggestions={SPECS} placeholder="Ajouter une spécialité…" />
      </Card>

      <Card title="Image de couverture" sub="Bandeau en haut de votre page (format paysage).">
        <div className="relative h-32 overflow-hidden rounded-xl bg-gradient-to-br from-brand-800 to-brand-900">
          {f.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={f.coverUrl} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => coverInput.current?.click()} className="rounded-xl border border-ink px-4 py-2 text-sm font-bold text-ink hover:bg-slate-50">{f.coverUrl ? "Changer" : "Choisir une image"}</button>
          {f.coverUrl ? <button type="button" onClick={() => setF({ ...f, coverUrl: "" })} className="text-sm font-semibold text-red-600 hover:underline">Retirer</button> : null}
          <input ref={coverInput} type="file" accept="image/*" hidden onChange={async (e) => {
            const x = e.target.files?.[0]; e.target.value = "";
            if (!x) return;
            const r = await uploadImageAction(await toDataUri(await shrink(x, 1800)), "annonce");
            if (r.ok && r.url) setF((v) => ({ ...v, coverUrl: r.url! })); else setMsg({ ok: false, text: r.error ?? "Envoi impossible." });
          }} />
        </div>
      </Card>

      <div className="sticky bottom-3 z-10 flex flex-wrap items-center gap-3 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-slate-200">
        <button type="button" disabled={pending} onClick={save} className="rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">{pending ? "Enregistrement…" : "Enregistrer ma page"}</button>
        {msg ? <span className={"text-sm " + (msg.ok ? "text-emerald-700" : "text-red-600")}>{msg.text}</span> : null}
      </div>
    </div>
  );
}
