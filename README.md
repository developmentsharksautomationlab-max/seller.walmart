A one-purpose Next.js app: opening it redirects straight to the Walmart seller
dashboard login at <https://sellar-walmart.vercel.app/login>.

The redirect is defined in `next.config.ts` (`redirects()` for `/`), with a
fallback `redirect()` in `src/app/page.tsx`.

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects immediately.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint
