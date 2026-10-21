// Formulaire de publication et espace membre réglables depuis le back-office
// (Formulaires). Mêmes règles que l'API (src/modules/site-settings/form-config.ts) :
// le site affiche, l'API fait respecter.

export type FieldMode = "optional" | "required" | "hidden" | "team";
export interface FieldRule {
  mode?: FieldMode; label?: string; help?: string;
  types?: string[]; transactions?: string[]; propertyTypes?: string[];
}
export type CustomType = "text" | "textarea" | "number" | "select" | "multiselect" | "checkbox" | "date" | "url";
export interface CustomField extends FieldRule {
  key: string; label: string; type: CustomType; step: StepId; options: string[];
  visibility: "public" | "private"; placeholder?: string; unit?: string;
}
export interface ListingFormConfig {
  /** steps : étapes avec onglets (défaut) ; single : tout sur une seule page. */
  layout?: "steps" | "single";
  /** Ordre des étapes (pages du formulaire de l'application, Builder). */
  order?: StepId[];
  /** types : profils qui voient l'étape (vide : tous), repris des rôles de la page dans l'application. */
  steps: Partial<Record<StepId, { hidden?: boolean; label?: string; types?: string[] }>>;
  fields: Record<string, FieldRule>;
  custom: CustomField[];
}
export interface MemberSpaceConfig {
  items: Record<string, { enabled?: boolean; label?: string; types?: string[] }>;
  /** Actions à l'intérieur des pages (catalogue : lib/member-actions.ts). */
  actions: Record<string, { enabled?: boolean; types?: string[] }>;
}

// Mêmes pages, dans le même ordre, que « Publier une annonce » de l'application Moboo.ci.
export type StepId = "essentiel" | "medias" | "details" | "equipements" | "localisation" | "visite" | "lots" | "plans" | "contact" | "reglages" | "note" | "rgpd";
export const FORM_STEPS: { id: StepId; label: string; lockable?: boolean }[] = [
  { id: "essentiel", label: "Informations", lockable: true },
  { id: "medias", label: "Photos & vidéo" },
  { id: "details", label: "Détails" },
  { id: "equipements", label: "Équipements" },
  { id: "localisation", label: "Adresse" },
  { id: "visite", label: "Visite 360°" },
  { id: "lots", label: "Sous-annonces" },
  { id: "plans", label: "Plans" },
  { id: "contact", label: "Contact" },
  { id: "reglages", label: "Réglages" },
  { id: "note", label: "Note privée" },
  { id: "rgpd", label: "Accord RGPD" },
];

export interface BuiltinField { key: string; label: string; step: StepId; core?: boolean; defaultMode?: FieldMode; hint?: string }
/** Champs intégrés du formulaire (mêmes que l'application Moboo.ci). */
export const BUILTIN_FIELDS: BuiltinField[] = [
  { key: "transaction", label: "Louer / vendre", step: "essentiel", core: true },
  { key: "propertyType", label: "Type de bien", step: "essentiel", core: true },
  { key: "title", label: "Titre de l'annonce", step: "essentiel", core: true },
  { key: "price", label: "Prix", step: "essentiel", core: true },
  { key: "pricePrefix", label: "Condition de prix", step: "essentiel", hint: "Ex. « À partir de »" },
  { key: "pricePostfix", label: "Fréquence de paiement", step: "essentiel" },
  { key: "secondaryPrice", label: "Prix promotionnel", step: "essentiel" },
  { key: "labels", label: "Étiquettes", step: "essentiel", hint: "Exclusivité, Nouveau…" },
  { key: "description", label: "Description", step: "essentiel", defaultMode: "required" },
  { key: "bedrooms", label: "Chambres", step: "details" },
  { key: "bathrooms", label: "Salles de bain", step: "details" },
  { key: "garage", label: "Garages", step: "details" },
  { key: "surface", label: "Surface (et unité)", step: "details" },
  { key: "yearBuilt", label: "Année de construction", step: "details" },
  { key: "landArea", label: "Terrain (et unité)", step: "details" },
  { key: "garageSize", label: "Taille du garage", step: "details" },
  { key: "additional", label: "Détails supplémentaires (libres)", step: "details" },
  { key: "features", label: "Équipements", step: "equipements" },
  { key: "city", label: "Ville", step: "localisation", core: true },
  { key: "commune", label: "Commune", step: "localisation" },
  { key: "quartier", label: "Quartier", step: "localisation" },
  { key: "address", label: "Adresse (non affichée)", step: "localisation" },
  { key: "postalCode", label: "Code postal / boîte postale", step: "localisation" },
  { key: "map", label: "Position sur la carte", step: "localisation" },
  { key: "photos", label: "Photos", step: "medias" },
  { key: "videoUrl", label: "Vidéo", step: "medias" },
  { key: "virtualTour", label: "Visite virtuelle 360°", step: "visite" },
  { key: "units", label: "Lots et sous-annonces", step: "lots" },
  { key: "floorPlans", label: "Plans", step: "plans" },
  { key: "contactName", label: "Nom affiché", step: "contact" },
  { key: "contactPhone", label: "Téléphone / WhatsApp", step: "contact", core: true },
  { key: "disclaimer", label: "Mention légale", step: "reglages" },
  { key: "privateNote", label: "Note privée", step: "note" },
  { key: "gdpr", label: "Accord RGPD (case à cocher)", step: "rgpd", defaultMode: "required" },
];

