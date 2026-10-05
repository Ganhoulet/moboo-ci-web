import type { Metadata } from "next";
import Link from "next/link";
import { API_URL } from "@/lib/api";

export const metadata: Metadata = {
  title: "API pour les agences partenaires — Moboo.ci",
  description: "Reliez le logiciel de votre agence immobilière à Moboo.ci : publication automatique des annonces, demandes en temps réel, statistiques.",
};

const BASE = `${API_URL.replace(/\/$/, "")}/partner/v1`;

function Code({ children }: { children: string }) {
  return <pre className="overflow-x-auto rounded-xl bg-[#0f1b2d] p-4 text-xs leading-relaxed text-slate-100"><code>{children}</code></pre>;
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 space-y-3">
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}

const FIELDS: [string, string, string][] = [
  ["title", "texte", "Titre de l’annonce (obligatoire)"],
  ["transaction", "rent | sale", "Location ou vente (obligatoire)"],
  ["propertyType", "texte", "appartement, maison, villa, studio, terrain, bureau, magasin…"],
  ["price", "nombre", "Prix en FCFA (par mois pour une location)"],
  ["priceUnit", "month | day | week | year", "Unité du loyer (month par défaut)"],
  ["city / commune / quartier / address", "texte", "Localisation (ex. Abidjan / Cocody / Riviera Palmeraie)"],
  ["latitude / longitude", "nombre", "Position (facultatif, améliore la recherche « Autour de moi »)"],
  ["bedrooms / bathrooms / garage", "nombre", "Chambres, salles de bain, places de parking"],
  ["surface / yearBuilt", "nombre", "Surface en m², année de construction"],
  ["description", "texte", "Description complète"],
  ["features", "liste de textes", "Équipements (climatisation, piscine, gardien…)"],
  ["photos", "liste d’adresses", "Adresses https des photos (copiées chez Moboo, 12 au maximum)"],
  ["videoUrl", "adresse", "Vidéo YouTube (facultatif)"],
  ["contactName / contactPhone", "texte", "Contact affiché (par défaut : celui du compte)"],
];

