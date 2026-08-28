A multi-tenant sales dashboard built with Next.js, Prisma, and SQLite.

## Getting Started

No external database or account setup needed — the app ships with a self-contained
SQLite database that lives in `prisma/dev.db`.

```bash
npm install
npm run dev
```

Running `npm run dev` automatically creates/updates `prisma/dev.db` (via `prisma db push`)
before starting the server. Open [http://localhost:3000](http://localhost:3000) and sign up
for a new account — each account's products and orders are scoped to that user.

Optionally, load a demo account with sample products and orders:

```bash
npm run seed
# email: demo@saleshub.app  password: demo1234
```

## Scripts

- `npm run dev` — start the dev server (auto-provisions the local SQLite DB first)
- `npm run build` — production build (used by the Vercel deployment, which targets
  Postgres/Neon instead of SQLite — see `prisma/schema.production.prisma`)
- `npm run seed` — reset and seed a demo account with sample data
- `npm run db:studio` — open Prisma Studio to browse the local database

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
