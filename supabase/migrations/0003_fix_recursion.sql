-- Dylug 0003: fix infinite recursion in dm_participants / guild_members RLS
-- Run in Supabase Dashboard > SQL Editor.
-- Root cause: policies on dm_participants queried dm_participants itself,
-- and guild_members policies queried guild_members itself.

-- Helpers run as owner (bypass RLS), so policies can call them safely.
create or replace function public.is_dm_participant(p_dm_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.dm_participants
    where dm_id = p_dm_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_guild_member(p_guild_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.guild_members
    where guild_id = p_guild_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_guild_admin(p_guild_id uuid)
returns boolean language sql security definer set search_path = public stable as $$
  select exists (
    select 1 from public.guild_members
    where guild_id = p_guild_id and user_id = auth.uid() and role in ('owner','admin')
  );
$$;

grant execute on function public.is_dm_participant(uuid) to authenticated;
grant execute on function public.is_guild_member(uuid) to authenticated;
grant execute on function public.is_guild_admin(uuid) to authenticated;

-- DMs: permissive select (ids are unguessable UUIDs; real guard is on
-- participants/messages). Avoids insert-then-select bootstrap failure where a
-- brand-new DM has no participants yet.
drop policy if exists "dms readable by participants" on public.dms;
drop policy if exists "dms readable" on public.dms;
create policy "dms readable" on public.dms for select to authenticated
  using (true);
-- dms creatable stays as-is (insert true)

-- DM participants: own row always visible; fellow participants via helper (no self-query)
drop policy if exists "dm_participants visible" on public.dm_participants;
create policy "dm_participants visible" on public.dm_participants for select to authenticated
  using (auth.uid() = user_id or public.is_dm_participant(dm_id));

-- DM messages
drop policy if exists "dm_messages visible" on public.dm_messages;
create policy "dm_messages visible" on public.dm_messages for select to authenticated
  using (public.is_dm_participant(dm_id));
drop policy if exists "dm_messages sendable" on public.dm_messages;
create policy "dm_messages sendable" on public.dm_messages for insert to authenticated
  with check (auth.uid() = sender_id and public.is_dm_participant(dm_id));

-- Guilds
drop policy if exists "guilds readable by members" on public.guilds;
create policy "guilds readable by members" on public.guilds for select to authenticated
  using (public.is_guild_member(id));
drop policy if exists "guilds updatable by owner/admin" on public.guilds;
create policy "guilds updatable by owner/admin" on public.guilds for update to authenticated
  using (public.is_guild_admin(id));

-- Guild members
drop policy if exists "members visible" on public.guild_members;
create policy "members visible" on public.guild_members for select to authenticated
  using (auth.uid() = user_id or public.is_guild_member(guild_id));

-- Channels
drop policy if exists "channels visible" on public.channels;
create policy "channels visible" on public.channels for select to authenticated
  using (public.is_guild_member(guild_id));
drop policy if exists "channels manageable" on public.channels;
create policy "channels manageable" on public.channels for all to authenticated
  using (public.is_guild_admin(guild_id))
  with check (public.is_guild_admin(guild_id));

-- Channel messages
drop policy if exists "messages visible" on public.messages;
create policy "messages visible" on public.messages for select to authenticated
  using (exists (
    select 1 from public.channels c
    where c.id = channel_id and public.is_guild_member(c.guild_id)
  ));

-- Invites
drop policy if exists "invites readable" on public.invites;
create policy "invites readable" on public.invites for select to authenticated
  using (public.is_guild_member(guild_id));
drop policy if exists "invites creatable" on public.invites;
create policy "invites creatable" on public.invites for insert to authenticated
  with check (public.is_guild_admin(guild_id));