export const MODE_LABEL: Record<FieldMode, string> = {
  optional: "Facultatif", required: "Obligatoire", hidden: "Masqué", team: "Réservé à l'équipe Moboo",
};
export const CUSTOM_TYPE_LABEL: Record<CustomType, string> = {
  text: "Texte court", textarea: "Texte long", number: "Nombre", select: "Liste (un choix)",
  multiselect: "Liste (plusieurs choix)", checkbox: "Case à cocher (oui / non)", date: "Date", url: "Lien (https://)",
};

const obj = (raw: unknown): Record<string, any> => {
  if (typeof raw === "string") { try { raw = raw.trim() ? JSON.parse(raw) : {}; } catch { raw = {}; } }
  return raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, any>) : {};
};

export function parseListingForm(raw: unknown): ListingFormConfig {
  const o = obj(raw);
  return {
    ...(o.layout === "single" ? { layout: "single" as const } : {}),
    steps: obj(o.steps),
    fields: obj(o.fields),
    custom: Array.isArray(o.custom) ? (o.custom as CustomField[]).filter((c) => c && c.key && c.label) : [],
  };
}

export function parseMemberSpace(raw: unknown): MemberSpaceConfig {
  return { items: obj(obj(raw).items), actions: obj(obj(raw).actions) };
}

export interface FieldCtx { accountType?: string | null; transaction?: string | null; propertyType?: string | null; team?: boolean }
export interface FieldView { show: boolean; required: boolean; label: string; help?: string; team: boolean }

function applies(r: FieldRule, ctx: FieldCtx) {
  if (r.types?.length && !ctx.team && !r.types.includes(ctx.accountType || "particulier")) return false;
  if (r.transactions?.length && ctx.transaction && !r.transactions.includes(ctx.transaction)) return false;
  if (r.propertyTypes?.length && ctx.propertyType && !r.propertyTypes.includes(ctx.propertyType)) return false;
  return true;
}

/** Affichage d'un champ (intégré ou créé) pour ce contexte. team = éditeur du back-office. */
export function fieldView(cfg: ListingFormConfig, key: string, ctx: FieldCtx, fallbackLabel = ""): FieldView {
  const builtin = BUILTIN_FIELDS.find((f) => f.key === key);
  const custom = cfg.custom.find((c) => c.key === key);
  const r: FieldRule = custom ?? cfg.fields[key] ?? {};
  const label = r.label || custom?.label || fallbackLabel || builtin?.label || key;
  if (builtin?.core) return { show: true, required: true, label, help: r.help, team: false };
  const step = custom ? custom.step : builtin?.step;
  const mode: FieldMode = r.mode ?? builtin?.defaultMode ?? "optional";
  const team = mode === "team";
  const stepHidden = !!(step && cfg.steps[step]?.hidden);
  const show = (!stepHidden || !!ctx.team) && mode !== "hidden" && (!team || !!ctx.team) && applies(r, ctx);
  return { show, required: show && mode === "required" && !ctx.team, label, help: r.help, team };
}

