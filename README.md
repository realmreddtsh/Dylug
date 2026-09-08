# Dylug

A polished, full-stack community chat app inspired by Discord. Dylug includes realtime server channels, direct messages, friends, invites, profiles, reactions, message replies, and account settings.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%2B%20Realtime-3ecf8e) ![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-38bdf8)

## Highlights

- **Servers and channels** — create communities, organize text channels, and invite members
- **Realtime chat** — channel messages and DMs stream through Supabase Realtime
- **Rich messaging** — replies, emoji reactions, editing, deletion, typing UI, and optimistic updates
- **Friends and DMs** — requests, acceptance, friend discovery, and one-to-one conversations
- **Authentication** — email/password plus GitHub, Google, and Discord OAuth
- **Profiles and presence** — display names, usernames, avatars, status, and account settings
- **Secure backend** — Postgres constraints, Row Level Security, and scoped `SECURITY DEFINER` RPCs
- **Responsive UI** — desktop workspace, tablet layouts, and mobile navigation
- **Zero-config demo** — the root route automatically shows a fully interactive demo when Supabase credentials are absent

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without environment variables, Dylug launches directly into its interactive demo. You can switch servers and channels, send messages, react, open DMs, browse friends, create a server, and explore settings without creating an account.

## Connect the backend

1. Create a project at [supabase.com](https://supabase.com).
2. Copy the environment template:

   ```bash
   cp .env.example .env.local
   ```

3. Add your Supabase project URL and anon key to `.env.local`.
4. Apply every migration in order from `supabase/migrations/` using the Supabase SQL Editor or CLI:

   ```bash
   supabase db push
   ```

5. In **Authentication → Providers**, enable Email and any desired OAuth providers.
6. Add `http://localhost:3000/auth/callback` (and your production equivalent) to the allowed redirect URLs.
7. Restart the dev server. The root route now shows the public landing page and authenticated users enter the connected app.

## Environment

| Variable | Scope | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Public anon key protected by RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Optional admin workflows; never exposed to the client |

## Project structure

```text
src/
├── app/
│   ├── (auth)/              # Login and registration
│   ├── dms/                 # Realtime direct messages
│   ├── friends/             # Friend request workflows
│   ├── guilds/              # Servers, channels, members, invites
│   ├── settings/            # Profile and presence settings
│   └── demo/                # Interactive zero-config workspace
├── components/              # Chat, navigation, auth, and shared UI
└── lib/supabase/            # Browser, server, and middleware clients
supabase/migrations/          # Schema, RLS policies, RPCs, and Realtime setup
```

## Data model

- `profiles` mirrors `auth.users`
- `friendships` stores directional pending/accepted relationships
- `dms`, `dm_participants`, and `dm_messages` power private conversations
- `guilds`, `guild_members`, and `channels` organize communities
- `messages` stores channel chat
- `message_reactions` and `dm_message_reactions` store per-user emoji reactions
- `invites` supports expiring and limited-use server invitations

All user-facing tables have RLS enabled. Membership helper functions and RPCs avoid recursive policies while keeping cross-user reads scoped to authorized participants.

## Quality checks

```bash
npm run lint
npm run build
```

## Deployment

The included `vercel.json` is ready for Vercel. Add the environment variables to the Vercel project, configure the production auth callback URL in Supabase, and deploy.
