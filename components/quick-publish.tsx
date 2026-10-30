"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { COMMUNES } from "@/lib/accounts";
import { quickExtractAction, quickPublishAction, quickUploadAction } from "@/app/p/[slug]/actions";
import { sendSignupCodeAction, verifySignupAction } from "@/app/inscription/actions";
import { uploadListingVideo } from "@/components/listing-video-card";

type Page = {
  slug: string; title: string; manager: string; accountTypes: string[]; minPhotos: number; location: "optional" | "required" | "hidden";
  video: boolean; aiFill: boolean; pageTitle: string; pageIntro: string; successText: string; types: { slug: string; label: string }[];
};
type Account = { firstName: string | null; accountType: string; onboarded: boolean } | null;

const TYPE_LABEL: Record<string, string> = { agent: "Agent immobilier", entreprise: "Agence immobilière", proprietaire: "Propriétaire" };
const PUBLISHERS = ["agent", "entreprise", "proprietaire"];
const STEPS = ["Bien", "Photos", "Prix", "Zone", "Détails"];
const field = "w-full rounded-xl border border-slate-300 px-4 py-3 text-base outline-none focus:border-brand-700";
const VIDEO_LINK = /https?:\/\/(?:www\.|m\.|vm\.|vt\.)?(?:tiktok\.com|youtube\.com|youtu\.be|facebook\.com|fb\.watch|instagram\.com|vimeo\.com)\/\S+/i;

/** Même règle que le serveur : « Appartement 3 pièces meublé à louer à Yopougon Maroc » (pièces = chambres + salon). */
const NO_ROOMS = /studio|terrain|bureau|magasin|boutique|entrep|local|parking|immeuble/i;
function autoTitle(t: { typeLabel: string; transaction: string; bedrooms: number; furnished: boolean; commune: string; quartier: string }) {
  const rooms = t.bedrooms > 0 && !NO_ROOMS.test(t.typeLabel) ? ` ${t.bedrooms + 1} pièces` : "";
  const meuble = t.furnished && t.transaction !== "sale" ? " meublé" : "";
  return `${t.typeLabel}${rooms}${meuble} ${t.transaction === "sale" ? "à vendre" : "à louer"} à ${t.commune || "…"}${t.quartier ? ` ${t.quartier}` : ""}`.replace(/\s+/g, " ").trim();
}

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

/**
 * Publication rapide depuis un lien partagé dans un groupe WhatsApp : 5 écrans courts
 * (bien, photos et vidéo, prix, zone, détails) ; le compte est demandé au moment de publier.
 */
