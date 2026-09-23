# Moboo.ci — Web (Next.js)

Nouveau front public de **moboo.ci** : la marketplace de réservation
(résidences meublées & espaces événementiels). Il remplace le front WordPress
et consomme le **moteur NestJS** (`moboo-resi-api`).

## Stack

- **Next.js 14** (App Router, Server Components) + **TypeScript**
- **Tailwind CSS** (design tokens Moboo : `brand-*`, `accent-*`)
- Données via l'API publique `/marketplace/*` du moteur NestJS

## Démarrer

```bash
cp .env.local.example .env.local   # ajuster NEXT_PUBLIC_API_URL si besoin
npm install
npm run dev                        # http://localhost:3000
```

`NEXT_PUBLIC_API_URL` = base de l'API (avec `/api/v1`).
Défaut : `https://resi.moboo.ci/api/v1`.

## Structure

- `app/page.tsx` — accueil (hero, « comment ça marche », à la une)
- `app/marketplace/page.tsx` — recherche : résidences + espaces (grilles)
- `lib/api.ts` — client du moteur NestJS (`listResidences`, `listEspaces`)
- `components/` — cartes & header

## À venir

- Fiches détail `/residence/[id]` et `/espace/[slug]` + tunnel de réservation
- Filtres (ville, dates, capacité), auth invité (Google / OTP)
- Vue statistiques propriétaire (lecture seule) + message de transition
