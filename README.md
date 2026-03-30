# AdvenSure 2.0

Journaling-first web app for travel reflection and lightweight trip planning.

## Architecture

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + TypeScript
- Database: PostgreSQL + Prisma

## Project Structure

```
apps/
	api/   # REST API and Prisma schema
	web/   # React frontend
```

## Quick Start

1. Install Node.js 20+ and npm.
2. Copy `.env.example` to `.env`.
3. Start PostgreSQL:

```bash
docker compose up -d
```

4. Install dependencies:

```bash
npm install
```

5. Generate Prisma client and apply migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

6. Run apps in separate terminals:

```bash
npm run dev:api
npm run dev:web
```

## Demo Data

To quickly populate the app with sample trips, journal entries, itinerary items, and expenses:

```bash
npm run seed:demo
```

Default demo login:

- Email: `demo@advensure.app`
- Password: `DemoPass123!`

