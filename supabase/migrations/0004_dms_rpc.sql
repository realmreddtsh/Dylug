-- Dylug 0004: bulletproof DM access — NO policy may self-query its own table.
-- Run in Supabase Dashboard > SQL Editor (after 0002 + 0003, order-independent).
--
-- Root cause of "infinite recursion in policy for dm_participants":
-- any SELECT policy on dm_participants that (directly or via helper) reads
-- dm_participants can recurse. Fix: dm_participants SELECT = own rows only,
-- cross-user lookups move into SECURITY DEFINER RPCs used by the app.

-- 1. Helpers (cross-table use only — they touch dm_participants by own user_id,
--    which the own-row policy below always allows).
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

-- 2. dm_participants: own rows only — zero self-reference, cannot recurse.
drop policy if exists "dm_participants visible" on public.dm_participants;
create policy "dm_participants visible" on public.dm_participants for select to authenticated
  using (auth.uid() = user_id);
drop policy if exists "dm_participants joinable" on public.dm_participants;
create policy "dm_participants joinable" on public.dm_participants for insert to authenticated
  with check (auth.uid() = user_id);
drop policy if exists "dm_participants leavable" on public.dm_participants;
create policy "dm_participants leavable" on public.dm_participants for delete to authenticated
  using (auth.uid() = user_id);

-- 3. dms: permissive select (UUIDs unguessable; real guards live on
--    participants/messages). Avoids new-DM bootstrap failure too.
drop policy if exists "dms readable by participants" on public.dms;
drop policy if exists "dms readable" on public.dms;
create policy "dms readable" on public.dms for select to authenticated using (true);
drop policy if exists "dms creatable" on public.dms;
create policy "dms creatable" on public.dms for insert to authenticated with check (true);

-- 4. dm_messages via helper (cross-table only — safe).
drop policy if exists "dm_messages visible" on public.dm_messages;
create policy "dm_messages visible" on public.dm_messages for select to authenticated
  using (public.is_dm_participant(dm_id));
drop policy if exists "dm_messages sendable" on public.dm_messages;
create policy "dm_messages sendable" on public.dm_messages for insert to authenticated
  with check (auth.uid() = sender_id and public.is_dm_participant(dm_id));

-- 5. guild_members: own rows only (same recursion guard; member lists via RPC when guilds UI lands).
drop policy if exists "members visible" on public.guild_members;
create policy "members visible" on public.guild_members for select to authenticated
  using (auth.uid() = user_id);

-- 6. RPCs for cross-user DM lookups (run as owner, bypass RLS safely).
create or replace function public.find_shared_dm(partner uuid)
returns uuid language sql security definer set search_path = public stable as $$
  select p.dm_id
  from public.dm_participants p
  join public.dm_participants m on m.dm_id = p.dm_id
  where p.user_id = partner and m.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.get_my_dms()
returns table (dm_id uuid, other_id uuid)
language sql security definer set search_path = public stable as $$
  select p.dm_id,
    (select q.user_id from public.dm_participants q
     where q.dm_id = p.dm_id and q.user_id <> auth.uid() limit 1)
  from public.dm_participants p
  where p.user_id = auth.uid();
$$;

create or replace function public.create_dm_with(partner uuid)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_dm uuid;
begin
  if partner is null or partner = auth.uid() then
    raise exception 'Cannot DM yourself';
  end if;
  select public.find_shared_dm(partner) into v_dm;
  if v_dm is not null then return v_dm; end if;
  if not exists (select 1 from public.profiles where id = partner) then
    raise exception 'User not found';
  end if;
  insert into public.dms default values returning id into v_dm;
  insert into public.dm_participants (dm_id, user_id)
  values (v_dm, auth.uid()), (v_dm, partner);
  return v_dm;
end $$;

grant execute on function public.is_dm_participant(uuid) to authenticated;
grant execute on function public.is_guild_member(uuid) to authenticated;
grant execute on function public.is_guild_admin(uuid) to authenticated;
grant execute on function public.find_shared_dm(uuid) to authenticated;
grant execute on function public.get_my_dms() to authenticated;
grant execute on function public.create_dm_with(uuid) to authenticated;
