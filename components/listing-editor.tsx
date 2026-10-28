"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { COMMUNES, LISTING_FEATURES, PROPERTY_TYPES } from "@/lib/accounts";
import { saveListingAction, uploadImageAction } from "@/app/mon-espace/actions";
import { ListingVideoCard, uploadListingVideo } from "@/components/listing-video-card";
import type { ListingVideo } from "@/app/mon-espace/video-actions";
import { BUILTIN_FIELDS, fieldView, visibleSteps, type CustomField, type ListingFormConfig, type StepId } from "@/lib/listing-form";
import { SiteIcon } from "@/components/site-icon";

const NO_FORM: ListingFormConfig = { steps: {}, fields: {}, custom: [] };
const AREA_UNITS = ["m²", "ha", "are", "lot"];
const FREQ = ["", "par mois", "par jour", "par semaine", "par an", "à débattre"];

export type ListingDraft = {
  transaction: "rent" | "sale";
  propertyType: string;
  title: string;
  price: string;
  description: string;
  bedrooms: string;
  bathrooms: string;
  garage: string;
  surface: string;
  yearBuilt: string;
  features: string[];
  city: string;
  commune: string;
  quartier: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  photos: string[];
  videoUrl: string;
  contactName: string;
  contactPhone: string;
  // Champs complémentaires (mêmes que le formulaire de l'application Moboo.ci).
  labels: string[];
  pricePrefix: string;
  pricePostfix: string;
  secondaryPrice: string;
  sizeUnit: string;
  landArea: string;
  landAreaUnit: string;
  garageSize: string;
  additional: { title: string; value: string }[];
  virtualTour: string;
  floorPlans: FloorPlanDraft[];
  units: UnitDraft[];
  postalCode: string;
  disclaimer: string;
  privateNote: string;
  /** Champs créés dans le back-office (Formulaires) : publics / visibles de l'annonceur seul. */
  custom: Record<string, CustomValue>;
  customPrivate: Record<string, CustomValue>;
};
export type CustomValue = string | number | boolean | string[];
export type FloorPlanDraft = { title: string; price: string; size: string; rooms: string; baths: string; image: string; description: string };
export type UnitDraft = { title: string; price: string; priceUnit: string; beds: string; baths: string; size: string; sizeUnit: string; type: string; availability: string };
const EMPTY_PLAN: FloorPlanDraft = { title: "", price: "", size: "", rooms: "", baths: "", image: "", description: "" };
const EMPTY_UNIT: UnitDraft = { title: "", price: "", priceUnit: "", beds: "", baths: "", size: "", sizeUnit: "m²", type: "", availability: "" };


