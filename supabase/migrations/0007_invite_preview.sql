-- Dylug 0007: safe invite previews for the /invite/[code] flow.

create or replace function public.get_invite_preview(invite_code text)
returns table (guild_id uuid, guild_name text, icon_url text, member_count bigint, valid boolean)
language sql security definer set search_path = public stable as $$
  select
    g.id,
    g.name,
    g.icon_url,
    (select count(*) from public.guild_members member where member.guild_id = g.id),
    not (
      (invite.expires_at is not null and invite.expires_at < now())
      or (invite.max_uses is not null and invite.uses >= invite.max_uses)
    )
  from public.invites invite
  join public.guilds g on g.id = invite.guild_id
  where invite.code = invite_code
  limit 1;
$$;

grant execute on function public.get_invite_preview(text) to anon, authenticated;
