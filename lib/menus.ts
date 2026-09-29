// Menus du site « façon WordPress » (module neutre : rendu serveur, en-tête
// client et éditeur du back-office). Plusieurs menus, chacun placé dans un
// emplacement (en-tête, téléphone, bas de page) ; un élément de 1er niveau peut
// être un menu déroulant simple ou un méga menu (colonnes + carte mise en avant).

export interface MenuItem {
  id: string;
  label: string;
  href: string;
  newTab?: boolean;
  /** Petite ligne sous le libellé (méga menu, menu téléphone). */
  description?: string;
  /** Pastille (« Nouveau », « -20 % »…). */
  badge?: string;
  /** Emoji ou pictogramme court devant le libellé. */
  icon?: string;
  /** Afficher comme un bouton (1er niveau). */
  highlight?: boolean;
  /** 1er niveau : méga menu (les sous-éléments deviennent des colonnes). */
  mega?: boolean;
  megaColumns?: number;
  promoImage?: string;
  promoTitle?: string;
  promoText?: string;
  promoHref?: string;
  promoCta?: string;
  children?: MenuItem[];
}

export interface SiteMenu { id: string; name: string; items: MenuItem[] }

export type MenuLocation = "header" | "mobile" | "footerBottom";
export const MENU_LOCATIONS: { id: MenuLocation; label: string; help: string }[] = [
  { id: "header", label: "Menu principal (en-tête)", help: "Barre de navigation de l’ordinateur, avec menus déroulants et méga menus." },
  { id: "mobile", label: "Menu du téléphone", help: "Panneau ouvert par le bouton ☰. Vide : même menu que l’en-tête." },
  { id: "footerBottom", label: "Liens du bas de page", help: "Petits liens à côté du copyright (mentions légales, contact…)." },
];

export interface MenuStyle {
  /** Présentation des liens de 1er niveau. */
  variant: "simple" | "underline" | "pill" | "bold";
  /** Ouverture des sous-menus. */
  trigger: "hover" | "click";
  /** Largeur du méga menu. */
  megaWidth: "container" | "full";
  uppercase: boolean;
  /** Flèche ▾ à côté des éléments qui ont un sous-menu. */
  showCaret: boolean;
}

export const MENU_VARIANTS: { value: MenuStyle["variant"]; label: string }[] = [
  { value: "simple", label: "Simple" },
  { value: "underline", label: "Souligné" },
  { value: "pill", label: "Pastille" },
  { value: "bold", label: "Gras" },
];

export const DEFAULT_MENU_STYLE: MenuStyle = { variant: "pill", trigger: "hover", megaWidth: "container", uppercase: false, showCaret: true };