/** Compresse une image dans le navigateur (1600 px max, JPEG ~75 %) → data URI. */
async function compress(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
    c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.75);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function parseCoords(s: string): [number, number] | null {
  const res = [
    /@(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/, /[?&](?:q|query|ll|destination)=(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/,
    /!3d(-?\d{1,2}\.\d+)!4d(-?\d{1,3}\.\d+)/, /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/,
  ];
  for (const re of res) {
    const m = s.match(re);
    if (m) {
      const lat = Number(m[1]), lng = Number(m[2]);
      if (Math.abs(lat) <= 90 && Math.abs(lng) <= 180) return [lat, lng];
    }
  }
  return null;
}

export type EditorSave = (id: string | null, payload: Record<string, any>) => Promise<{ ok: boolean; id?: string; error?: string; paymentUrl?: string | null }>;

export function ListingEditor({
  id, initial, maxPhotos: MAX_PHOTOS = 12,
  saveAction = saveListingAction, createdHref = "/mon-espace/annonces?publiee={id}",
  types = PROPERTY_TYPES, features: FEATURES = LISTING_FEATURES, communes: AREAS = COMMUNES, labels: LABELS = [],
  form = NO_FORM, accountType, team = false, video = null,
}: {
  /** Envoi de vidéo depuis le site (réglages, et vidéo actuelle en modification) : null = indisponible. */
  video?: ListingVideo | null;
  /** Règles du formulaire (back-office → Formulaires). */
  form?: ListingFormConfig;
  /** Profil de l'annonceur (champs réservés à certains profils). */
  accountType?: string | null;
  /** Éditeur du back-office : champs réservés à l'équipe visibles, rien d'obligatoire en plus. */
  team?: boolean;
  /** Étiquettes du back-office (Exclusivité, Nouveau…), 5 au plus. */
  labels?: { key: string; label: string }[];
  id?: string; initial: ListingDraft;
  /** Réglage « Nombre maximum de photos » (back-office). */
  maxPhotos?: number;
  /** Enregistrement (espace compte par défaut ; le back-office passe le sien). */
  saveAction?: EditorSave;
  /** Page après création ; {id} = identifiant de la nouvelle annonce. */
  createdHref?: string;
  /** Listes du back-office (Immobilier) : types de bien, équipements, communes / quartiers. */
  types?: { key: string; label: string }[];
  features?: string[];
  communes?: string[];
}) {
  const router = useRouter();
  const edit = !!id;
  const [step, setStep] = useState(0);
  const [d, setD] = useState<ListingDraft>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState<string | null>(null);
  const [customFeature, setCustomFeature] = useState("");
  const [mapsLink, setMapsLink] = useState("");
  // Meublés et espaces événementiels : publiés dans Moboo Resi / Moboo Event, pas sur le site.
  const [shortStay, setShortStay] = useState(false);
  // Accord RGPD (page « Accord RGPD » du formulaire de l'application) : déjà donné pour une annonce existante.
  const [gdpr, setGdpr] = useState(!!id);
  // Nouvelle annonce : fichier vidéo choisi, envoyé juste après l'enregistrement (il faut l'annonce).
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoProgress, setVideoProgress] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (p: Partial<ListingDraft>) => { setD((x) => ({ ...x, ...p })); setError(null); setSaved(false); };

  const ctx = { accountType, transaction: d.transaction, propertyType: d.propertyType, team };
  const fv = (key: string, fallback?: string) => fieldView(form, key, ctx, fallback);
  const on = (key: string) => fv(key).show;
  /** Libellé du champ : renommé dans le back-office, « * » si obligatoire, mention si réservé. */
  const lab = (key: string, fallback?: string) => {
    const v = fv(key, fallback);
    return `${v.label}${v.required ? " *" : ""}${v.team ? " · réservé à l'équipe" : ""}`;
  };
  const customs = (st: StepId) => form.custom.filter((c) => c.step === st && on(c.key));
  // Étapes affichées : réglage du back-office, et seulement si elles ont au moins un champ.
  const STEPS = visibleSteps(form, ctx).filter((st) => st.lockable || BUILTIN_FIELDS.some((f) => f.step === st.id && on(f.key)) || customs(st.id).length > 0);
  const CONTACT_STEP = STEPS.length - 1;
  const stepId = STEPS[Math.min(step, STEPS.length - 1)]?.id;
  // Back-office → Formulaires : « une seule page » (toutes les rubriques à la suite, sans onglets).
  const single = form.layout === "single";
  const shown = (id: StepId) => (single ? STEPS.some((st) => st.id === id) : stepId === id);
  const heading = (id: StepId) => (single ? <h3 className="border-t border-slate-100 pt-5 font-display text-lg font-bold text-ink first:border-0 first:pt-0">{STEPS.find((st) => st.id === id)?.label}</h3> : null);

  const isEmpty = (key: string): boolean => {
    const c = form.custom.find((x) => x.key === key);
    if (c) {
      const v = (c.visibility === "private" ? d.customPrivate : d.custom)[key];
      return v == null || v === "" || v === false || (Array.isArray(v) && !v.length);
    }
    const map: Record<string, unknown> = {
      map: d.latitude, surface: d.surface, landArea: d.landArea,
    };
    const v = key in map ? map[key] : (d as Record<string, unknown>)[key];
    return v == null || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length);
  };

  function validate(s: number): string | null {
    const id = STEPS[s]?.id;
    if (id === "essentiel") {
      if (d.title.trim().length < 8) return "Donnez un titre clair (8 caractères minimum).";
      if (!(Number(d.price) > 0)) return "Indiquez le prix.";
    }
    if (id === "essentiel" && fv("description").required && d.description.trim().length < 40) return "Décrivez le bien (40 caractères minimum).";
    if (id === "rgpd" && fv("gdpr").show && !gdpr) return "Cochez l’accord RGPD pour publier.";
    if (id === "localisation" && !d.city.trim()) return "Indiquez la ville.";
    if (id === "contact" && d.contactPhone.replace(/[^0-9]/g, "").length < 8) return "Indiquez un numéro de contact.";
    for (const f of [...BUILTIN_FIELDS.filter((x) => x.step === id && !x.core && x.key !== "gdpr"), ...form.custom.filter((x) => x.step === id)]) {
      if (fv(f.key).required && isEmpty(f.key)) return `Renseignez « ${fv(f.key).label} ».`;
    }
    return null;
  }

  function payload() {
    const n = (v: string) => (v.trim() === "" ? null : Number(v));
    return {
      transaction: d.transaction, propertyType: d.propertyType, title: d.title.trim(), price: Number(d.price),
      priceUnit: d.transaction === "rent" ? "month" : undefined,
      description: d.description.trim(), bedrooms: n(d.bedrooms), bathrooms: n(d.bathrooms), garage: n(d.garage),
      surface: n(d.surface), yearBuilt: n(d.yearBuilt), features: d.features,
      city: d.city.trim(), commune: d.commune || null, quartier: d.quartier.trim() || null, address: d.address.trim() || null,
      latitude: d.latitude, longitude: d.longitude, photos: d.photos, videoUrl: d.videoUrl.trim() || null,
      contactName: d.contactName.trim() || null, contactPhone: d.contactPhone.trim(),
      labels: d.labels,
      details: {
        pricePrefix: d.pricePrefix, pricePostfix: d.pricePostfix, secondaryPrice: d.secondaryPrice, sizeUnit: d.sizeUnit,
        landArea: d.landArea, landAreaUnit: d.landAreaUnit, garageSize: d.garageSize, additional: d.additional, virtualTour: d.virtualTour,
        floorPlans: d.floorPlans, postalCode: d.postalCode, disclaimer: d.disclaimer, privateNote: d.privateNote,
        custom: d.custom, customPrivate: d.customPrivate,
      },
      units: d.units,
    };
  }

  async function uploadPlan(i: number, file: File | undefined) {
    if (!file) return;
    setUploading("Envoi du plan…");
    try {
      const r = await uploadImageAction(await compress(file), "annonce");
      if (r.ok && r.url) setPlan(i, { image: r.url });
      else setError(r.error ?? "Envoi impossible.");
    } catch {
      setError("Cette image n'a pas pu être lue.");
    }
    setUploading(null);
  }
  const setPlan = (i: number, p: Partial<FloorPlanDraft>) => set({ floorPlans: d.floorPlans.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const setUnit = (i: number, p: Partial<UnitDraft>) => set({ units: d.units.map((x, j) => (j === i ? { ...x, ...p } : x)) });
  const setCustom = (f: CustomField, v: CustomValue) => {
    const bag = f.visibility === "private" ? "customPrivate" : "custom";
    set({ [bag]: { ...d[bag], [f.key]: v } } as Partial<ListingDraft>);
  };
  const customBlock = (st: StepId) => {
    const list = customs(st);
    return list.length ? (
      <div className="grid gap-3 sm:grid-cols-2">
        {list.map((f) => (
          <CustomInput key={f.key} f={f} label={lab(f.key)} help={fv(f.key).help}
            value={(f.visibility === "private" ? d.customPrivate : d.custom)[f.key]} onChange={(v) => setCustom(f, v)} />
        ))}
      </div>
    ) : null;
  };
  const setExtra = (i: number, p: Partial<{ title: string; value: string }>) => set({ additional: d.additional.map((x, j) => (j === i ? { ...x, ...p } : x)) });

  function save() {
    for (let s = 0; s < STEPS.length; s++) {
      const err = validate(s);
      if (err) { setStep(s); setError(err); if (single) setTimeout(() => document.getElementById("listing-error")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0); return; }
    }
    start(async () => {
      const r = await saveAction(id ?? null, payload());
      if (!r.ok) return setError(r.error ?? "Erreur.");
      if (!edit && videoFile && r.id) {
        const up = await uploadListingVideo(r.id, videoFile, video?.maxMb ?? 100, setVideoProgress);
        setVideoProgress(null);
        // L'annonce est publiée même si la vidéo échoue : elle pourra être renvoyée depuis « Modifier ».
        if (!up.ok) { router.push(`/mon-espace/annonces/${encodeURIComponent(r.id)}?video=echec`); return; }
      }
      if (edit) { setSaved(true); router.refresh(); }
      // Soumission payante à l'annonce : paiement, puis mise en ligne automatique.
      else if (r.paymentUrl) window.location.href = r.paymentUrl;
      else router.push(createdHref.replace("{id}", encodeURIComponent(r.id!)));
    });
  }

  function next() {
    const err = validate(step);
    if (err) return setError(err);
    if (step === STEPS.length - 1) return save();
    setStep((s) => s + 1);
  }

  async function addPhotos(files: FileList | null) {
    if (!files?.length) return;
    const room = MAX_PHOTOS - d.photos.length;
    const list = Array.from(files).slice(0, room);
    for (let i = 0; i < list.length; i++) {
      setUploading(`Envoi ${i + 1}/${list.length}…`);
      try {
        const data = await compress(list[i]);
        const r = await uploadImageAction(data, "annonce");
        if (r.ok && r.url) setD((x) => ({ ...x, photos: [...x.photos, r.url!].slice(0, MAX_PHOTOS) }));
        else setError(r.error ?? "Envoi impossible.");
      } catch {
        setError("Cette image n'a pas pu être lue.");
      }
    }
    setUploading(null);
    setSaved(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  const move = (i: number, dir: -1 | 1) => {
    const p = [...d.photos]; const j = i + dir;
    if (j < 0 || j >= p.length) return;
    [p[i], p[j]] = [p[j], p[i]]; set({ photos: p });
  };

  return (
    <div className="rounded-3xl bg-white p-5 shadow-card sm:p-7">
      {/* Étapes */}
      <div className={(single || shortStay ? "hidden " : "") + "-mx-1 mb-6 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"}>
        {STEPS.map(({ id: sid, label: s }, i) => (
          <button key={sid} type="button" disabled={!edit && i > step}
            onClick={() => { if (edit || i <= step) { setStep(i); setError(null); } }}
            className={"flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition " +
              (i === step ? "bg-ink text-white" : i < step || edit ? "bg-slate-100 text-ink hover:bg-slate-200" : "bg-slate-50 text-slate-400")}>
            <span className={"grid h-5 w-5 place-items-center rounded-full text-[10px] " + (i === step ? "bg-white text-ink" : i < step ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500")}>
              {i < step && !edit ? "✓" : i + 1}
            </span>
            {s}
          </button>
        ))}
      </div>

      <div key={step} className="animate-[stepIn_.25s_ease-out] space-y-5">
        {shown("essentiel") ? (
          <>
            {heading("essentiel")}
            <div className="grid grid-cols-2 gap-3">
              {([["rent", "À louer", "Location longue durée"], ["sale", "À vendre", "Vente"]] as const).map(([k, l, h]) => (
                <button key={k} type="button" onClick={() => { set({ transaction: k }); setShortStay(false); }}
                  className={"rounded-2xl border-2 p-4 text-left transition " + (d.transaction === k && !shortStay ? "border-accent-600 bg-accent-50" : "border-slate-200 hover:border-slate-300")}>
                  <span className="block font-display text-lg font-bold text-ink">{l}</span>
                  <span className="block text-xs text-muted">{h}</span>
                </button>
              ))}
              {!edit ? (
                <button type="button" onClick={() => setShortStay(true)}
                  className={"col-span-2 rounded-2xl border-2 p-4 text-left transition " + (shortStay ? "border-brand-700 bg-brand-50" : "border-dashed border-slate-300 hover:border-slate-400")}>
                  <span className="block font-display text-base font-bold text-ink">Meublé ou espace événementiel</span>
                  <span className="block text-xs text-muted">Location courte durée (nuit, jour, week-end)</span>
                </button>
              ) : null}
            </div>
            {shortStay ? <ShortStayNotice /> : null}
            {shortStay ? null : <>
            <Picker label={fv("propertyType").label} options={types.map((t) => ({ value: t.key, label: t.label }))}
              value={d.propertyType} onChange={(v) => set({ propertyType: v as string })} />
            <Field label={lab("title")}>
              <input className="input" value={d.title} maxLength={140} placeholder="Ex. Appartement 3 pièces lumineux à Riviera 2"
                onChange={(e) => set({ title: e.target.value })} />
            </Field>
            {on("description") ? <Field label={lab("description")}>
              <textarea className="input min-h-[140px]" value={d.description} maxLength={4000}
                placeholder="Pièces, état, points forts, environnement, conditions (avance, caution)…"
                onChange={(e) => set({ description: e.target.value })} />
              <p className="mt-1 text-xs text-muted">{d.description.trim().length} caractères</p>
            </Field> : null}
            <div className={on("pricePostfix") ? "grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] items-start gap-3" : ""}>
            <Field label={fv("price").label !== "Prix" ? lab("price") : d.transaction === "rent" ? "Loyer mensuel (FCFA) *" : "Prix de vente (FCFA) *"}>
              <input className="input" inputMode="numeric" value={d.price} placeholder="Ex. 250000"
                onChange={(e) => set({ price: e.target.value.replace(/[^0-9]/g, "") })} />
              {Number(d.price) > 0 ? <p className="mt-1 text-xs text-muted">{d.pricePrefix ? `${d.pricePrefix} ` : ""}{new Intl.NumberFormat("fr-FR").format(Number(d.price))} FCFA{d.pricePostfix ? ` ${d.pricePostfix}` : d.transaction === "rent" ? " / mois" : ""}</p> : null}
            </Field>
            {on("pricePostfix") ? (
              <Picker label={lab("pricePostfix")}
                // Location : « par mois » est la valeur par défaut (pas de doublon dans la liste).
                options={FREQ.filter((f) => !(d.transaction === "rent" && f === "par mois")).map((f) => ({ value: f, label: f || (d.transaction === "rent" ? "par mois" : "prix fixe") }))}
                value={d.transaction === "rent" && d.pricePostfix === "par mois" ? "" : FREQ.includes(d.pricePostfix) ? d.pricePostfix : ""} onChange={(v) => set({ pricePostfix: v as string })} />
            ) : null}
            </div>
            {on("pricePrefix") || on("secondaryPrice") ? (
            <details className="rounded-2xl border border-slate-200 p-4" open={!!(d.pricePrefix || d.secondaryPrice) || ["pricePrefix", "secondaryPrice"].some((k) => fv(k).required)}>
              <summary className="cursor-pointer text-sm font-semibold text-ink">Options de prix</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {on("pricePrefix") ? <Field label={lab("pricePrefix")}><input className="input" value={d.pricePrefix} maxLength={40} placeholder="Ex. À partir de" onChange={(e) => set({ pricePrefix: e.target.value })} /></Field> : null}
                {on("secondaryPrice") ? <Field label={lab("secondaryPrice")}><input className="input" inputMode="numeric" value={d.secondaryPrice} placeholder="Ex. 230000" onChange={(e) => set({ secondaryPrice: e.target.value.replace(/[^0-9]/g, "") })} /></Field> : null}
              </div>
            </details>
            ) : null}
            {LABELS.length && on("labels") ? (
              <Picker label={`${lab("labels")} (5 au plus)`} multi max={5} placeholder="Aucune étiquette"
                options={LABELS.map((t) => ({ value: t.key, label: t.label }))} value={d.labels} onChange={(v) => set({ labels: v as string[] })} />
            ) : null}
            {customBlock("essentiel")}
            {SHORT_STAY_HINT.test(`${d.title} ${d.pricePostfix}`) ? <ShortStayNotice soft /> : null}
            </>}
          </>
        ) : null}

        {shown("medias") ? (
          <>
            {heading("medias")}
            {on("photos") ? <>
            <p className="text-sm text-muted">
              {fv("photos").required ? "Au moins une photo. " : ""}Jusqu'à {MAX_PHOTOS} photos, compressées automatiquement. La 1re est la couverture — utilisez ◀ ▶ pour l'ordre.
            </p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {d.photos.map((src, i) => (
                <div key={src} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  {i === 0 ? <span className="absolute left-1.5 top-1.5 rounded-md bg-accent-600 px-1.5 py-0.5 text-[10px] font-bold text-white">Couverture</span> : null}
                  <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/60 p-1.5">
                    <span className="flex gap-1">
                      <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded bg-white/90 px-1.5 text-xs font-bold disabled:opacity-40">◀</button>
                      <button type="button" onClick={() => move(i, 1)} disabled={i === d.photos.length - 1} className="rounded bg-white/90 px-1.5 text-xs font-bold disabled:opacity-40">▶</button>
                    </span>
                    <button type="button" onClick={() => set({ photos: d.photos.filter((p) => p !== src) })} className="rounded bg-red-600 px-1.5 text-xs font-bold text-white"><SiteIcon value="✕" size={16} className="mr-1 inline-block align-[-3px]" /></button>
                  </div>
                </div>
              ))}
              {d.photos.length < MAX_PHOTOS ? (
                <button type="button" onClick={() => fileRef.current?.click()} disabled={!!uploading}
                  className="grid aspect-[4/3] place-items-center rounded-xl border-2 border-dashed border-accent-300 bg-accent-50 text-accent-700 transition hover:border-accent-500">
                  <span className="text-center text-sm font-semibold">
                    {uploading ?? <>＋ Ajouter<br /><span className="text-xs font-medium">{d.photos.length}/{MAX_PHOTOS}</span></>}
                  </span>
                </button>
              ) : null}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addPhotos(e.target.files)} />
            </> : null}
            {on("videoUrl") ? <Field label={fv("videoUrl").required ? lab("videoUrl") : `${lab("videoUrl")} (optionnel)`}>
              <input className="input" value={d.videoUrl} placeholder="Lien YouTube, TikTok, Vimeo, Dailymotion, Facebook ou Instagram" onChange={(e) => set({ videoUrl: e.target.value })} />
            </Field> : null}
            {on("videoUpload") && video?.uploadEnabled && !team ? (
              edit && id ? <ListingVideoCard listingId={id} info={video} embedded /> : (
                <div className="rounded-2xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-ink">Ou envoyez la vidéo (fichier)</p>
                  <p className="text-xs text-muted">
                    Filmée avec votre téléphone : {video.maxMb} Mo et {Math.round(video.maxSeconds / 60) >= 1 ? `${Math.round(video.maxSeconds / 60)} min` : `${video.maxSeconds} s`} au maximum. Envoyée juste après la publication.
                    {video.aiRooms ? " Les meilleures images sont ajoutées automatiquement à vos photos, pièce par pièce." : ""}
                  </p>
                  {videoFile ? (
                    <p className="mt-2 flex items-center gap-3 text-sm">
                      <span className="truncate font-medium text-ink"><SiteIcon value="🎬" size={16} className="mr-1 inline-block align-[-3px]" />{videoFile.name} · {(videoFile.size / 1024 / 1024).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} Mo</span>
                      <button type="button" className="font-semibold text-red-600" onClick={() => setVideoFile(null)}>Retirer</button>
                    </p>
                  ) : (
                    <label className="btn-ghost mt-2 inline-flex cursor-pointer">＋ Choisir une vidéo
                      <input type="file" accept="video/*" hidden onChange={(e) => {
                        const f = e.target.files?.[0] ?? null;
                        if (f && f.size > video.maxMb * 1024 * 1024) { setError(`Vidéo trop lourde : ${video.maxMb} Mo au maximum.`); return; }
                        setVideoFile(f); setError(null);
                      }} />
                    </label>
                  )}
                </div>
              )
            ) : null}
            {customBlock("medias")}
          </>
        ) : null}

        {shown("details") ? (
          <>
            {heading("details")}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {on("bedrooms") ? <Num label={lab("bedrooms")} v={d.bedrooms} on={(v) => set({ bedrooms: v })} /> : null}
              {on("bathrooms") ? <Num label={lab("bathrooms")} v={d.bathrooms} on={(v) => set({ bathrooms: v })} /> : null}
              {on("garage") ? <Num label={lab("garage")} v={d.garage} on={(v) => set({ garage: v })} /> : null}
              {on("surface") ? <>
                <Num label={`${lab("surface", "Surface").replace(" (et unité)", "")} (${d.sizeUnit || "m²"})`} v={d.surface} on={(v) => set({ surface: v })} />
                <Picker label="Unité de surface" options={AREA_UNITS.map((u) => ({ value: u, label: u }))} value={d.sizeUnit || "m²"} onChange={(v) => set({ sizeUnit: v as string })} />
              </> : null}
              {on("yearBuilt") ? <Num label={lab("yearBuilt")} v={d.yearBuilt} on={(v) => set({ yearBuilt: v })} /> : null}
              {on("landArea") ? <>
                <Num label={`${lab("landArea", "Terrain").replace(" (et unité)", "")} (${d.landAreaUnit || "m²"})`} v={d.landArea} on={(v) => set({ landArea: v })} />
                <Picker label="Unité du terrain" options={AREA_UNITS.map((u) => ({ value: u, label: u }))} value={d.landAreaUnit || "m²"} onChange={(v) => set({ landAreaUnit: v as string })} />
              </> : null}
              {on("garageSize") ? <Field label={lab("garageSize")}><input className="input" value={d.garageSize} maxLength={40} placeholder="Ex. 2 voitures" onChange={(e) => set({ garageSize: e.target.value })} /></Field> : null}
            </div>
            {customBlock("details")}
            {on("additional") ? <div>
              <p className="mb-2 text-sm font-semibold text-ink">{lab("additional", "Détails supplémentaires").replace(" (libres)", "")}</p>
              <div className="space-y-2">
                {d.additional.map((a, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="input" value={a.title} maxLength={60} placeholder="Ex. Eau" onChange={(e) => setExtra(i, { title: e.target.value })} />
                    <input className="input" value={a.value} maxLength={160} placeholder="Ex. Forage + SODECI" onChange={(e) => setExtra(i, { value: e.target.value })} />
                    <button type="button" aria-label="Retirer" className="shrink-0 rounded-lg px-3 text-red-600 ring-1 ring-red-200" onClick={() => set({ additional: d.additional.filter((_, j) => j !== i) })}><SiteIcon value="✕" size={16} className="mr-1 inline-block align-[-3px]" /></button>
                  </div>
                ))}
              </div>
              {d.additional.length < 20 ? <button type="button" className="btn-ghost mt-2" onClick={() => set({ additional: [...d.additional, { title: "", value: "" }] })}>＋ Ajouter un détail</button> : null}
            </div> : null}
          </>
        ) : null}

        {shown("equipements") ? (
          <>
            {heading("equipements")}
            {on("features") ? <>
            <Picker label={lab("features")} multi placeholder="Choisir les équipements"
              options={[...FEATURES, ...d.features.filter((f) => !FEATURES.includes(f))].map((f) => ({ value: f, label: f }))}
              value={d.features} onChange={(v) => set({ features: v as string[] })} />
            <p className="text-xs text-muted">C'est ce que les visiteurs regardent en premier.</p>
            <div className="flex gap-2">
              <input className="input" value={customFeature} placeholder="Autre équipement…" onChange={(e) => setCustomFeature(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && customFeature.trim()) { e.preventDefault(); set({ features: [...d.features, customFeature.trim()] }); setCustomFeature(""); } }} />
              <button type="button" className="btn-ghost shrink-0" onClick={() => { if (customFeature.trim()) { set({ features: [...d.features, customFeature.trim()] }); setCustomFeature(""); } }}>Ajouter</button>
            </div>
            </> : null}
            {customBlock("equipements")}
          </>
        ) : null}

        {shown("localisation") ? (
          <>
            {heading("localisation")}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={lab("city")}><input className="input" value={d.city} onChange={(e) => set({ city: e.target.value })} /></Field>
              {on("commune") ? <Field label={lab("commune")}>
                <select className="input" value={AREAS.includes(d.commune) || !d.commune ? d.commune : "__autre"} onChange={(e) => set({ commune: e.target.value === "__autre" ? "" : e.target.value })}>
                  <option value="">— Choisir —</option>
                  {AREAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field> : null}
              {on("quartier") ? <Field label={lab("quartier")}><input className="input" value={d.quartier} placeholder="Ex. Riviera 2, Zone 4…" onChange={(e) => set({ quartier: e.target.value })} /></Field> : null}
              {on("address") ? <Field label={lab("address")}><input className="input" value={d.address} placeholder="Rue, repère…" onChange={(e) => set({ address: e.target.value })} /></Field> : null}
              {on("postalCode") ? <Field label={lab("postalCode")}><input className="input" value={d.postalCode} maxLength={12} placeholder="Ex. 01 BP 1234" onChange={(e) => set({ postalCode: e.target.value })} /></Field> : null}
            </div>
            {customBlock("localisation")}
            {on("map") ? <>
            <AddressSearch onPick={(h) => { set({ latitude: h.lat, longitude: h.lng }); setMapsLink(`${h.lat.toFixed(6)}, ${h.lng.toFixed(6)}`); }} />
            <Field label={fv("map").required ? lab("map") : `${lab("map")} (recommandé)`}>
              <input className="input" value={mapsLink} placeholder="Collez un lien Google Maps ou « latitude, longitude »"
                onChange={(e) => { setMapsLink(e.target.value); const p = parseCoords(e.target.value); if (p) set({ latitude: p[0], longitude: p[1] }); }} />
              {d.latitude != null && d.longitude != null ? (
                <p className="mt-1 flex items-center gap-2 text-xs text-emerald-700">
                  <SiteIcon value="✓" size={16} className="mr-1 inline-block align-[-3px]" />Position enregistrée ({d.latitude.toFixed(4)}, {d.longitude.toFixed(4)})
                  <button type="button" className="font-semibold text-red-600" onClick={() => { set({ latitude: null, longitude: null }); setMapsLink(""); }}>Retirer</button>
                </p>
              ) : mapsLink ? <p className="mt-1 text-xs text-amber-700">Lien court non reconnu : ouvrez-le puis copiez l'adresse complète de la page.</p> : null}
            </Field>
            </> : null}
          </>
        ) : null}

        {shown("visite") ? (
          <>
            {heading("visite")}
            {on("virtualTour") ? <Field label={fv("virtualTour").required ? lab("virtualTour") : `${lab("virtualTour")} (optionnel)`}>
              <input className="input" value={d.virtualTour} placeholder="Lien Matterport, Kuula… ou code <iframe> à coller" onChange={(e) => set({ virtualTour: e.target.value })} />
            </Field> : null}
            {customBlock("visite")}
          </>
        ) : null}

        {shown("lots") ? (
          <>
            {heading("lots")}
            {on("units") ? <div>
              <p className="font-display text-base font-bold text-ink">{fv("units").required ? lab("units") : `${lab("units")} (facultatif)`}</p>
              <p className="text-sm text-muted">Immeuble, résidence ou programme : chaque logement disponible avec son prix.</p>
              <div className="mt-3 space-y-3">
                {d.units.map((u, i) => (
                  <div key={i} className="grid gap-2 rounded-2xl border border-slate-200 p-3 sm:grid-cols-4">
                    <input className="input sm:col-span-2" value={u.title} placeholder="Titre (ex. Appartement A2)" onChange={(e) => setUnit(i, { title: e.target.value })} />
                    <input className="input" value={u.type} placeholder="Type (ex. 3 pièces)" onChange={(e) => setUnit(i, { type: e.target.value })} />
                    <input className="input" inputMode="numeric" value={u.price} placeholder="Prix FCFA" onChange={(e) => setUnit(i, { price: e.target.value.replace(/[^0-9]/g, "") })} />
                    <input className="input" value={u.priceUnit} placeholder="Ex. par mois" onChange={(e) => setUnit(i, { priceUnit: e.target.value })} />
                    <input className="input" value={u.beds} placeholder="Chambres" onChange={(e) => setUnit(i, { beds: e.target.value })} />
                    <input className="input" value={u.baths} placeholder="Salles de bain" onChange={(e) => setUnit(i, { baths: e.target.value })} />
                    <input className="input" value={u.size} placeholder="Surface" onChange={(e) => setUnit(i, { size: e.target.value })} />
                    <input className="input sm:col-span-3" value={u.availability} placeholder="Disponibilité (ex. tout de suite, 1er décembre)" onChange={(e) => setUnit(i, { availability: e.target.value })} />
                    <button type="button" className="text-sm font-semibold text-red-600" onClick={() => set({ units: d.units.filter((_, j) => j !== i) })}>Retirer</button>
                  </div>
                ))}
              </div>
              {d.units.length < 30 ? <button type="button" className="btn-ghost mt-2" onClick={() => set({ units: [...d.units, { ...EMPTY_UNIT }] })}>＋ Ajouter un lot</button> : null}
            </div> : null}
            {customBlock("lots")}
          </>
        ) : null}

        {shown("plans") ? (
          <>
            {heading("plans")}
            {on("floorPlans") ? <div>
              <p className="font-display text-base font-bold text-ink">{fv("floorPlans").required ? lab("floorPlans") : `${lab("floorPlans")} (facultatif)`}</p>
              <p className="text-sm text-muted">Plan de chaque niveau ou de chaque type de logement (image).</p>
              <div className="mt-3 space-y-3">
                {d.floorPlans.map((pl, i) => (
                  <div key={i} className="grid gap-2 rounded-2xl border border-slate-200 p-3 sm:grid-cols-3">
                    <input className="input sm:col-span-2" value={pl.title} placeholder="Titre (ex. Rez-de-chaussée)" onChange={(e) => setPlan(i, { title: e.target.value })} />
                    <input className="input" value={pl.price} placeholder="Prix (facultatif)" onChange={(e) => setPlan(i, { price: e.target.value })} />
                    <input className="input" value={pl.rooms} placeholder="Pièces" onChange={(e) => setPlan(i, { rooms: e.target.value })} />
                    <input className="input" value={pl.baths} placeholder="Salles de bain" onChange={(e) => setPlan(i, { baths: e.target.value })} />
                    <input className="input" value={pl.size} placeholder="Surface (ex. 120 m²)" onChange={(e) => setPlan(i, { size: e.target.value })} />
                    <textarea className="input sm:col-span-3" rows={2} value={pl.description} placeholder="Description du plan" onChange={(e) => setPlan(i, { description: e.target.value })} />
                    <div className="flex items-center gap-3 sm:col-span-3">
                      {pl.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={pl.image} alt="" className="h-16 w-24 rounded-lg object-cover ring-1 ring-slate-200" />
                      ) : null}
                      <label className="btn-ghost cursor-pointer">{pl.image ? "Changer l'image" : "＋ Image du plan"}<input type="file" accept="image/*" hidden onChange={(e) => uploadPlan(i, e.target.files?.[0])} /></label>
                      <button type="button" className="ml-auto text-sm font-semibold text-red-600" onClick={() => set({ floorPlans: d.floorPlans.filter((_, j) => j !== i) })}>Retirer</button>
                    </div>
                  </div>
                ))}
              </div>
              {d.floorPlans.length < 10 ? <button type="button" className="btn-ghost mt-2" onClick={() => set({ floorPlans: [...d.floorPlans, { ...EMPTY_PLAN }] })}>＋ Ajouter un plan</button> : null}
            </div> : null}
            {customBlock("plans")}
          </>
        ) : null}

        {shown("contact") ? (
          <>
            {heading("contact")}
            <div className="grid gap-3 sm:grid-cols-2">
              {on("contactName") ? <Field label={lab("contactName")}><input className="input" value={d.contactName} onChange={(e) => set({ contactName: e.target.value })} /></Field> : null}
              <Field label={lab("contactPhone")}><input className="input" inputMode="tel" value={d.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} /></Field>
            </div>
            <div className="flex gap-4 rounded-2xl bg-slate-50 p-4">
              {d.photos[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={d.photos[0]} alt="" className="h-20 w-28 shrink-0 rounded-xl object-cover" />
              ) : <span className="grid h-20 w-28 shrink-0 place-items-center rounded-xl bg-slate-200 text-xs text-slate-500">Sans photo</span>}
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-accent-700">{d.transaction === "rent" ? "À louer" : "À vendre"} · {types.find((t) => t.key === d.propertyType)?.label}</p>
                <p className="truncate font-display font-bold text-ink">{d.title || "Titre de l'annonce"}</p>
                <p className="text-sm font-bold text-ink">{Number(d.price) ? new Intl.NumberFormat("fr-FR").format(Number(d.price)) + " FCFA" : "—"}{d.transaction === "rent" ? " / mois" : ""}</p>
                <p className="truncate text-xs text-muted">{[d.quartier, d.commune, d.city].filter(Boolean).join(", ")} · {d.photos.length} photo(s) · {d.features.length} équipement(s)</p>
              </div>
            </div>
            {customBlock("contact")}
          </>
        ) : null}

        {shown("reglages") ? (
          <>
            {heading("reglages")}
            {on("disclaimer") ? <Field label={fv("disclaimer").required ? lab("disclaimer") : `${lab("disclaimer")} (facultatif)`}>
              <textarea className="input" rows={2} value={d.disclaimer} maxLength={600} placeholder="Ex. Prix hors frais d’agence, sous réserve de disponibilité." onChange={(e) => set({ disclaimer: e.target.value })} />
            </Field> : null}
            {customBlock("reglages")}
          </>
        ) : null}

        {shown("note") ? (
          <>
            {heading("note")}
            {on("privateNote") ? <Field label={`${lab("privateNote")} (visible par vous seul)`}>
              <textarea className="input" rows={2} value={d.privateNote} maxLength={2000} placeholder="Ex. Clés chez le gardien, propriétaire joignable le soir…" onChange={(e) => set({ privateNote: e.target.value })} />
            </Field> : null}
            {customBlock("note")}
          </>
        ) : null}

        {shown("rgpd") ? (
          <>
            {heading("rgpd")}
            <Chip on={gdpr} onClick={() => { setGdpr(!gdpr); setError(null); }} multi>
              J’accepte que Moboo enregistre et publie ces informations pour diffuser mon annonce
            </Chip>
            <p className="text-xs text-muted">Conformément au RGPD et à la loi ivoirienne sur les données personnelles. <Link href="/confidentialite" target="_blank" className="font-semibold text-brand-800 hover:underline">Politique de confidentialité</Link></p>
            {customBlock("rgpd")}
          </>
        ) : null}
      </div>

      {error ? <p id="listing-error" className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
      {saved ? <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">Modifications enregistrées ✓</p> : null}

      <div className={(shortStay ? "hidden " : "") + "mt-6 flex flex-wrap gap-3"}>
        {step > 0 && !single ? <button type="button" className="btn-ghost" onClick={() => { setStep((s) => s - 1); setError(null); }}>Retour</button> : null}
        {edit ? (
          <>
            {step < STEPS.length - 1 && !single ? <button type="button" className="btn-ghost" onClick={next}>Étape suivante</button> : null}
            <button type="button" onClick={save} disabled={pending || !!uploading} className="btn-primary flex-1 bg-accent-600 hover:bg-accent-700 disabled:opacity-60">
              {pending ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </>
        ) : (
          <button type="button" onClick={single ? save : next} disabled={pending || !!uploading} className="btn-primary flex-1 bg-accent-600 hover:bg-accent-700 disabled:opacity-60">
            {videoProgress != null ? `Envoi de la vidéo… ${videoProgress} %` : pending ? "Publication…" : single || step === STEPS.length - 1 ? "Publier l'annonce" : "Continuer"}
          </button>
        )}
      </div>
      {edit ? (
        <p className="mt-4 text-center text-xs text-muted">
          <Link href={`/annonce/${id}`} target="_blank" className="font-semibold text-brand-800 hover:underline">Voir l'annonce sur le site ↗</Link>
        </p>
      ) : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}

function CustomInput({ f, label, help, value, onChange }: { f: CustomField; label: string; help?: string; value: CustomValue | undefined; onChange: (v: CustomValue) => void }) {
  const v = value ?? "";
  const wide = f.type === "textarea" || f.type === "multiselect";
  const box = (() => {
    switch (f.type) {
      case "textarea": return <textarea className="input" rows={3} maxLength={1000} value={String(v)} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
      case "number": return <input className="input" inputMode="decimal" value={String(v)} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, ""))} />;
      case "date": return <input className="input" type="date" value={String(v)} onChange={(e) => onChange(e.target.value)} />;
      case "url": return <input className="input" type="url" value={String(v)} placeholder={f.placeholder || "https://"} onChange={(e) => onChange(e.target.value)} />;
      case "select": case "multiselect": return null; // champ déroulant (Picker) plus bas
      case "checkbox": return null;
      default: return <input className="input" maxLength={300} value={String(v)} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
    }
  })();
  if (f.type === "checkbox") {
    return (
      <div>
        <Chip on={value === true} onClick={() => onChange(value !== true)} multi>{label}</Chip>
        {help ? <p className="mt-1 text-xs text-muted">{help}</p> : null}
      </div>
    );
  }
  if (f.type === "select" || f.type === "multiselect") {
    const cur = Array.isArray(v) ? v : [];
    return (
      <div className="sm:col-span-2">
        <Picker label={`${label}${f.visibility === "private" ? " · privé" : ""}`} multi={f.type === "multiselect"}
          options={f.options.map((o) => ({ value: o, label: o }))} value={f.type === "multiselect" ? cur : String(v)} onChange={(x) => onChange(x)} />
        {help ? <p className="mt-1 text-xs text-muted">{help}</p> : null}
      </div>
    );
  }
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <Field label={`${label}${f.unit && f.type === "number" ? ` (${f.unit})` : ""}${f.visibility === "private" ? " · privé" : ""}`}>{box}</Field>
      {help ? <p className="mt-1 text-xs text-muted">{help}</p> : null}
    </div>
  );
}

function Num({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return (
    <Field label={label}>
      <input className="input" inputMode="numeric" value={v} onChange={(e) => on(e.target.value.replace(/[^0-9]/g, ""))} />
    </Field>
  );
}

/** Pastille sélectionnable : rond = un seul choix, carré coché = plusieurs choix. */
function Chip({ on, onClick, multi, children }: { on: boolean; onClick: () => void; multi?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} role={multi ? "checkbox" : "radio"} aria-checked={on}
      className={"inline-flex min-h-[40px] items-center gap-2 rounded-full border-2 px-3.5 py-1.5 text-sm font-semibold transition active:scale-[.97] " + (on ? "border-accent-600 bg-accent-50 text-accent-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>
      <span aria-hidden className={"grid h-4 w-4 shrink-0 place-items-center border-2 " + (multi ? "rounded-[5px] " : "rounded-full ") + (on ? "border-accent-600 bg-accent-600 text-white" : "border-slate-300 bg-white")}>
        {on ? (multi
          ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
          : <span className="h-1.5 w-1.5 rounded-full bg-white" />) : null}
      </span>
      {children}
    </button>
  );
}

/** Titre ou fréquence qui évoquent la courte durée (meublé, nuitée, location au jour). */
const SHORT_STAY_HINT = /meubl|courte dur|nuit[ée]e?s?\b|par nuit|par jour|par semaine|week-?end|espace (é|e)v(é|e)nementiel|salle des f(ê|e)tes/i;

/** Meublés → Moboo Resi ; espaces événementiels → Moboo Event (règle de la plateforme). */
function ShortStayNotice({ soft }: { soft?: boolean }) {
  return (
    <div className={"rounded-2xl p-4 " + (soft ? "bg-amber-50 ring-1 ring-amber-200" : "bg-brand-50 ring-1 ring-brand-200")}>
      <p className="font-semibold text-ink">{soft ? "Location courte durée ? Elle ne se publie pas ici." : "Les locations courte durée se publient dans nos applications dédiées"}</p>
      <p className="mt-1 text-sm text-slate-600">
        Sur Moboo.ci, les annonces « À louer » sont des locations longue durée. Les résidences meublées et les espaces événementiels
        se publient depuis l’application de gestion : ils apparaissent ensuite automatiquement sur Moboo.ci, avec la réservation en ligne.
      </p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <a href="https://resi.moboo.ci/telecharger" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200 hover:ring-brand-600">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-800 text-white"><SiteIcon value="🛏" size={18} /></span>
          <span><span className="block text-sm font-bold text-ink">Résidence meublée</span><span className="block text-xs text-muted">Publier avec Moboo Resi ↗</span></span>
        </a>
        <a href="https://event.moboo.ci/telecharger" target="_blank" rel="noopener" className="flex items-center gap-3 rounded-xl bg-white p-3 ring-1 ring-slate-200 hover:ring-brand-600">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-accent-600 text-white"><SiteIcon value="🎉" size={18} /></span>
          <span><span className="block text-sm font-bold text-ink">Espace événementiel</span><span className="block text-xs text-muted">Publier avec Moboo Event ↗</span></span>
        </a>
      </div>
    </div>
  );
}

/**
 * Champ déroulant sur une ligne : le choix courant s'affiche dans le champ, un clic
 * ouvre la liste (un seul choix, ou plusieurs avec « multi »).
 */
function Picker({ label, options, value, onChange, multi, max, placeholder = "Choisir…" }: {
  label: string; options: { value: string; label: string }[]; value: string | string[];
  onChange: (v: string | string[]) => void; multi?: boolean; max?: number; placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent | TouchEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away); document.addEventListener("touchstart", away); document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("touchstart", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  const cur = Array.isArray(value) ? value : value === "" && !options.some((o) => o.value === "") ? [] : [value];
  const names = cur.map((v) => options.find((o) => o.value === v)?.label ?? v).filter(Boolean);
  const pick = (v: string) => {
    if (!multi) { onChange(v); setOpen(false); return; }
    const list = cur.includes(v) ? cur.filter((x) => x !== v) : max && cur.length >= max ? cur : [...cur, v];
    onChange(list);
  };
  return (
    <div ref={box} className="relative">
      <span className="mb-1 block text-sm font-semibold text-ink">{label}</span>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open}
        className={"input flex min-h-[44px] w-full items-center gap-2 text-left " + (open ? "ring-2 ring-accent-600" : "")}>
        <span className={"min-w-0 flex-1 truncate " + (names.length ? "text-ink" : "text-slate-400")}>
          {names.length ? (multi && names.length > 2 ? `${names.slice(0, 2).join(", ")} +${names.length - 2}` : names.join(", ")) : placeholder}
        </span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={"shrink-0 text-slate-400 transition " + (open ? "rotate-180" : "")}><path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {open ? (
        <div role="listbox" aria-multiselectable={multi || undefined}
          className="absolute left-0 right-0 z-[70] mt-1 max-h-72 overflow-y-auto rounded-xl bg-white p-1 shadow-xl ring-1 ring-slate-200">
          {options.map((o) => {
            const on = cur.includes(o.value);
            return (
              <button key={o.value || "__vide"} type="button" role="option" aria-selected={on} onClick={() => pick(o.value)}
                className={"flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition " + (on ? "bg-accent-50 font-semibold text-accent-700" : "text-ink hover:bg-slate-50")}>
                <span aria-hidden className={"grid h-4 w-4 shrink-0 place-items-center border-2 " + (multi ? "rounded-[5px] " : "rounded-full ") + (on ? "border-accent-600 bg-accent-600 text-white" : "border-slate-300")}>
                  {on ? (multi
                    ? <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    : <span className="h-1.5 w-1.5 rounded-full bg-white" />) : null}
                </span>
                {o.label}
              </button>
            );
          })}
          {multi ? (
            <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-slate-100 bg-white px-2 pb-1 pt-2">
              <span className="text-xs text-muted">{cur.length} choisi(s){max ? ` sur ${max} au plus` : ""}</span>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-ink px-3 py-1.5 text-xs font-semibold text-white">OK</button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/** Recherche d'adresse (système de carte et pays du back-office → Cartes). */
function AddressSearch({ onPick }: { onPick: (h: { label: string; lat: number; lng: number }) => void }) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<{ label: string; lat: number; lng: number }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const search = async () => {
    if (q.trim().length < 3) return;
    setBusy(true);
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const d = await r.json();
      setHits(Array.isArray(d) ? d : []);
    } catch { setHits([]); } finally { setBusy(false); }
  };
  return (
    <Field label="Rechercher l’adresse">
      <div className="flex gap-2">
        <input className="input flex-1" value={q} placeholder="Ex. Cocody Riviera 2, Abidjan" onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); search(); } }} />
        <button type="button" onClick={search} disabled={busy} className="rounded-lg border border-slate-300 bg-white px-3 text-sm font-semibold text-ink hover:bg-slate-50 disabled:opacity-50">{busy ? "…" : "Chercher"}</button>
      </div>
      {hits ? (
        hits.length ? (
          <ul className="mt-1 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white text-sm">
            {hits.map((h) => (
              <li key={`${h.lat},${h.lng}`}><button type="button" className="w-full px-3 py-2 text-left hover:bg-slate-50" onClick={() => { onPick(h); setHits(null); }}>{h.label}</button></li>
            ))}
          </ul>
        ) : <p className="mt-1 text-xs text-muted">Aucun résultat : précisez le quartier et la ville.</p>
      ) : null}
    </Field>
  );
}
