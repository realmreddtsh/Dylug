-- Dylug 0002: missing RLS for DMs + invites, realtime publication
-- Run in Supabase Dashboard > SQL Editor.

-- DMs: participants can read; any authed user can create (participants added separately)
drop policy if exists "dms readable by participants" on public.dms;
create policy "dms readable by participants" on public.dms for select to authenticated
  using (exists (select 1 from public.dm_participants p where p.dm_id = id and p.user_id = auth.uid()));
drop policy if exists "dms creatable" on public.dms;
create policy "dms creatable" on public.dms for insert to authenticated with check (true);

-- DM participants: see fellow participants in your DMs; join self; leave self
drop policy if exists "dm_participants visible" on public.dm_participants;
create policy "dm_participants visible" on public.dm_participants for select to authenticated
  using (exists (select 1 from public.dm_participants mine where mine.dm_id = dm_id and mine.user_id = auth.uid()));
drop policy if exists "dm_participants joinable" on public.dm_participants;
create policy "dm_participants joinable" on public.dm_participants for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "dm_participants leavable" on public.dm_participants;
create policy "dm_participants leavable" on public.dm_participants for delete to authenticated
  using (auth.uid() = user_id);

-- DM messages: participants can read; sender can send
drop policy if exists "dm_messages visible" on public.dm_messages;
create policy "dm_messages visible" on public.dm_messages for select to authenticated
  using (exists (select 1 from public.dm_participants p where p.dm_id = dm_id and p.user_id = auth.uid()));
drop policy if exists "dm_messages sendable" on public.dm_messages;
create policy "dm_messages sendable" on public.dm_messages for insert to authenticated
  with check (
    auth.uid() = sender_id
    and exists (select 1 from public.dm_participants p where p.dm_id = dm_id and p.user_id = auth.uid())
  );

-- Invites: guild members can read; owner/admin can create
drop policy if exists "invites readable" on public.invites;
create policy "invites readable" on public.invites for select to authenticated
  using (exists (select 1 from public.guild_members m where m.guild_id = guild_id and m.user_id = auth.uid()));
drop policy if exists "invites creatable" on public.invites;
create policy "invites creatable" on public.invites for insert to authenticated
  with check (exists (select 1 from public.guild_members m where m.guild_id = guild_id and m.user_id = auth.uid() and m.role in ('owner','admin')));

-- Realtime: broadcast row changes for chat
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'dm_messages') then
    alter publication supabase_realtime add table public.dm_messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
    alter publication supabase_realtime add table public.messages;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'friendships') then
    alter publication supabase_realtime add table public.friendships;
  end if;
end $$;
