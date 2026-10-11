// Liens universels iPhone : quelles adresses moboo.ci s'ouvrent dans l'application
// Moboo.ci (comme assetlinks.json pour Android). Les pages de paiement, d'achat
// et d'administration restent dans Safari. Activé dès que APPLE_TEAM_ID est défini.
export const dynamic = "force-dynamic";

const WEB_ONLY = [
  "/admin*", "/administration*", "/api/*", "/compte/*",
  "*checkout*", "*payment*", "*paiement*", "*subscription*", "*abonnement*", "*membership*",
  "*select-your-package*", "/forfaits*", "/cart*", "/panier*", "*order-received*", "*order-pay*",
  "*paypal*", "*stripe*", "*cinetpay*", "/wave*", "*orange-money*", "*mtn-money*", "*moov*",
  "/mon-espace/publicite*", "/stop*",
];

export function GET() {
  const team = (process.env.APPLE_TEAM_ID || "").trim();
  if (!/^[A-Z0-9]{10}$/.test(team)) return new Response("Not found", { status: 404 });
  const apps = (process.env.APPLE_APP_BUNDLES || "com.moboo.ci.app").split(",").map((b) => `${team}.${b.trim()}`).filter(Boolean);
  const body = {
    applinks: {
      details: [{
        appIDs: apps,
        components: [
          { "?": { moboo_t: "*" }, exclude: true, comment: "jeton de paiement : navigateur" },
          ...WEB_ONLY.map((p) => ({ "/": p, exclude: true })),
          { "/": "*" },
        ],
      }],
    },
    webcredentials: { apps },
  };
  return new Response(JSON.stringify(body), { headers: { "content-type": "application/json", "cache-control": "public, max-age=3600" } });
}
