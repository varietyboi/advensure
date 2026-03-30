# AdvenSure 2.0

![CI](https://github.com/varietyboi/advensure/actions/workflows/ci.yml/badge.svg?branch=v2.0)

AdvenSure is a journaling-first travel app that combines reflection, trip planning, itinerary management, and expense tracking in one lightweight workflow.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/varietyboi/advensure)

## Versioning Strategy

- `v2.0` (default branch): current product and active development.
- `main`: AdvenSure 1.0 baseline.
- Tags:
	- `v1.0.0`: stable 1.0 snapshot
	- `v2.0.0-beta`: initial 2.0 release candidate

## Core Features

- Reflection-first journal entries linked to trips.
- Trip lifecycle management (create, edit, delete).
- Itinerary item management with inline editing.
- Expense tracking with major world currencies.
- Sample data experience for first-time users, including one-click cleanup.
- Theme and typography personalization.

## Fast Evaluator Walkthrough (3-5 minutes)

1. Register a new account.
2. Open the dashboard to review pre-seeded sample trips and entries.
3. Open a trip and edit itinerary/expenses.
4. Create and edit a journal reflection.
5. Use Settings or the dashboard banner to remove sample data.

## Tech Stack

- Frontend: React, TypeScript, Vite
- Backend: Node.js, Express, TypeScript, Zod
- Database: PostgreSQL, Prisma ORM
- Auth: JWT + bcryptjs

## Repository Structure

```text
apps/
	api/   REST API, Prisma schema, seed scripts
	web/   React SPA frontend
```

## Local Setup

### 1) Prerequisites

- Node.js 20+
- npm
- PostgreSQL (Docker or local)

### 2) Environment Files

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

### 3) Start PostgreSQL

```bash
npm run db:up
```

If you run PostgreSQL locally instead of Docker, skip this and update `apps/api/.env` accordingly.

### 4) Install Dependencies

```bash
npm install
```

### 5) Generate Prisma Client and Apply Migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### 6) Start API and Web App

```bash
npm run dev:api
npm run dev:web
```

- API: http://localhost:4000
- Web: http://localhost:5173

## Production Deployment (Render)

This repository includes a Render Blueprint in `render.yaml` that provisions:

- A Node.js API service
- A static frontend service
- A managed PostgreSQL database

### One-Click Deploy

1. Click the Deploy to Render button above.
2. Confirm the default branch is `v2.0`.
3. Create the Blueprint in your Render workspace.
4. Wait for the first deploy to complete.

### Live URLs After Deploy

- App: https://advensure-web-varietyboi.onrender.com
- API health: https://advensure-api-varietyboi.onrender.com/health

### First-Time Production Seed

In the Render dashboard, open a Shell for the API service and run:

```bash
npm run seed:demo --workspace apps/api
```

This creates demo data and credentials:

- Email: `demo@advensure.app`
- Password: `DemoPass123!`

## Demo Data

Populate realistic sample trips, journals, itinerary items, and expenses:

```bash
npm run seed:demo
```

Default demo credentials:

- Email: `demo@advensure.app`
- Password: `DemoPass123!`

## Useful Scripts

- `npm run dev:api`: run backend in watch mode.
- `npm run dev:web`: run frontend in dev mode.
- `npm run build`: build frontend and backend.
- `npm run prisma:generate`: regenerate Prisma client.
- `npm run prisma:migrate`: create/apply migration in development.
- `npm run seed:demo`: refresh demo user/sample content.

## Database Inspection

Run Prisma Studio from the repository root:

```bash
npx prisma studio --schema apps/api/prisma/schema.prisma
```

## CI

GitHub Actions workflow at `.github/workflows/ci.yml` validates install, Prisma client generation, and builds on pushes/PRs to `main` and `v2.0`.

## Roadmap

- Improved deploy story for hosted recruiter demo environments.
- Expanded tests for API route coverage.
- Export/shareable reflection snapshots.

## License

Released under the MIT License. See `LICENSE`.

