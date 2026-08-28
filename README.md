# Coupled Modelling Frontend

Web explorer for the coupled multiphysics simulation knowledge base ([coupled_modelling](https://github.com/r4stin/coupled_modelling) backend: Kratos CoSimulation configurations stored as OWL in GraphDB).

[![Frontend CI](https://github.com/r4stin/coupled-modelling-frontend/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/r4stin/coupled-modelling-frontend/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16-000000.svg?logo=nextdotjs&logoColor=white)]()
[![React](https://img.shields.io/badge/React-19-61DAFB.svg?logo=react&logoColor=black)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6.svg?logo=typescript&logoColor=white)]()
[![HeroUI](https://img.shields.io/badge/HeroUI-v3-7828C8.svg)]()
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4.svg?logo=tailwindcss&logoColor=white)]()
[![SWR](https://img.shields.io/badge/SWR-Data_Fetching-000000.svg?logo=swr&logoColor=white)]()
[![nuqs](https://img.shields.io/badge/nuqs-URL_State-4B5563.svg)]()

## Getting started

Requires **Node 20+**.

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
| `npm run generate:api-types` | Regenerate API types from the running backend's OpenAPI spec |

## Structure

```
src/
├── app/                # Next.js App Router pages
├── components/         # React components (Providers, …)
├── services/backend/   # Flask API calls — one file per resource (ky client)
├── constants/
├── lib/
└── types/              # API response types (openapi.ts is generated from the backend OpenAPI spec)
```
