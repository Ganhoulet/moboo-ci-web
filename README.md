# Moboo.ci — Web (Next.js)

Nouveau front public de **moboo.ci** : catalogue immobilier complet (à louer,
à vendre, meublés, espaces événementiels) + réservation en ligne. Il remplace
progressivement le front WordPress et consomme le **moteur NestJS**
(`moboo-resi-api`, en prod sur `https://resi.moboo.ci`).

## Stack

- **Next.js 14** (App Router, Server Components, Server Actions) + **TypeScript**
- **Tailwind CSS** (design tokens Moboo : `brand-*` navy, `accent-*` orange)
- Données via l'API publique `/marketplace/*` du moteur NestJS
- Auth consommateur par **OTP téléphone** (cookies httpOnly, `/site/auth/*`)

## Fonctionnalités

- Catalogue `/annonces` (louer / vendre / meublés / espaces) + **filtres avancés**
- Fiches détail `/residence/[id]`, `/espace/[slug]`, `/annonce/[id]`
- Tunnels de réservation (résidence, espace) → server actions
- **Favoris** (`/favoris`, localStorage) · **compte** (`/compte`, OTP)
- **Recherches sauvegardées + alertes** (compte connecté)
- **Publier une annonce** (`/publier`)

## Démarrer en local

```bash
cp .env.local.example .env.local     # ajuster NEXT_PUBLIC_API_URL si besoin
npm install
npm run dev                          # http://localhost:3000
```

Pour tester avec le moteur en local (port 3000), lancer le site sur un autre
port : `PORT=3100 NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1 npm run dev`.

## Variables d'environnement

| Variable | Rôle | Défaut |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Base de l'API NestJS (inclut `/api/v1`) | `https://resi.moboo.ci/api/v1` |

> La connexion (OTP) nécessite un canal WhatsApp/SMS actif **côté moteur**
> (template `moboo_otp`). Sans lui, la navigation et le catalogue fonctionnent,
> mais la connexion reste inactive.

## Déploiement — Vercel

1. Créer un dépôt GitHub et y pousser ce dossier (voir plus bas).
2. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importer le dépôt.
   Vercel détecte Next.js automatiquement (build `next build`, aucune config).
3. **Environment Variables** → ajouter `NEXT_PUBLIC_API_URL = https://resi.moboo.ci/api/v1`.
4. **Deploy**. Le site est publié sur une URL `*.vercel.app`.
5. (Plus tard) Domaine : ajouter `beta.moboo.ci` puis, à la bascule, `moboo.ci`
   dans **Settings → Domains** et pointer le DNS. WordPress reste intact tant
   que le DNS de `moboo.ci` n'est pas basculé.

### Pousser le code sur GitHub

```bash
git remote add origin git@github.com:<compte>/moboo-ci-web.git
git push -u origin main
```

Chaque `git push` sur `main` redéploie automatiquement (Vercel).
