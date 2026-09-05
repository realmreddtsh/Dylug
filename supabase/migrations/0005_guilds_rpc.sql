-- Dylug 0005: guild RPCs (create / join / invite / channel / members).
-- Run in Supabase Dashboard > SQL Editor.
-- Follows the 0004 pattern: cross-user reads happen in SECURITY DEFINER
-- functions; RLS policies never self-query their own table.

-- My guilds (id, name, icon) for the rail.
create or replace function public.get_my_guilds()
returns table (guild_id uuid, name text, icon_url text)
language sql security definer set search_path = public stable as $$
  select g.id, g.name, g.icon_url
  from public.guilds g
  join public.guild_members m on m.guild_id = g.id
  where m.user_id = auth.uid()
  order by g.created_at;
$$;

-- Channels of a guild I belong to.
create or replace function public.get_guild_channels(p_guild_id uuid)
returns table (id uuid, name text, topic text)
language sql security definer set search_path = public stable as $$
  select c.id, c.name, c.topic
  from public.channels c
  where c.guild_id = p_guild_id
    and exists (select 1 from public.guild_members m
                where m.guild_id = p_guild_id and m.user_id = auth.uid())
  order by c.created_at;
$$;

-- Members of a guild I belong to (for the member list).
create or replace function public.get_guild_members(p_guild_id uuid)
returns table (user_id uuid, username text, display_name text, avatar_url text, role text)
language sql security definer set search_path = public stable as $$
  select p.id, p.username, p.display_name, p.avatar_url, m.role
  from public.guild_members m
  join public.profiles p on p.id = m.user_id
  where m.guild_id = p_guild_id
    and exists (select 1 from public.guild_members me
                where me.guild_id = p_guild_id and me.user_id = auth.uid())
  order by m.created_at;
$$;

-- Create guild + owner membership + #general, atomically.
create or replace function public.create_guild_with(gname text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_guild uuid;
begin
  if gname is null or char_length(trim(gname)) < 1 or char_length(gname) > 100 then
    raise exception 'Guild name must be 1-100 characters';
  end if;
  insert into public.guilds (name, owner_id)
  values (trim(gname), auth.uid()) returning id into v_guild;
  insert into public.guild_members (guild_id, user_id, role)
  values (v_guild, auth.uid(), 'owner');
  insert into public.channels (guild_id, name, topic)
  values (v_guild, 'general', 'General chat');
  return v_guild;
end $$;

-- Create a text channel (owner/admin only).
create or replace function public.create_channel_in(p_guild_id uuid, cname text, ctopic text default '')
returns uuid language plpgsql security definer set search_path = public as $$
declare v_ch uuid;
begin
  if not public.is_guild_admin(p_guild_id) then
    raise exception 'Only admins can create channels';
  end if;
  if cname is null or cname !~ '^[a-z0-9-]{1,50}$' then
    raise exception 'Channel name: lowercase letters, numbers, dashes (max 50)';
  end if;
  insert into public.channels (guild_id, name, topic)
  values (p_guild_id, cname, coalesce(ctopic, '')) returning id into v_ch;
  return v_ch;
end $$;

-- Create an invite code (owner/admin only).
create or replace function public.create_invite_for(p_guild_id uuid)
returns text language plpgsql security definer set search_path = public as $$
declare v_code text;
begin
  if not public.is_guild_admin(p_guild_id) then
    raise exception 'Only admins can invite';
  end if;
  loop
    v_code := substr(md5(random()::text), 1, 8);
    exit when not exists (select 1 from public.invites where code = v_code);
  end loop;
  insert into public.invites (code, guild_id, created_by)
  values (v_code, p_guild_id, auth.uid());
  return v_code;
end $$;

-- Join a guild by invite code.
create or replace function public.join_guild_by_code(invite_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_guild uuid;
begin
  select guild_id into v_guild from public.invites where code = invite_code;
  if v_guild is null then raise exception 'Invalid invite'; end if;
  if exists (select 1 from public.invites where code = invite_code
             and ((expires_at is not null and expires_at < now())
               or (max_uses is not null and uses >= max_uses))) then
    raise exception 'Invite expired';
  end if;
  insert into public.guild_members (guild_id, user_id, role)
  values (v_guild, auth.uid(), 'member')
  on conflict (guild_id, user_id) do nothing;
  update public.invites set uses = uses + 1 where code = invite_code;
  return v_guild;
end $$;

grant execute on function public.get_my_guilds() to authenticated;
grant execute on function public.get_guild_channels(uuid) to authenticated;
grant execute on function public.get_guild_members(uuid) to authenticated;
grant execute on function public.create_guild_with(text) to authenticated;
grant execute on function public.create_channel_in(uuid, text, text) to authenticated;
grant execute on function public.create_invite_for(uuid) to authenticated;
grant execute on function public.join_guild_by_code(text) to authenticated;
