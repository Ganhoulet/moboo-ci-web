// Lecture d'un export WordPress (outil « Exporter » → fichier .xml) dans le
// navigateur : extrait les pages d'annonces (Houzez) et leurs réglages Yoast SEO
// pour les recréer en pages SEO. Même logique que l'import initial de moboo.ci.

export interface ImportedPage {
  slug: string; title: string; seoTitle: string; metaDescription: string; focusKeyword: string;
  content: string; filters: { transaction?: string; propertyType?: string; q?: string };
  perPage: number; hubTab: string; hubColumn: string; status: "published"; wpId: number;
}

const TYPE: Record<string, string> = {
  villa: "villa", "villa-meublee": "villa", appartement: "appartement", "appartement-meublee": "appartement", studio: "studio",
  "studio-meublee": "studio", terrain: "terrain", bureau: "bureau", "espace-coworking": "bureau", boutique: "magasin",
  magasin: "magasin", restaurant: "magasin", "residentiel-meublee": "appartement",
};
const PLACES = ["Abidjan", "Cocody", "Yopougon", "Marcory", "Koumassi", "Plateau", "Treichville", "Adjamé", "Abobo", "Attécoubé", "Port Bouët", "Songon",
  "Bingerville", "Anyama", "Assinie", "Daloa", "Yamoussoukro", "Grand Bassam", "Bouaké", "Abengourou", "Divo", "Korhogo", "Man", "San Pedro"];
const ABIDJAN = new Set(["Abidjan", "Cocody", "Yopougon", "Marcory", "Koumassi", "Plateau", "Treichville", "Adjamé", "Abobo", "Attécoubé", "Port Bouët", "Songon", "Bingerville", "Anyama"]);
const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const decode = (s: string) => { const t = document.createElement("textarea"); t.innerHTML = s; return t.value; };

function tx(t: string) {
  const n = norm(t);
  if (n.includes("evenement") || n.includes("salle")) return "event";
  if (n.includes("meubl") || n.includes("residence")) return "furnished";
  if (n.includes("louer") || n.includes("location")) return "rent";
  if (n.includes("vendre") || n.includes("vente") || n.includes("achat")) return "sale";
  return "";
}
const placeOf = (t: string) => PLACES.find((p) => new RegExp(`\\b${norm(p).replace(/ /g, "\\s")}\\b`).test(norm(t))) ?? "";
function column(t: string, x: string) {
  const n = norm(t).trim();
  if (["a louer", "location", "achat", "acheter", "proprietes commerciales"].includes(n)) return "Recherches populaires";
  if (x === "furnished") return "Résidences meublées";
  if (x === "event") return "Espaces & salles";
  if (n.includes("terrain")) return "Terrains à vendre";
  if (n.includes("maison") || n.includes("villa")) return x === "sale" ? "Maisons à vendre" : "Maisons à louer";
  if (/appartement|studio|chambre|duplex/.test(n)) return x === "sale" ? "Appartements à vendre" : "Appartements à louer";
  return "Bureaux & commerces";
}
const cleanHtml = (h: string) => h.replace(/<!--[\s\S]*?-->/g, "")
  .replace(/href="https?:\/\/(www\.)?moboo\.ci/g, 'href="').replace(/src="\/(?!\/)/g, 'src="https://moboo.ci/').replace(/src="http:\/\/(www\.)?moboo\.ci/g, 'src="https://moboo.ci')
  .replace(/\s(class|style|id|data-[a-z-]+)="[^"]*"/g, "").replace(/[ \t]*\n\s*\n+/g, "\n").trim();

export function parseWordPressExport(xml: string): ImportedPage[] {
  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.getElementsByTagName("parsererror").length) throw new Error("Fichier illisible : choisissez l’export WordPress (.xml).");
  const txt = (el: Element, tag: string) => el.getElementsByTagName(tag)[0]?.textContent ?? "";
  const out: ImportedPage[] = [];
  for (const it of Array.from(doc.getElementsByTagName("item"))) {
    if (txt(it, "wp:post_type") !== "page" || txt(it, "wp:status") !== "publish") continue;
    const meta: Record<string, string> = {};
    for (const m of Array.from(it.getElementsByTagName("wp:postmeta"))) meta[txt(m, "wp:meta_key")] = txt(m, "wp:meta_value");
    const tpl = meta._wp_page_template || "";
    if (!meta.fave_types && !meta._yoast_wpseo_focuskw) continue;
    if (!/property-listings-map|listing|grid|half-map/.test(tpl) && tpl !== "default") continue;
    const slug = txt(it, "link").replace(/^https?:\/\/[^/]+/, "").replace(/^\/+|\/+$/g, "");
    if (!slug) continue;
    const title = decode(txt(it, "title")).trim();
    const x = tx(`${title} ${slug}`) || ({ "a-louer": "rent", "en-vente": "sale" } as Record<string, string>)[meta.fave_status] || "";
    const place = placeOf(title);
    const ptype = x === "furnished" || x === "event" ? "" : TYPE[meta.fave_types] ?? "";
    const seoTitle = (meta._yoast_wpseo_title || "").replace("%%title%%", title).replace("%%page%%", "").replace("%%sep%%", "|").replace("%%sitename%%", "Moboo").replace(/\s+/g, " ").replace(/^[\s|]+|[\s|]+$/g, "");
    out.push({
      slug, title, seoTitle: seoTitle || `${title} | Moboo`, metaDescription: decode(meta._yoast_wpseo_metadesc || ""),
      focusKeyword: decode(meta._yoast_wpseo_focuskw || ""), content: cleanHtml(txt(it, "content:encoded")),
      filters: Object.fromEntries(Object.entries({ transaction: x, propertyType: ptype, q: place }).filter(([, v]) => v)),
      perPage: /^\d+$/.test(meta.fave_prop_no || "") ? Number(meta.fave_prop_no) : 12,
      hubTab: !place ? "Toute la Côte d'Ivoire" : ABIDJAN.has(place) ? "Abidjan" : "Autres villes",
      hubColumn: column(title, x), status: "published", wpId: Number(txt(it, "wp:post_id")) || 0,
    });
  }
  return out;
}
