-- Dylug initial schema: profiles, friends, DMs, guilds, channels, messages
-- Apply via Supabase Dashboard > SQL Editor, or `supabase db push`.

-- Profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (username ~ '^[a-zA-Z0-9_]{3,32}$'),
  display_name text not null default '',
  avatar_url text,
  status text not null default 'offline',
  created_at timestamptz not null default now()
);

-- Friendships (two rows per accepted friendship, or one row with status)
create table if not exists public.friendships (
  user_id uuid not null references public.profiles(id) on delete cascade,
  friend_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','blocked')),
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  check (user_id <> friend_id)
);

-- DMs
create table if not exists public.dms (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);

create table if not exists public.dm_participants (
  dm_id uuid not null references public.dms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (dm_id, user_id)
);

create table if not exists public.dm_messages (
  id uuid primary key default gen_random_uuid(),
  dm_id uuid not null references public.dms(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  attachment_url text,
  created_at timestamptz not null default now()
);
create index if not exists dm_messages_dm_id_created_idx on public.dm_messages (dm_id, created_at);

-- Guilds
create table if not exists public.guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 100),
  icon_url text,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.guild_members (
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  created_at timestamptz not null default now(),
  primary key (guild_id, user_id)
);

create table if not exists public.channels (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  name text not null check (name ~ '^[a-z0-9-]{1,50}$'),
  topic text not null default '',
  created_at timestamptz not null default now(),
  unique (guild_id, name)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.channels(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  attachment_url text,
  created_at timestamptz not null default now()
);
create index if not exists messages_channel_id_created_idx on public.messages (channel_id, created_at);

-- Invites
create table if not exists public.invites (
  code text primary key,
  guild_id uuid not null references public.guilds(id) on delete cascade,
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  max_uses int,
  uses int not null default 0,
  created_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name)
  values (new.id, 'user_' || substr(new.id::text, 1, 8), 'New User')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
alter table public.dms enable row level security;
alter table public.dm_participants enable row level security;
alter table public.dm_messages enable row level security;
alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.channels enable row level security;
alter table public.messages enable row level security;
alter table public.invites enable row level security;

-- Profiles: readable by all authed users, editable by owner
drop policy if exists "profiles readable" on public.profiles;
create policy "profiles readable" on public.profiles for select to authenticated using (true);
drop policy if exists "profiles editable by owner" on public.profiles;
create policy "profiles editable by owner" on public.profiles for update to authenticated using (auth.uid() = id);
drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Friendships: visible/insertable by participants
drop policy if exists "friendships visible" on public.friendships;
create policy "friendships visible" on public.friendships for select to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);
drop policy if exists "friendships insert" on public.friendships;
create policy "friendships insert" on public.friendships for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "friendships update" on public.friendships;
create policy "friendships update" on public.friendships for update to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);
drop policy if exists "friendships delete" on public.friendships;
create policy "friendships delete" on public.friendships for delete to authenticated
  using (auth.uid() = user_id or auth.uid() = friend_id);

-- Guilds: members can read; authed can create
drop policy if exists "guilds readable by members" on public.guilds;
create policy "guilds readable by members" on public.guilds for select to authenticated
  using (exists (select 1 from public.guild_members m where m.guild_id = id and m.user_id = auth.uid()));
drop policy if exists "guilds creatable" on public.guilds;
create policy "guilds creatable" on public.guilds for insert to authenticated with check (auth.uid() = owner_id);
drop policy if exists "guilds updatable by owner/admin" on public.guilds;
create policy "guilds updatable by owner/admin" on public.guilds for update to authenticated
  using (exists (select 1 from public.guild_members m where m.guild_id = id and m.user_id = auth.uid() and m.role in ('owner','admin')));

-- Guild members: visible to fellow members
drop policy if exists "members visible" on public.guild_members;
create policy "members visible" on public.guild_members for select to authenticated
  using (exists (select 1 from public.guild_members m where m.guild_id = guild_id and m.user_id = auth.uid()));
drop policy if exists "members joinable" on public.guild_members;
create policy "members joinable" on public.guild_members for insert to authenticated with check (auth.uid() = user_id);

-- Channels/messages: visible to guild members
drop policy if exists "channels visible" on public.channels;
create policy "channels visible" on public.channels for select to authenticated
  using (exists (select 1 from public.guild_members m where m.guild_id = channels.guild_id and m.user_id = auth.uid()));
drop policy if exists "channels manageable" on public.channels;
create policy "channels manageable" on public.channels for all to authenticated
  using (exists (select 1 from public.guild_members m where m.guild_id = channels.guild_id and m.user_id = auth.uid() and m.role in ('owner','admin')))
  with check (exists (select 1 from public.guild_members m where m.guild_id = channels.guild_id and m.user_id = auth.uid() and m.role in ('owner','admin')));

drop policy if exists "messages visible" on public.messages;
create policy "messages visible" on public.messages for select to authenticated
  using (exists (
    select 1 from public.channels c
    join public.guild_members m on m.guild_id = c.guild_id
    where c.id = channel_id and m.user_id = auth.uid()
  ));
drop policy if exists "messages sendable" on public.messages;
create policy "messages sendable" on public.messages for insert to authenticated with check (auth.uid() = author_id);