let seq = 0;
export const menuId = () => `m${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

const L = (id: string, label: string, href: string, extra: Partial<MenuItem> = {}): MenuItem => ({ id, label, href, ...extra });

const byType = (tx: string, prefix: string): MenuItem => L(`${prefix}-types`, "Par type de bien", `/annonces?transaction=${tx}`, {
  children: [
    L(`${prefix}-t1`, "Appartements", `/annonces?transaction=${tx}&propertyType=appartement`, { icon: "🏢" }),
    L(`${prefix}-t2`, "Villas", `/annonces?transaction=${tx}&propertyType=villa`, { icon: "🏡" }),
    L(`${prefix}-t3`, "Maisons", `/annonces?transaction=${tx}&propertyType=maison`, { icon: "🏠" }),
    L(`${prefix}-t4`, "Studios", `/annonces?transaction=${tx}&propertyType=studio`, { icon: "🛏️" }),
    L(`${prefix}-t5`, "Bureaux & commerces", `/annonces?transaction=${tx}&propertyType=bureau`, { icon: "🏬" }),
  ],
});
const byCity = (tx: string, prefix: string): MenuItem => L(`${prefix}-cities`, "Quartiers populaires", `/annonces?transaction=${tx}`, {
  children: ["Cocody", "Riviera", "Marcory", "Plateau", "Yopougon", "Bingerville"].map((c, i) =>
    L(`${prefix}-c${i}`, c, `/annonces?transaction=${tx}&q=${encodeURIComponent(c)}`)),
});

export const DEFAULT_MENUS: SiteMenu[] = [
  {
    id: "principal",
    name: "Menu principal",
    items: [
      L("louer", "Louer", "/annonces?transaction=rent", {
        mega: true, megaColumns: 3,
        promoTitle: "Vous êtes propriétaire ?", promoText: "Publiez votre bien gratuitement et recevez des demandes en direct.",
        promoHref: "/publier", promoCta: "Publier une annonce",
        children: [
          byType("rent", "louer"),
          byCity("rent", "louer"),
          L("louer-budget", "Par budget", "/annonces?transaction=rent", {
            children: [
              L("louer-b1", "Moins de 100 000 FCFA", "/annonces?transaction=rent&priceMax=100000"),
              L("louer-b2", "100 000 à 300 000 FCFA", "/annonces?transaction=rent&priceMin=100000&priceMax=300000"),
              L("louer-b3", "300 000 à 700 000 FCFA", "/annonces?transaction=rent&priceMin=300000&priceMax=700000"),
              L("louer-b4", "Plus de 700 000 FCFA", "/annonces?transaction=rent&priceMin=700000"),
            ],
          }),
        ],
      }),
      L("acheter", "Acheter", "/annonces?transaction=sale", {
        mega: true, megaColumns: 3,
        promoTitle: "Calculez votre crédit", promoText: "Estimez vos mensualités avant de visiter.", promoHref: "/#section-calculator-main", promoCta: "Ouvrir le calculateur",
        children: [
          byType("sale", "acheter"),
          byCity("sale", "acheter"),
          L("acheter-terrains", "Terrains", "/annonces?propertyType=terrain", {
            children: [
              L("acheter-l1", "Terrains à Bingerville", "/annonces?propertyType=terrain&q=Bingerville"),
              L("acheter-l2", "Terrains à Grand-Bassam", "/annonces?propertyType=terrain&q=Grand-Bassam"),
              L("acheter-l3", "Terrains à Songon", "/annonces?propertyType=terrain&q=Songon"),
            ],
          }),
        ],
      }),
      L("meubles", "Meublés", "/annonces?transaction=furnished", { badge: "Séjour" }),
      L("espaces", "Espaces", "/annonces?transaction=event", {
        children: [
          L("espaces-1", "Salles de fête", "/annonces?transaction=event&q=salle", { description: "Mariages, anniversaires, baptêmes" }),
          L("espaces-2", "Espaces de réunion", "/annonces?transaction=event&q=réunion", { description: "Séminaires et formations" }),
          L("espaces-3", "Réserver en ligne", "/reserver", { description: "Disponibilités en temps réel" }),
        ],
      }),
      L("pros", "Professionnels", "/forfaits", {
        children: [
          L("pros-1", "Publier une annonce", "/publier"),
          L("pros-2", "Forfaits et tarifs", "/forfaits"),
          L("pros-3", "Espace pro", "/compte?mode=identifiant"),
        ],
      }),
    ],
  },
  {
    id: "legal",
    name: "Liens légaux",
    items: [
      L("legal-1", "Forfaits", "/forfaits"),
      L("legal-2", "Blog", "https://moboo.ci/blog", { newTab: true }),
    ],
  },
];

export const DEFAULT_LOCATIONS: Record<MenuLocation, string> = { header: "principal", mobile: "", footerBottom: "legal" };

/** Liens sûrs uniquement (interne, http(s), tel, mailto, ancre). */
export function safeHref(h: string | undefined): string {
  const s = String(h || "").trim();
  if (!s) return "#";
  if (/^(https?:|mailto:|tel:)/i.test(s) || s.startsWith("/") || s.startsWith("#") || s.startsWith("?")) return s;
  return /^[a-z][a-z0-9+.-]*:/i.test(s) ? "#" : `/${s}`;
}

/** Menu placé dans un emplacement (le téléphone reprend l'en-tête si vide). */
export function menuAt(menus: SiteMenu[], locations: Partial<Record<MenuLocation, string>>, loc: MenuLocation): MenuItem[] {
  const id = locations[loc] || (loc === "mobile" ? locations.header : "");
  return menus.find((m) => m.id === id)?.items ?? [];
}

/* ─── Arbre ⇄ liste à plat (éditeur façon WordPress : glisser + décaler) ─── */
export type FlatItem = Omit<MenuItem, "children"> & { depth: number };
export const MAX_DEPTH = 2;

export function flatten(items: MenuItem[], depth = 0): FlatItem[] {
  return items.flatMap(({ children, ...it }) => [{ ...it, depth }, ...flatten(children ?? [], depth + 1)]);
}

export function unflatten(flat: FlatItem[]): MenuItem[] {
  const root: MenuItem[] = [];
  const stack: MenuItem[][] = [root];
  let prevDepth = 0;
  for (const { depth: d0, ...it } of flat) {
    const depth = Math.max(0, Math.min(d0, prevDepth + 1, MAX_DEPTH));
    const node: MenuItem = { ...it };
    stack.length = depth + 1;
    stack[depth].push(node);
    node.children = [];
    stack[depth + 1] = node.children;
    prevDepth = depth;
  }
  const prune = (list: MenuItem[]): MenuItem[] => list.map((n) => (n.children?.length ? { ...n, children: prune(n.children) } : (({ children, ...rest }) => rest)(n)));
  return prune(root);
}

export function normalizeMenus(menus: unknown, legacy?: { label: string; href: string }[]): SiteMenu[] {
  const fix = (items: unknown, depth = 0): MenuItem[] =>
    (Array.isArray(items) ? items : []).filter((x) => x && typeof x === "object").map((x: any) => ({
      ...x,
      id: typeof x.id === "string" && x.id ? x.id : menuId(),
      label: String(x.label ?? ""),
      href: String(x.href ?? ""),
      ...(depth < MAX_DEPTH && Array.isArray(x.children) && x.children.length ? { children: fix(x.children, depth + 1) } : { children: undefined }),
    }));
  if (Array.isArray(menus) && menus.length) {
    return menus.filter((m: any) => m && typeof m.id === "string").map((m: any) => ({ id: m.id, name: String(m.name || "Menu"), items: fix(m.items) }));
  }
  // Ancien format (liste de liens) : devient le menu principal.
  if (legacy?.length) {
    return [{ id: "principal", name: "Menu principal", items: legacy.map((l, i) => ({ id: `l${i}`, label: l.label, href: l.href })) }, DEFAULT_MENUS[1]];
  }
  return structuredClone(DEFAULT_MENUS);
}
