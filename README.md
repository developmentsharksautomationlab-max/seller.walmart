A multi-tenant Walmart-style seller dashboard built with Next.js, Prisma, and SQLite.

Every account gets its own products and orders — all data is scoped per user.

## Getting started

No database or account setup needed. The app ships with a self-contained SQLite
database that lives in `prisma/dev.db`.

```bash
npm install
npm run dev
```

`npm run dev` creates/updates `prisma/dev.db` (via `prisma db push`) before
starting the server. Open [http://localhost:3000](http://localhost:3000) and sign
up for an account.

To fill the dashboard with sample data, use the app itself once you're signed in:

- **Products → Add product**, or
- **Home → Generate orders** to create a batch of realistic orders, or
- **Import** to upload a spreadsheet of orders (`.xlsx` / `.csv`).

## Deploying to Vercel

Import the repo into Vercel and deploy — no environment variables or database
required. The build runs `prisma db push` to bake the schema into a SQLite file,
and at runtime the app copies it to `/tmp` (the only writable path on Vercel).

Because `/tmp` is per-instance and cleared when an instance recycles, **data on
Vercel is not permanent** — it's meant for demos. For persistent storage, point
`DATABASE_URL` at a real database and switch the Prisma `datasource` provider.

Optionally set your own `SESSION_SECRET` (`openssl rand -base64 32`) in the Vercel
project settings; otherwise it falls back to the dev value in `.env`.

## Scripts

- `npm run dev` — start the dev server (provisions the local SQLite DB first)
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint
- `npm run db:studio` — browse the local database in Prisma Studio
