# Deploying the public demo

This is a walkthrough for standing up the live, read-only, no-login demo
linked from the README and the GitHub repo's "website" field.

## Architecture

The demo is a fully static build of the React app — no server, no
database, one free [Vercel](https://vercel.com) account. It's built this
way on purpose: the demo is read-only anyway, so there's nothing a real
backend would add except a second thing to host, pay for (once free tiers
run out), and keep patched.

`client/src/lib/mockData.ts` holds the entire fictional dataset — a made-up
couple, vendors, budget, tasks. `client/src/lib/mockApi.ts` answers every
`GET` request from it and rejects every write with the same "read-only
demo" message a real backend would give, so the UI code (dialogs, status
selects, the disabled-button treatment) doesn't know or care that it isn't
talking to a real API. See `client/src/lib/api.ts` for where the two paths
split — `DEMO_MODE` decides between a real `fetch()` and the mock.

None of this touches `server/` at all. Local development still runs the
real Express API against a real Postgres database, exactly as before.

## One-time setup

1. Import this repo in [Vercel](https://vercel.com).
2. Set **Root Directory** to `client` in the project settings.
3. Set one environment variable: `VITE_DEMO_MODE=true`.
   (`VITE_API_URL` doesn't matter for this build — the demo never calls
   `fetch()` at all, see above.)
4. Deploy. Copy the `.vercel.app` URL it gives you.

## Link it

- Add the URL to the GitHub repo's "About" section (the gear icon on the
  repo homepage → Website).
- Add it to the README's top section too — already has a placeholder and
  the "this is sample data" note waiting for it.

## Updating the demo later

Code changes: push to the branch Vercel is watching and it redeploys
automatically.

Data changes: edit `client/src/lib/mockData.ts` directly — it's a plain
TypeScript module, no database to run a script against. Push, and the next
deploy picks it up.