/** Étapes visibles (toujours l'essentiel et le contact). */
export function visibleSteps(cfg: ListingFormConfig, ctx: FieldCtx) {
  const rank = (id: StepId) => { const i = cfg.order?.indexOf(id) ?? -1; return i < 0 ? 100 + FORM_STEPS.findIndex((s) => s.id === id) : i; };
  const forType = (id: StepId) => { const t = cfg.steps[id]?.types; return !t?.length || t.includes(ctx.accountType || "particulier"); };
  return FORM_STEPS.filter((s) => s.lockable || ctx.team || (!cfg.steps[s.id]?.hidden && forType(s.id)))
    .sort((a, b) => rank(a.id) - rank(b.id))
    .map((s) => ({ ...s, label: cfg.steps[s.id]?.label || s.label }));
}

/** Formulaire de l'application (API /mobile/add-property-form, réglé dans le Builder). */
export interface AppListingForm {
  pages: { step: StepId; label: string; enabled: boolean; types: string[]; team: boolean; fields: { key: string; enabled: boolean; required: boolean; label?: string }[] }[];
}

/**
 * Le site suit le formulaire de l'application : ordre des pages, pages et champs
 * activés ou désactivés, champs obligatoires, profils autorisés. Les réglages du
 * back-office (Formulaires) complètent : champs créés, libellés renommés, champs
 * masqués ou réservés à l'équipe, présentation (une page / par étapes).
 */
export function applyAppForm(cfg: ListingFormConfig, app: AppListingForm | null): ListingFormConfig {
  if (!app?.pages?.length) return cfg;
  const steps: ListingFormConfig["steps"] = { ...cfg.steps };
  const fields: ListingFormConfig["fields"] = { ...cfg.fields };
  const known = new Set(app.pages.map((p) => p.step));
  for (const s of FORM_STEPS) if (!known.has(s.id) && s.id !== "essentiel") steps[s.id] = { ...steps[s.id], hidden: true };
  for (const p of app.pages) {
    if (!p.enabled && p.step !== "essentiel") steps[p.step] = { ...steps[p.step], hidden: true };
    if (p.types.length && p.step !== "essentiel") steps[p.step] = { ...steps[p.step], types: p.types };
    for (const f of p.fields) {
      const builtin = BUILTIN_FIELDS.find((b) => b.key === f.key);
      if (!builtin) continue;
      const r: FieldRule = { ...fields[f.key] };
      if (!r.label && f.label && !builtin.core) r.label = f.label;
      if (!builtin.core && r.mode !== "hidden" && r.mode !== "team") {
        if (!f.enabled) r.mode = "hidden";
        else if (p.team) r.mode = "team";
        else if (f.required) r.mode = "required";
        // Facultatif dans l'application → facultatif sur le site, sauf réglage contraire du back-office.
        else if (!r.mode) r.mode = "optional";
        if (p.types.length && !r.types?.length) r.types = p.types;
      }
      fields[f.key] = r;
    }
  }
  return { ...cfg, steps, fields, order: app.pages.map((p) => p.step) };
}

/** Onglet de l'espace membre visible pour ce profil ? */
export function memberItemOn(cfg: MemberSpaceConfig, key: string, accountType?: string | null) {
  const it = cfg.items[key];
  if (!it) return true;
  if (it.enabled === false && key !== "tableau" && key !== "profil") return false;
  return !it.types?.length || key === "tableau" || key === "profil" || it.types.includes(accountType || "particulier");
}

/** Action de l'espace membre permise pour ce profil ? */
export function memberActionOn(cfg: MemberSpaceConfig, key: string, accountType?: string | null) {
  const a = cfg.actions[key];
  if (!a) return true;
  if (a.enabled === false) return false;
  return !a.types?.length || a.types.includes(accountType || "particulier");
}

/** Valeur lisible d'un champ créé (fiche publique, aperçu). */
export function customDisplay(f: CustomField, v: unknown): string {
  if (v == null || v === "" || v === false) return "";
  if (f.type === "checkbox") return "Oui";
  if (Array.isArray(v)) return v.join(", ");
  if (f.type === "date") { const d = new Date(String(v)); return isNaN(+d) ? String(v) : d.toLocaleDateString("fr-FR"); }
  if (f.type === "number") return `${new Intl.NumberFormat("fr-FR").format(Number(v))}${f.unit ? ` ${f.unit}` : ""}`;
  return `${String(v)}${f.unit ? ` ${f.unit}` : ""}`;
}