/** Documentation publique de l'API des agences partenaires. */
export default function Developpeurs() {
  return (
    <div className="container-page py-10">
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-10">
        <nav className="hidden lg:block">
          <div className="sticky top-24 space-y-1 text-sm">
            {[["demarrer", "Démarrer"], ["auth", "Authentification"], ["annonces", "Annonces"], ["synchro", "Synchronisation"], ["photos", "Photos"], ["demandes", "Demandes"], ["webhooks", "Webhooks"], ["stats", "Statistiques"], ["erreurs", "Erreurs et limites"]].map(([id, l]) => (
              <a key={id} href={`#${id}`} className="block rounded-md px-2 py-1 text-slate-600 hover:bg-slate-100 hover:text-ink">{l}</a>
            ))}
          </div>
        </nav>
        <article className="min-w-0 max-w-3xl space-y-10">
          <header className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-brand-700">Agences partenaires</p>
            <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">API Moboo.ci</h1>
            <p className="text-lg text-slate-600">
              Reliez le logiciel de votre agence à Moboo.ci : vos annonces sont publiées et mises à jour automatiquement, et les demandes de vos clients
              arrivent directement dans votre outil.
            </p>
          </header>

          <Section id="demarrer" title="Démarrer">
            <ol className="list-decimal space-y-1 pl-5 text-slate-700">
              <li>Demandez l’ouverture de l’accès à l’équipe Moboo (compte agence ou agent).</li>
              <li>Dans <Link href="/mon-espace/api" className="font-semibold text-brand-700 hover:underline">Mon espace → API & intégrations</Link>, créez une clé et choisissez ses droits.</li>
              <li>Envoyez vos annonces avec <code>PUT /listings/by-ref/&#123;votre-référence&#125;</code> : c’est tout.</li>
            </ol>
            <p className="text-sm text-slate-600">Adresse de l’API : <code className="rounded bg-slate-100 px-1.5 py-0.5">{BASE}</code> · Échanges en JSON (UTF-8) · Dates au format ISO 8601.</p>
          </Section>

          <Section id="auth" title="Authentification">
            <p className="text-slate-700">Chaque requête porte votre clé dans l’en-tête <code>Authorization</code>. La clé n’est affichée qu’à sa création : gardez-la sur votre serveur, jamais dans une page web ou une application.</p>
            <Code>{`curl ${BASE}/me \\
  -H "Authorization: Bearer mbk_votre_cle"`}</Code>
            <p className="text-sm text-slate-600">Droits possibles d’une clé : <code>listings:read</code>, <code>listings:write</code>, <code>leads:read</code>, <code>stats:read</code>.</p>
          </Section>

          <Section id="annonces" title="Annonces">
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-3 py-2">Méthode</th><th className="px-3 py-2">Adresse</th><th className="px-3 py-2">Rôle</th></tr></thead>
                <tbody>
                  {[
                    ["GET", "/listings", "Vos annonces (status, updatedSince, externalRef, page, perPage ≤ 100)"],
                    ["PUT", "/listings/by-ref/{ref}", "Crée ou met à jour l’annonce de votre référence (recommandé)"],
                    ["GET", "/listings/by-ref/{ref}", "Une annonce par votre référence"],
                    ["DELETE", "/listings/by-ref/{ref}", "Retire l’annonce de votre référence"],
                    ["POST", "/listings", "Publie une annonce (externalRef facultatif)"],
                    ["GET / PATCH / DELETE", "/listings/{id}", "Lire, modifier, retirer par identifiant Moboo"],
                    ["PATCH", "/listings/{id}/status", "ACTIVE, SOLD (vendu), RENTED (loué), DISABLED (masquée)"],
                  ].map(([m, p, r]) => <tr key={m + p} className="border-t border-slate-100"><td className="px-3 py-2 font-mono text-xs font-bold">{m}</td><td className="px-3 py-2 font-mono text-xs">{p}</td><td className="px-3 py-2">{r}</td></tr>)}
                </tbody>
              </table>
            </div>
            <h3 className="pt-2 font-semibold text-ink">Champs d’une annonce</h3>
            <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200">
              <table className="w-full text-sm">
                <tbody>{FIELDS.map(([f, t, d]) => <tr key={f} className="border-t border-slate-100 first:border-0"><td className="px-3 py-2 font-mono text-xs font-semibold">{f}</td><td className="px-3 py-2 text-xs text-muted">{t}</td><td className="px-3 py-2">{d}</td></tr>)}</tbody>
              </table>
            </div>
            <p className="text-sm text-slate-600">
              Les mêmes règles que sur le site s’appliquent : quota de votre forfait, vérification du compte si elle est exigée, validation par l’équipe Moboo.
              La réponse indique <code>moderation</code> (approved / pending) et, si la publication est payante, <code>payment</code> avec le lien de paiement.
            </p>
          </Section>

          <Section id="synchro" title="Synchronisation par votre référence">
            <p className="text-slate-700">Envoyez chaque annonce avec la référence de votre logiciel. Le même appel crée l’annonce la première fois, puis la met à jour : vous pouvez le relancer sans risque de doublon.</p>
            <Code>{`curl -X PUT ${BASE}/listings/by-ref/AG-2026-0042 \\
  -H "Authorization: Bearer mbk_votre_cle" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Appartement 3 pièces Riviera Palmeraie",
    "transaction": "rent",
    "propertyType": "appartement",
    "price": 350000,
    "city": "Abidjan", "commune": "Cocody", "quartier": "Riviera Palmeraie",
    "bedrooms": 2, "bathrooms": 2,
    "photos": ["https://photos.mon-agence.ci/ag-0042/1.jpg"]
  }'

# Réponse : { "created": true, "listing": { "id": "…", "externalRef": "AG-2026-0042", "url": "https://moboo.ci/annonce/…", … } }`}</Code>
            <p className="text-sm text-slate-600">Bien loué ou vendu : <code>PATCH /listings/&#123;id&#125;/status</code> avec <code>&#123;"status":"RENTED"&#125;</code>. Retiré de votre catalogue : <code>DELETE /listings/by-ref/&#123;ref&#125;</code>.</p>
          </Section>

          <Section id="photos" title="Photos">
            <p className="text-slate-700">Donnez des adresses https accessibles publiquement. Moboo copie les photos sur ses serveurs (redimensionnées, optimisées) dans les minutes qui suivent ; renvoyer les mêmes adresses ne les retélécharge pas.</p>
          </Section>

          <Section id="demandes" title="Demandes (leads)">
            <Code>{`curl "${BASE}/leads?since=2026-10-01T00:00:00Z" -H "Authorization: Bearer mbk_votre_cle"

# { "total": 12, "items": [ { "id": "…", "externalRef": "AG-2026-0042", "kind": "visit",
#     "name": "Aya Traoré", "phone": "+2250501020304", "message": "…", "preferredDate": "2026-10-12",
#     "createdAt": "…" } ] }`}</Code>
          </Section>

          <Section id="webhooks" title="Webhooks : demandes en temps réel">
            <p className="text-slate-700">
              Renseignez l’adresse https de votre logiciel dans Mon espace → API & intégrations. À chaque nouvelle demande, Moboo envoie un <code>POST</code> JSON
              (événement <code>lead.created</code>, même contenu qu’un élément de <code>/leads</code>). Répondez 2xx sous 10 secondes ; sinon nous réessayons
              6 fois, de plus en plus espacées.
            </p>
            <p className="text-slate-700">Vérifiez la signature (en-tête <code>X-Moboo-Signature: t=…,v1=…</code>) avec votre secret :</p>
            <Code>{`// Node.js
const crypto = require("crypto");
function verifier(secret, corpsBrut, entete) {
  const [, t, v1] = /^t=(\\d+),v1=([0-9a-f]{64})$/.exec(entete) || [];
  if (!t || Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const attendu = crypto.createHmac("sha256", secret).update(t + "." + corpsBrut).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(attendu), Buffer.from(v1));
}`}</Code>
            <Code>{`<?php // PHP
function verifier($secret, $corpsBrut, $entete) {
  if (!preg_match('/^t=(\\d+),v1=([0-9a-f]{64})$/', $entete, $m)) return false;
  if (abs(time() - (int)$m[1]) > 300) return false;
  return hash_equals(hash_hmac('sha256', $m[1] . '.' . $corpsBrut, $secret), $m[2]);
}`}</Code>
          </Section>

          <Section id="stats" title="Statistiques">
            <p className="text-slate-700"><code>GET /stats</code> : vues, appels, clics WhatsApp et demandes, au total et par annonce (avec votre référence).</p>
          </Section>

          <Section id="erreurs" title="Erreurs et limites">
            <ul className="list-disc space-y-1 pl-5 text-slate-700">
              <li><code>400</code> données invalides (le message explique quoi corriger) · <code>401</code> clé absente, inconnue ou révoquée · <code>403</code> droit manquant ou forfait épuisé · <code>404</code> introuvable.</li>
              <li><code>429</code> trop de requêtes : 120 par minute et par clé par défaut. Les en-têtes <code>X-RateLimit-Remaining</code> et <code>Retry-After</code> indiquent quand reprendre.</li>
              <li>Format d’erreur : <code>&#123; "success": false, "statusCode": 400, "error": &#123; "message": "…" &#125; &#125;</code></li>
            </ul>
          </Section>
        </article>
      </div>
    </div>
  );
}
