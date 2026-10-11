"use client";

import Link from "next/link";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { COMMUNES, LISTING_FEATURES, PROPERTY_TYPES } from "@/lib/accounts";
import { saveListingAction, uploadImageAction } from "@/app/mon-espace/actions";

const STEPS = ["L'essentiel", "Détails", "Équipements", "Localisation", "Photos & vidéo", "Plans & lots", "Contact"];
const CONTACT_STEP = STEPS.length - 1;
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
};
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
}: {
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
  const fileRef = useRef<HTMLInputElement>(null);
  const set = (p: Partial<ListingDraft>) => { setD((x) => ({ ...x, ...p })); setError(null); setSaved(false); };

  function validate(s: number): string | null {
    if (s === 0) {
      if (d.title.trim().length < 8) return "Donnez un titre clair (8 caractères minimum).";
      if (!(Number(d.price) > 0)) return "Indiquez le prix.";
    }
    if (s === 1 && d.description.trim().length < 40) return "Décrivez le bien (40 caractères minimum).";
    if (s === 3 && !d.city.trim()) return "Indiquez la ville.";
    if (s === CONTACT_STEP && d.contactPhone.replace(/[^0-9]/g, "").length < 8) return "Indiquez un numéro de contact.";
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
  const setExtra = (i: number, p: Partial<{ title: string; value: string }>) => set({ additional: d.additional.map((x, j) => (j === i ? { ...x, ...p } : x)) });

  function save() {
    for (let s = 0; s < STEPS.length; s++) {
      const err = validate(s);
      if (err) { setStep(s); setError(err); return; }
    }
    start(async () => {
      const r = await saveAction(id ?? null, payload());
      if (!r.ok) return setError(r.error ?? "Erreur.");
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
      <div className="-mx-1 mb-6 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {STEPS.map((s, i) => (
          <button key={s} type="button" disabled={!edit && i > step}
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
        {step === 0 ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {([["rent", "À louer", "Location longue durée"], ["sale", "À vendre", "Vente"]] as const).map(([k, l, h]) => (
                <button key={k} type="button" onClick={() => set({ transaction: k })}
                  className={"rounded-2xl border-2 p-4 text-left transition " + (d.transaction === k ? "border-accent-600 bg-accent-50" : "border-slate-200 hover:border-slate-300")}>
                  <span className="block font-display text-lg font-bold text-ink">{l}</span>
                  <span className="block text-xs text-muted">{h}</span>
                </button>
              ))}
            </div>
            <Field label="Type de bien">
              <div className="flex flex-wrap gap-2">
                {types.map((t) => (
                  <Chip key={t.key} on={d.propertyType === t.key} onClick={() => set({ propertyType: t.key })}>{t.label}</Chip>
                ))}
              </div>
            </Field>
            <Field label="Titre de l'annonce *">
              <input className="input" value={d.title} maxLength={140} placeholder="Ex. Appartement 3 pièces lumineux à Riviera 2"
                onChange={(e) => set({ title: e.target.value })} />
            </Field>
            <Field label={d.transaction === "rent" ? "Loyer mensuel (FCFA) *" : "Prix de vente (FCFA) *"}>
              <input className="input" inputMode="numeric" value={d.price} placeholder="Ex. 250000"
                onChange={(e) => set({ price: e.target.value.replace(/[^0-9]/g, "") })} />
              {Number(d.price) > 0 ? <p className="mt-1 text-xs text-muted">{d.pricePrefix ? `${d.pricePrefix} ` : ""}{new Intl.NumberFormat("fr-FR").format(Number(d.price))} FCFA{d.pricePostfix ? ` ${d.pricePostfix}` : d.transaction === "rent" ? " / mois" : ""}</p> : null}
            </Field>
            <details className="rounded-2xl border border-slate-200 p-4" open={!!(d.pricePrefix || d.pricePostfix || d.secondaryPrice)}>
              <summary className="cursor-pointer text-sm font-semibold text-ink">Options de prix (facultatif)</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <Field label="Condition de prix"><input className="input" value={d.pricePrefix} maxLength={40} placeholder="Ex. À partir de" onChange={(e) => set({ pricePrefix: e.target.value })} /></Field>
                <Field label="Fréquence de paiement">
                  <select className="input" value={FREQ.includes(d.pricePostfix) ? d.pricePostfix : ""} onChange={(e) => set({ pricePostfix: e.target.value })}>
                    {FREQ.map((f) => <option key={f} value={f}>{f || (d.transaction === "rent" ? "par mois (défaut)" : "—")}</option>)}
                  </select>
                </Field>
                <Field label="Prix promotionnel"><input className="input" inputMode="numeric" value={d.secondaryPrice} placeholder="Ex. 230000" onChange={(e) => set({ secondaryPrice: e.target.value.replace(/[^0-9]/g, "") })} /></Field>
              </div>
            </details>
            {LABELS.length ? (
              <Field label="Étiquettes (5 au plus)">
                <div className="flex flex-wrap gap-2">
                  {LABELS.map((t) => {
                    const on = d.labels.includes(t.key);
                    return <Chip key={t.key} on={on} onClick={() => set({ labels: on ? d.labels.filter((x) => x !== t.key) : [...d.labels, t.key].slice(0, 5) })}>{on ? "✓ " : ""}{t.label}</Chip>;
                  })}
                </div>
              </Field>
            ) : null}
          </>
        ) : null}

        {step === 1 ? (
          <>
            <Field label="Description *">
              <textarea className="input min-h-[140px]" value={d.description} maxLength={4000}
                placeholder="Pièces, état, points forts, environnement, conditions (avance, caution)…"
                onChange={(e) => set({ description: e.target.value })} />
              <p className="mt-1 text-xs text-muted">{d.description.trim().length} caractères</p>
            </Field>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Num label="Chambres" v={d.bedrooms} on={(v) => set({ bedrooms: v })} />
              <Num label="Salles de bain" v={d.bathrooms} on={(v) => set({ bathrooms: v })} />
              <Num label="Garages" v={d.garage} on={(v) => set({ garage: v })} />
              <Num label={`Surface (${d.sizeUnit || "m²"})`} v={d.surface} on={(v) => set({ surface: v })} />
              <Num label="Année de construction" v={d.yearBuilt} on={(v) => set({ yearBuilt: v })} />
              <Field label="Unité de surface">
                <select className="input" value={d.sizeUnit} onChange={(e) => set({ sizeUnit: e.target.value })}>{AREA_UNITS.map((u) => <option key={u}>{u}</option>)}</select>
              </Field>
              <Num label={`Terrain (${d.landAreaUnit || "m²"})`} v={d.landArea} on={(v) => set({ landArea: v })} />
              <Field label="Unité du terrain">
                <select className="input" value={d.landAreaUnit} onChange={(e) => set({ landAreaUnit: e.target.value })}>{AREA_UNITS.map((u) => <option key={u}>{u}</option>)}</select>
              </Field>
              <Field label="Taille du garage"><input className="input" value={d.garageSize} maxLength={40} placeholder="Ex. 2 voitures" onChange={(e) => set({ garageSize: e.target.value })} /></Field>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">Détails supplémentaires</p>
              <div className="space-y-2">
                {d.additional.map((a, i) => (
                  <div key={i} className="flex gap-2">
                    <input className="input" value={a.title} maxLength={60} placeholder="Ex. Eau" onChange={(e) => setExtra(i, { title: e.target.value })} />
                    <input className="input" value={a.value} maxLength={160} placeholder="Ex. Forage + SODECI" onChange={(e) => setExtra(i, { value: e.target.value })} />
                    <button type="button" aria-label="Retirer" className="shrink-0 rounded-lg px-3 text-red-600 ring-1 ring-red-200" onClick={() => set({ additional: d.additional.filter((_, j) => j !== i) })}>✕</button>
                  </div>
                ))}
              </div>
              {d.additional.length < 20 ? <button type="button" className="btn-ghost mt-2" onClick={() => set({ additional: [...d.additional, { title: "", value: "" }] })}>＋ Ajouter un détail</button> : null}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <p className="text-sm text-muted">Cochez ce qui s'applique : c'est ce que les visiteurs regardent en premier.</p>
            <div className="flex flex-wrap gap-2">
              {[...FEATURES, ...d.features.filter((f) => !FEATURES.includes(f))].map((f) => {
                const on = d.features.includes(f);
                return <Chip key={f} on={on} onClick={() => set({ features: on ? d.features.filter((x) => x !== f) : [...d.features, f] })}>{on ? "✓ " : ""}{f}</Chip>;
              })}
            </div>
            <div className="flex gap-2">
              <input className="input" value={customFeature} placeholder="Autre équipement…" onChange={(e) => setCustomFeature(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && customFeature.trim()) { e.preventDefault(); set({ features: [...d.features, customFeature.trim()] }); setCustomFeature(""); } }} />
              <button type="button" className="btn-ghost shrink-0" onClick={() => { if (customFeature.trim()) { set({ features: [...d.features, customFeature.trim()] }); setCustomFeature(""); } }}>Ajouter</button>
            </div>
          </>
        ) : null}

        {step === 3 ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Ville *"><input className="input" value={d.city} onChange={(e) => set({ city: e.target.value })} /></Field>
              <Field label="Commune">
                <select className="input" value={AREAS.includes(d.commune) || !d.commune ? d.commune : "__autre"} onChange={(e) => set({ commune: e.target.value === "__autre" ? "" : e.target.value })}>
                  <option value="">— Choisir —</option>
                  {AREAS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Quartier"><input className="input" value={d.quartier} placeholder="Ex. Riviera 2, Zone 4…" onChange={(e) => set({ quartier: e.target.value })} /></Field>
              <Field label="Adresse (non affichée)"><input className="input" value={d.address} placeholder="Rue, repère…" onChange={(e) => set({ address: e.target.value })} /></Field>
              <Field label="Code postal / boîte postale"><input className="input" value={d.postalCode} maxLength={12} placeholder="Ex. 01 BP 1234" onChange={(e) => set({ postalCode: e.target.value })} /></Field>
            </div>
            <AddressSearch onPick={(h) => { set({ latitude: h.lat, longitude: h.lng }); setMapsLink(`${h.lat.toFixed(6)}, ${h.lng.toFixed(6)}`); }} />
            <Field label="Position sur la carte (recommandé)">
              <input className="input" value={mapsLink} placeholder="Collez un lien Google Maps ou « latitude, longitude »"
                onChange={(e) => { setMapsLink(e.target.value); const p = parseCoords(e.target.value); if (p) set({ latitude: p[0], longitude: p[1] }); }} />
              {d.latitude != null && d.longitude != null ? (
                <p className="mt-1 flex items-center gap-2 text-xs text-emerald-700">
                  ✓ Position enregistrée ({d.latitude.toFixed(4)}, {d.longitude.toFixed(4)})
                  <button type="button" className="font-semibold text-red-600" onClick={() => { set({ latitude: null, longitude: null }); setMapsLink(""); }}>Retirer</button>
                </p>
              ) : mapsLink ? <p className="mt-1 text-xs text-amber-700">Lien court non reconnu : ouvrez-le puis copiez l'adresse complète de la page.</p> : null}
            </Field>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <p className="text-sm text-muted">
              Jusqu'à {MAX_PHOTOS} photos, compressées automatiquement. La 1re est la couverture — utilisez ◀ ▶ pour l'ordre.
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
                    <button type="button" onClick={() => set({ photos: d.photos.filter((p) => p !== src) })} className="rounded bg-red-600 px-1.5 text-xs font-bold text-white">✕</button>
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
            <Field label="Vidéo (optionnel)">
              <input className="input" value={d.videoUrl} placeholder="Lien YouTube ou TikTok" onChange={(e) => set({ videoUrl: e.target.value })} />
            </Field>
            <Field label="Visite virtuelle 360° (optionnel)">
              <input className="input" value={d.virtualTour} placeholder="Lien Matterport, Kuula… ou code <iframe> à coller" onChange={(e) => set({ virtualTour: e.target.value })} />
            </Field>
          </>
        ) : null}

        {step === 5 ? (
          <>
            <div>
              <p className="font-display text-base font-bold text-ink">Plans (facultatif)</p>
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
            </div>
            <div>
              <p className="font-display text-base font-bold text-ink">Lots et sous-annonces (facultatif)</p>
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
            </div>
          </>
        ) : null}

        {step === CONTACT_STEP ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nom affiché"><input className="input" value={d.contactName} onChange={(e) => set({ contactName: e.target.value })} /></Field>
              <Field label="Téléphone / WhatsApp *"><input className="input" inputMode="tel" value={d.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} /></Field>
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
            <Field label="Mention légale (facultatif)">
              <textarea className="input" rows={2} value={d.disclaimer} maxLength={600} placeholder="Ex. Prix hors frais d’agence, sous réserve de disponibilité." onChange={(e) => set({ disclaimer: e.target.value })} />
            </Field>
            <Field label="Note privée (visible par vous seul)">
              <textarea className="input" rows={2} value={d.privateNote} maxLength={2000} placeholder="Ex. Clés chez le gardien, propriétaire joignable le soir…" onChange={(e) => set({ privateNote: e.target.value })} />
            </Field>
          </>
        ) : null}
      </div>

      {error ? <p className="mt-5 rounded-xl bg-red-50 p-3 text-sm font-medium text-red-700">{error}</p> : null}
      {saved ? <p className="mt-5 rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-700">Modifications enregistrées ✓</p> : null}

      <div className="mt-6 flex flex-wrap gap-3">
        {step > 0 ? <button type="button" className="btn-ghost" onClick={() => { setStep((s) => s - 1); setError(null); }}>Retour</button> : null}
        {edit ? (
          <>
            {step < STEPS.length - 1 ? <button type="button" className="btn-ghost" onClick={next}>Étape suivante</button> : null}
            <button type="button" onClick={save} disabled={pending || !!uploading} className="btn-primary flex-1 bg-accent-600 hover:bg-accent-700 disabled:opacity-60">
              {pending ? "Enregistrement…" : "Enregistrer les modifications"}
            </button>
          </>
        ) : (
          <button type="button" onClick={next} disabled={pending || !!uploading} className="btn-primary flex-1 bg-accent-600 hover:bg-accent-700 disabled:opacity-60">
            {pending ? "Publication…" : step === STEPS.length - 1 ? "Publier l'annonce" : "Continuer"}
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

function Num({ label, v, on }: { label: string; v: string; on: (v: string) => void }) {
  return (
    <Field label={label}>
      <input className="input" inputMode="numeric" value={v} onChange={(e) => on(e.target.value.replace(/[^0-9]/g, ""))} />
    </Field>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={"rounded-full border px-3 py-1.5 text-sm font-semibold transition " + (on ? "border-accent-600 bg-accent-50 text-accent-700" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300")}>
      {children}
    </button>
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