export function QuickPublish({ page, account }: { page: Page; account: Account }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [d, setD] = useState({
    transaction: "rent" as "rent" | "sale", propertyType: page.types[0]?.slug ?? "appartement", furnished: false,
    price: "", priceUnit: "month", bedrooms: "", commune: "", quartier: "", latitude: null as number | null, longitude: null as number | null,
    title: "", description: "", videoUrl: "",
  });
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(0);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [paste, setPaste] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [geo, setGeo] = useState<"idle" | "busy" | "ok" | "err">("idle");
  const [auth, setAuth] = useState<null | { stage: "phone" | "code"; phone: string; email: string; code: string; type: string; firstName: string; lastName: string; company: string; registered: boolean; devCode?: string }>(null);
  const [done, setDone] = useState<{ url: string; text: string; video?: string; payUrl?: string } | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [pending, start] = useTransition();
  const set = (k: keyof typeof d, v: unknown) => setD((x) => ({ ...x, [k]: v }));
  const typeLabel = page.types.find((t) => t.slug === d.propertyType)?.label ?? "Bien";
  const suggested = autoTitle({ typeLabel, transaction: d.transaction, bedrooms: Number(d.bedrooms) || 0, furnished: d.furnished, commune: d.commune.trim(), quartier: d.quartier.trim() });

  const canNext = [
    true,
    photos.length >= page.minPhotos && uploading === 0,
    Number(d.price) > 0,
    !!d.commune.trim() && (page.location !== "required" || d.latitude != null),
    true,
  ][step];

  async function addPhotos(files: FileList | null) {
    const list = Array.from(files ?? []).filter((f) => f.type.startsWith("image/")).slice(0, 15 - photos.length);
    setUploading((n) => n + list.length);
    for (const f of list) {
      try {
        const r = await quickUploadAction(page.slug, await compress(f));
        if (r.ok && r.url) setPhotos((p) => [...p, r.url!]); else setError(r.error ?? "Envoi de la photo impossible.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  function locate() {
    if (!navigator.geolocation) return setGeo("err");
    setGeo("busy");
    navigator.geolocation.getCurrentPosition(
      (p) => { set("latitude", Number(p.coords.latitude.toFixed(6))); set("longitude", Number(p.coords.longitude.toFixed(6))); setGeo("ok"); },
      () => setGeo("err"), { enableHighAccuracy: true, timeout: 15000 },
    );
  }

  function fillFromMessage() {
    if (!paste || paste.trim().length < 15) return;
    start(async () => {
      setError(null);
      const r = await quickExtractAction(page.slug, paste);
      if (!r.ok) return setError(r.error!);
      const f = r.fields;
      setD((x) => ({
        ...x, transaction: f.transaction === "sale" ? "sale" : "rent", propertyType: page.types.some((t) => t.slug === f.propertyType) ? f.propertyType : x.propertyType,
        furnished: !!f.furnished, price: f.price ? String(f.price) : x.price, priceUnit: f.priceUnit || "month", bedrooms: f.bedrooms ? String(f.bedrooms) : x.bedrooms,
        commune: f.commune || x.commune, quartier: f.quartier || x.quartier, title: f.title || "", description: f.description || x.description,
        videoUrl: paste.match(VIDEO_LINK)?.[0] ?? x.videoUrl,
      }));
      setPaste(null);
    });
  }

  async function doPublish() {
    const r = await quickPublishAction(page.slug, {
      photos,
      listing: { ...d, typeLabel, price: Number(d.price) || 0, bedrooms: Number(d.bedrooms) || null, features: [] },
    });
    if (!r.ok) { setError(r.error); return; }
    let video: string | undefined;
    if (videoFile) {
      setProgress(0);
      const v = await uploadListingVideo(r.data.id, videoFile, 1024, setProgress);
      setProgress(null);
      video = v.ok ? "Vidéo envoyée : elle apparaît sur l’annonce dans quelques minutes." : v.error;
    }
    setDone({ url: r.data.url, text: r.data.successText || page.successText, video, payUrl: r.data.payment?.paymentUrl ?? r.data.payment?.url ?? undefined });
    router.refresh();
  }

  function publish() {
    setError(null);
    if (!account) return setAuth({ stage: "phone", phone: "", email: "", code: "", type: page.accountTypes[0] ?? "agent", firstName: "", lastName: "", company: "", registered: false });
    if (!PUBLISHERS.includes(account.accountType)) return setError("Votre compte n’est pas un compte annonceur : choisissez « Agent », « Agence » ou « Propriétaire » dans Mon espace → Profil.");
    start(doPublish);
  }

  function sendCode() {
    if (!auth) return;
    start(async () => {
      setError(null);
      // Sans nom : seulement pour un numéro déjà inscrit (connexion) ; sinon on demande le nom avant d'envoyer le code.
      if (!auth.firstName.trim() && !auth.company.trim()) {
        const c = await sendSignupCodeAction({ phone: auth.phone, checkOnly: true });
        if (!c.ok) return setError(c.error ?? "Numéro invalide.");
        if (!c.phoneRegistered) return setError(auth.type === "entreprise" ? "Nouveau compte : indiquez le nom de l’agence." : "Nouveau compte : indiquez votre prénom et votre nom.");
      }
      const r = await sendSignupCodeAction({ phone: auth.phone, email: auth.email || undefined });
      if (!r.ok) return setError(r.error ?? "Envoi du code impossible.");
      setAuth({ ...auth, stage: "code", registered: !!r.phoneRegistered, devCode: r.devCode });
    });
  }

  function verifyAndPublish() {
    if (!auth) return;
    start(async () => {
      setError(null);
      const company = auth.type === "entreprise" ? auth.company.trim() : "";
      const r = await verifySignupAction({
        phone: auth.phone, code: auth.code, accountType: auth.type, email: auth.email || undefined,
        firstName: auth.firstName.trim() || undefined, lastName: auth.lastName.trim() || undefined, companyName: company || undefined,
        commune: d.commune || undefined, ...(auth.type === "entreprise" ? { accountSubtype: "agence" } : {}),
      });
      if (!r.ok) return setError(r.error ?? "Code incorrect.");
      setAuth(null);
      await doPublish();
    });
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md space-y-4 px-4 py-8 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-3xl text-emerald-700">✓</div>
        <h1 className="font-display text-2xl font-extrabold text-ink">C’est en ligne !</h1>
        <p className="text-muted">{done.text}</p>
        {done.video ? <p className="text-sm text-muted">{done.video}</p> : null}
        {done.payUrl ? <a href={done.payUrl} className="block rounded-xl bg-accent-600 py-3 font-bold text-white">Régler la publication</a> : null}
        <a href={done.url} className="block rounded-xl bg-brand-800 py-3 font-bold text-white">Voir mon annonce</a>
        <a href={`https://wa.me/?text=${encodeURIComponent(done.url)}`} className="block rounded-xl bg-[#25D366] py-3 font-bold text-white">Partager sur WhatsApp</a>
        <button type="button" onClick={() => { setDone(null); setStep(0); setPhotos([]); setVideoFile(null); setD((x) => ({ ...x, price: "", title: "", description: "", videoUrl: "", quartier: "" })); }}
          className="block w-full rounded-xl py-3 font-semibold text-brand-800 ring-1 ring-slate-300">Publier un autre bien</button>
        <a href="/mon-espace" className="block text-sm text-muted underline">Mon espace</a>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 pb-28 pt-5">
      <h1 className="font-display text-2xl font-extrabold text-ink">{page.pageTitle}</h1>
      {step === 0 && page.pageIntro ? <p className="mt-1 text-sm text-muted">{page.pageIntro}</p> : null}

      {/* Progression */}
      <ol className="mt-4 flex gap-1" aria-label="Étapes">
        {STEPS.map((s, i) => (
          <li key={s} className="flex-1">
            <span className={"block h-1.5 rounded-full " + (i <= step ? "bg-brand-700" : "bg-slate-200")} />
            <span className={"mt-1 block text-center text-[11px] " + (i === step ? "font-bold text-ink" : "text-muted")}>{s}</span>
          </li>
        ))}
      </ol>

      {error ? <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}

      <div className="mt-5 space-y-4">
        {step === 0 ? (
          <>
            {page.aiFill ? (
              paste === null ? (
                <button type="button" onClick={() => setPaste("")} className="w-full rounded-xl bg-[#25D366]/10 p-3 text-left text-sm font-semibold text-emerald-900 ring-1 ring-[#25D366]/40">
                  Vous avez déjà le message WhatsApp du bien ? <span className="underline">Collez-le</span> : tout se remplit tout seul.
                </button>
              ) : (
                <div className="space-y-2 rounded-xl bg-slate-50 p-3">
                  <textarea autoFocus value={paste} onChange={(e) => setPaste(e.target.value)} rows={5} placeholder="Collez ici votre message (ex. « AL Cocody Angré 3 pièces 250k… »)" className={field} />
                  <div className="flex gap-2">
                    <button type="button" disabled={pending || paste.trim().length < 15} onClick={fillFromMessage} className="flex-1 rounded-xl bg-brand-800 py-2.5 font-bold text-white disabled:opacity-50">{pending ? "Lecture…" : "Remplir"}</button>
                    <button type="button" onClick={() => setPaste(null)} className="rounded-xl px-4 text-muted">Annuler</button>
                  </div>
                </div>
              )
            ) : null}
            <div className="grid grid-cols-2 gap-2">
              {(["rent", "sale"] as const).map((t) => (
                <button key={t} type="button" onClick={() => set("transaction", t)} className={"rounded-xl py-3 font-bold " + (d.transaction === t ? "bg-brand-800 text-white" : "bg-white ring-1 ring-slate-300")}>
                  {t === "rent" ? "À louer" : "À vendre"}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {page.types.map((t) => (
                <button key={t.slug} type="button" onClick={() => set("propertyType", t.slug)} className={"rounded-full px-4 py-2 text-sm font-semibold " + (d.propertyType === t.slug ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{t.label}</button>
              ))}
            </div>
            {d.transaction === "rent" ? (
              <label className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200"><input type="checkbox" className="h-5 w-5" checked={d.furnished} onChange={(e) => set("furnished", e.target.checked)} /> Meublé</label>
            ) : null}
          </>
        ) : null}

        {step === 1 ? (
          <>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p, i) => (
                <span key={p} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p} alt="" className="aspect-square w-full rounded-xl object-cover" />
                  {i === 0 ? <span className="absolute bottom-1 left-1 rounded bg-black/60 px-1.5 text-[10px] text-white">Couverture</span> : null}
                  <button type="button" aria-label="Retirer" onClick={() => setPhotos((ps) => ps.filter((_, j) => j !== i))} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white">×</button>
                </span>
              ))}
              {Array.from({ length: uploading }).map((_, i) => <span key={`u${i}`} className="aspect-square animate-pulse rounded-xl bg-slate-200" />)}
              <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border-2 border-dashed border-slate-300 text-center text-sm font-semibold text-brand-800">
                + Photos<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => void addPhotos(e.target.files)} />
              </label>
            </div>
            <p className="text-xs text-muted">{page.minPhotos ? `Au moins ${page.minPhotos} photo(s). ` : ""}Choisissez-les dans votre galerie (celles envoyées sur WhatsApp y sont).</p>
            {page.video ? (
              <div className="space-y-2 rounded-xl bg-white p-3 ring-1 ring-slate-200">
                <p className="font-semibold text-ink">Vidéo <span className="font-normal text-muted">(facultatif)</span></p>
                <label className="block cursor-pointer rounded-lg bg-slate-50 p-3 text-sm font-semibold text-brand-800">
                  {videoFile ? `✓ ${videoFile.name}` : "+ Choisir une vidéo"}<input type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)} />
                </label>
                <input value={d.videoUrl} onChange={(e) => set("videoUrl", e.target.value.trim())} placeholder="ou lien TikTok, YouTube, Facebook…" className={field} inputMode="url" />
              </div>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <>
            <label className="block">
              <span className="text-sm font-semibold text-ink">{d.transaction === "rent" ? "Loyer" : "Prix de vente"} (FCFA)</span>
              <input autoFocus value={d.price ? Number(d.price).toLocaleString("fr-FR") : ""} onChange={(e) => set("price", e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="ex. 250 000" className={field + " mt-1 text-xl font-bold"} />
            </label>
            {d.transaction === "rent" ? (
              <div className="grid grid-cols-4 gap-1">
                {[["month", "/ mois"], ["day", "/ jour"], ["week", "/ sem."], ["year", "/ an"]].map(([k, l]) => (
                  <button key={k} type="button" onClick={() => set("priceUnit", k)} className={"rounded-lg py-2 text-sm font-semibold " + (d.priceUnit === k ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{l}</button>
                ))}
              </div>
            ) : null}
            <label className="block">
              <span className="text-sm font-semibold text-ink">Chambres <span className="font-normal text-muted">(facultatif)</span></span>
              <div className="mt-1 grid grid-cols-6 gap-1">
                {["", "1", "2", "3", "4", "5"].map((n) => (
                  <button key={n || "0"} type="button" onClick={() => set("bedrooms", n)} className={"rounded-lg py-2 text-sm font-semibold " + (d.bedrooms === n ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{n || "—"}{n === "5" ? "+" : ""}</button>
                ))}
              </div>
            </label>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <label className="block"><span className="text-sm font-semibold text-ink">Commune ou ville</span>
              <input autoFocus list="quick-communes" value={d.commune} onChange={(e) => set("commune", e.target.value)} placeholder="ex. Cocody" className={field + " mt-1"} />
            </label>
            <datalist id="quick-communes">{COMMUNES.map((c) => <option key={c} value={c} />)}</datalist>
            <label className="block"><span className="text-sm font-semibold text-ink">Quartier <span className="font-normal text-muted">(facultatif)</span></span>
              <input value={d.quartier} onChange={(e) => set("quartier", e.target.value)} placeholder="ex. Angré 8e tranche" className={field + " mt-1"} />
            </label>
            {page.location !== "hidden" ? (
              <button type="button" onClick={locate} className={"w-full rounded-xl p-3 text-left text-sm font-semibold ring-1 " + (geo === "ok" ? "bg-emerald-50 text-emerald-900 ring-emerald-200" : "bg-white ring-slate-300")}>
                {geo === "ok" ? "✓ Position du bien enregistrée" : geo === "busy" ? "Recherche de la position…" : "📍 Je suis sur place : enregistrer la position"}
                <span className="block text-xs font-normal text-muted">{geo === "err" ? "Position indisponible : autorisez la localisation ou passez cette étape." : page.location === "required" ? "Obligatoire." : "Facultatif : vous pouvez passer."}</span>
              </button>
            ) : null}
          </>
        ) : null}

        {step === 4 ? (
          <>
            <label className="block"><span className="text-sm font-semibold text-ink">Titre de l’annonce</span>
              <input value={d.title} onChange={(e) => set("title", e.target.value)} placeholder={suggested} className={field + " mt-1"} />
              <span className="mt-1 block text-xs text-muted">{d.title.trim() ? "Votre titre sera utilisé." : <>Laissez vide : l’annonce s’appellera « <b className="text-ink">{suggested}</b> ».</>}</span>
            </label>
            <label className="block"><span className="text-sm font-semibold text-ink">Description</span>
              <textarea value={d.description} onChange={(e) => set("description", e.target.value)} rows={5} placeholder="Pièces, équipements, accès, conditions (caution, avance)…" className={field + " mt-1"} />
            </label>
            <div className="rounded-xl bg-slate-50 p-3 text-sm text-muted">
              <b className="block text-ink">{d.title.trim() || suggested}</b>
              {Number(d.price).toLocaleString("fr-FR")} F{d.transaction === "rent" ? ({ month: " / mois", day: " / jour", week: " / semaine", year: " / an" } as Record<string, string>)[d.priceUnit] ?? "" : ""} · {photos.length} photo(s){videoFile || d.videoUrl ? " + vidéo" : ""}
            </div>
          </>
        ) : null}
      </div>

      {/* Compte au moment de publier */}
      {auth ? (
        <div className="fixed inset-0 z-[60] flex items-end bg-black/40 sm:items-center sm:justify-center" role="dialog" aria-modal="true">
          <div className="w-full max-w-md space-y-3 rounded-t-2xl bg-white p-5 sm:rounded-2xl" style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}>
            <p className="font-display text-lg font-extrabold text-ink">{auth.stage === "phone" ? "Dernière étape : votre compte" : "Code de confirmation"}</p>
            {error ? <p className="rounded-lg bg-red-50 p-2 text-sm text-red-800">{error}</p> : null}
            {auth.stage === "phone" ? (
              <>
                <p className="text-sm text-muted">Les clients vous appelleront sur ce numéro. Déjà inscrit ? Mettez simplement votre numéro.</p>
                <input value={auth.phone} onChange={(e) => setAuth({ ...auth, phone: e.target.value })} inputMode="tel" autoComplete="tel" placeholder="Téléphone (ex. 07 08 09 10 11)" className={field} />
                <div className="flex flex-wrap gap-2">
                  {page.accountTypes.map((t) => (
                    <button key={t} type="button" onClick={() => setAuth({ ...auth, type: t })} className={"rounded-full px-3 py-1.5 text-sm font-semibold " + (auth.type === t ? "bg-ink text-white" : "bg-white ring-1 ring-slate-300")}>{TYPE_LABEL[t]}</button>
                  ))}
                </div>
                {auth.type === "entreprise" ? <input value={auth.company} onChange={(e) => setAuth({ ...auth, company: e.target.value })} placeholder="Nom de l’agence" className={field} /> : null}
                <div className="grid grid-cols-2 gap-2">
                  <input value={auth.firstName} onChange={(e) => setAuth({ ...auth, firstName: e.target.value })} placeholder="Prénom" autoComplete="given-name" className={field} />
                  <input value={auth.lastName} onChange={(e) => setAuth({ ...auth, lastName: e.target.value })} placeholder="Nom" autoComplete="family-name" className={field} />
                </div>
                <input value={auth.email} onChange={(e) => setAuth({ ...auth, email: e.target.value })} inputMode="email" autoComplete="email" placeholder="E-mail (pour recevoir le code)" className={field} />
                <button type="button" disabled={pending || auth.phone.replace(/\D/g, "").length < 8} onClick={sendCode} className="w-full rounded-xl bg-brand-800 py-3 font-bold text-white disabled:opacity-50">
                  {pending ? "Envoi…" : "Recevoir mon code"}
                </button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted">{auth.registered ? "Vous avez déjà un compte : entrez le code pour vous connecter et publier." : "Entrez le code reçu pour créer votre compte et publier."}{auth.devCode ? ` (test : ${auth.devCode})` : ""}</p>
                <input autoFocus value={auth.code} onChange={(e) => setAuth({ ...auth, code: e.target.value.replace(/\D/g, "").slice(0, 6) })} inputMode="numeric" autoComplete="one-time-code" placeholder="Code à 6 chiffres" className={field + " text-center text-2xl tracking-widest"} />
                <button type="button" disabled={pending || auth.code.length < 4} onClick={verifyAndPublish} className="w-full rounded-xl bg-accent-600 py-3 font-bold text-white disabled:opacity-50">
                  {pending ? (progress !== null ? `Envoi de la vidéo : ${progress} %` : "Publication…") : "Valider et publier"}
                </button>
                <button type="button" onClick={() => setAuth({ ...auth, stage: "phone", code: "" })} className="w-full text-sm text-muted underline">Changer de numéro</button>
              </>
            )}
            <button type="button" onClick={() => { setAuth(null); setError(null); }} className="w-full text-sm text-muted">Annuler</button>
          </div>
        </div>
      ) : null}

      {/* Navigation */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto flex max-w-md gap-2 px-4 py-3">
          {step > 0 ? <button type="button" onClick={() => setStep(step - 1)} className="rounded-xl px-5 py-3 font-semibold ring-1 ring-slate-300">Retour</button> : null}
          {step < STEPS.length - 1 ? (
            <button type="button" disabled={!canNext} onClick={() => { setError(null); setStep(step + 1); }} className="flex-1 rounded-xl bg-brand-800 py-3 font-bold text-white disabled:opacity-40">
              {step === 3 && page.location === "optional" && d.latitude == null ? "Passer et continuer" : "Continuer"}
            </button>
          ) : (
            <button type="button" disabled={pending || !canNext} onClick={publish} className="flex-1 rounded-xl bg-accent-600 py-3 font-bold text-white disabled:opacity-50">
              {pending ? (progress !== null ? `Vidéo : ${progress} %` : "Publication…") : "Publier"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
