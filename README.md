# Coupled Modelling Frontend

Web explorer for the coupled multiphysics simulation knowledge base ([coupled_modelling](https://github.com/r4stin/coupled_modelling) backend: Kratos CoSimulation configurations stored as OWL in GraphDB).

Built on the ORKG stack: **Next.js 16 · React 19 · TypeScript · HeroUI v3 · Tailwind CSS v4 · SWR · nuqs**.

## Getting started

1. Start the backend (see `README_GRAPHDB.md` in the backend repo): GraphDB on `localhost:7200`, then the Flask API on `localhost:5000`.
2. Configure the API URL (defaults work for local development):
   ```bash
   cp .env.example .env.local
   ```
3. Install and run:
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm test` | Tests (Vitest) |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run type-check` | TypeScript check |

## Structure

```
src/
├── app/                # Next.js App Router pages
├── components/         # React components (Providers, …)
├── services/backend/   # Flask API calls — one file per resource (ky client)
├── constants/
├── lib/
└── types/              # API response types
```
