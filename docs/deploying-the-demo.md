# Deploying the public demo

This is a walkthrough for standing up the live, read-only, no-login demo
linked from the README and the GitHub repo's "website" field. It's separate
from local development in every way that matters — different database,
different account, fake data — so none of this touches real wedding data on
your machine.

## Architecture

Three free-tier services, none of which talk to your local Postgres:

- **[Neon](https://neon.tech)** — a Postgres database, just for the demo.
  Free forever, no card, no expiry.
- **[Render](https://render.com)** — hosts the Express API. Free, no card.
  Sleeps after 15 minutes of no traffic; the first request after that takes
  30–60 seconds to wake it back up. (Fine for a portfolio demo — a real
  product wouldn't ship on the free tier.)
- **[Vercel](https://vercel.com)** — hosts the built React app as static
  files. Free forever for personal projects, no card.

The API runs with `DEMO_MODE=true`, which changes two things (see
`server/src/middleware/auth.ts` and `server/src/app.ts`):

1. Every request is silently authenticated as one fixed account — no login
   screen, because there's nothing to log into.
2. Every write (`POST`/`PATCH`/`PUT`/`DELETE`) is rejected before it reaches
   a route. That account's wedding membership is also `role: 'viewer'`,
   which independently blocks every mutation through the same role check a
   real editor/owner would hit — belt and suspenders.

## One-time setup

### 1. Neon (database)

1. Sign up at neon.tech, create a project (any region).
2. Copy the connection string it gives you — looks like
   `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`.
3. On your own machine, point the server at it temporarily and run the
   migrations and demo seed **once**:

   ```
   cd server
   DATABASE_URL="<paste the Neon connection string>" npm run migrate
   DATABASE_URL="<paste the Neon connection string>" npm run seed:demo
   ```

   `seed:demo` is idempotent — safe to re-run later if you add more to
   `scripts/data/demo-seed.json`, it won't duplicate anything.

### 2. Render (API)

Either apply the included `render.yaml` blueprint (Render dashboard → New →
Blueprint → point it at this repo), or set up a Web Service by hand:

- Root directory: `server`
- Build command: `npm install && npm run build`
- Start command: `npm start`
- Environment variables:
  - `NODE_ENV=production`
  - `DEMO_MODE=true`
  - `DATABASE_URL=` the same Neon connection string from step 1
  - `CLIENT_ORIGIN=` leave a placeholder for now (`http://localhost:5173`
    is fine) — you'll update it once Vercel gives you a real URL in step 3

Deploy, then copy the `.onrender.com` URL it gives you.

### 3. Vercel (frontend)

1. Import this repo in Vercel.
2. Set **Root Directory** to `client` in the project settings.
3. Environment variables:
   - `VITE_API_URL=` the Render URL from step 2, with `/api` appended
     (e.g. `https://ever-after-demo-api.onrender.com/api`)
   - `VITE_DEMO_MODE=true`
4. Deploy. Copy the `.vercel.app` URL it gives you.

### 4. Close the loop

Go back to Render and update `CLIENT_ORIGIN` to the real Vercel URL from
step 3 (this is what the API's CORS check compares against), then trigger a
redeploy so it picks up the change.

### 5. Link it

- Add the Vercel URL to the GitHub repo's "About" section (the gear icon on
  the repo homepage → Website).
- Add it to the README's top section too, with a one-line note that it's a
  read-only demo running on sample data.

## Updating the demo later

Code changes: push to the branch each service is watching and it redeploys
automatically (that's the point of using their GitHub integration rather
than manual deploys).

Data changes: edit `server/scripts/data/demo-seed.json` (or the task list
in `server/scripts/seed-demo.ts`), then re-run
`DATABASE_URL="<neon connection string>" npm run seed:demo` from your
machine. It only adds what's missing — nothing needs to be wiped first.
