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
  steps: Partial<Record<StepId, { hidden?: boolean; label?: string }>>;
  fields: Record<string, FieldRule>;
  custom: CustomField[];
}
export interface MemberSpaceConfig {
  items: Record<string, { enabled?: boolean; label?: string; types?: string[] }>;
  /** Actions à l'intérieur des pages (catalogue : lib/member-actions.ts). */
  actions: Record<string, { enabled?: boolean; types?: string[] }>;
}

export type StepId = "essentiel" | "details" | "equipements" | "localisation" | "medias" | "plans" | "contact";
export const FORM_STEPS: { id: StepId; label: string; lockable?: boolean }[] = [
  { id: "essentiel", label: "L'essentiel", lockable: true },
  { id: "details", label: "Détails" },
  { id: "equipements", label: "Équipements" },
  { id: "localisation", label: "Localisation" },
  { id: "medias", label: "Photos & vidéo" },
  { id: "plans", label: "Plans & lots" },
  { id: "contact", label: "Contact", lockable: true },
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
  { key: "description", label: "Description", step: "details", defaultMode: "required" },
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
  { key: "virtualTour", label: "Visite virtuelle 360°", step: "medias" },
  { key: "floorPlans", label: "Plans", step: "plans" },
  { key: "units", label: "Lots et sous-annonces", step: "plans" },
  { key: "contactName", label: "Nom affiché", step: "contact" },
  { key: "contactPhone", label: "Téléphone / WhatsApp", step: "contact", core: true },
  { key: "disclaimer", label: "Mention légale", step: "contact" },
  { key: "privateNote", label: "Note privée", step: "contact" },
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
  return FORM_STEPS.filter((s) => s.lockable || ctx.team || !cfg.steps[s.id]?.hidden).map((s) => ({ ...s, label: cfg.steps[s.id]?.label || s.label }));
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
