# Dylug
## A brand new chat app.

Next.js + Supabase (Postgres + Auth + Realtime), deployed on Vercel via GitHub.

## Setup

1. Create project at supabase.com, copy URL + anon key.
2. `cp .env.example .env.local` and fill values.
3. In Supabase Dashboard > SQL Editor, run `supabase/migrations/0001_init.sql`.
4. Enable Email + GitHub/Discord providers in Supabase Auth.
5. `npm install && npm run dev` — open http://localhost:3000
6. Import repo to Vercel, add same env vars, deploy. Pushes to `main` auto-deploy.

## Structure

- `src/app/` — routes (auth, friends, DMs, guilds/channels)
- `src/lib/supabase/` — browser/server/middleware helpers
- `supabase/migrations/0001_init.sql` — profiles, friendships, DMs, guilds, channels, messages, invites + RLS
