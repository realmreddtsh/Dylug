-- Dylug 0006: production chat features and safer profile provisioning.
-- Adds message editing/deletion, emoji reactions, replies, and metadata-aware signup.

-- Message metadata.
alter table public.messages add column if not exists edited_at timestamptz;
alter table public.messages add column if not exists reply_to uuid references public.messages(id) on delete set null;
alter table public.dm_messages add column if not exists edited_at timestamptz;
alter table public.dm_messages add column if not exists reply_to uuid references public.dm_messages(id) on delete set null;

create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 32),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create table if not exists public.dm_message_reactions (
  message_id uuid not null references public.dm_messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 32),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create index if not exists message_reactions_message_idx on public.message_reactions (message_id);
create index if not exists dm_message_reactions_message_idx on public.dm_message_reactions (message_id);

alter table public.message_reactions enable row level security;
alter table public.dm_message_reactions enable row level security;

-- Authors can send to channels they belong to and maintain their own messages.
drop policy if exists "messages sendable" on public.messages;
create policy "messages sendable" on public.messages for insert to authenticated
  with check (
    auth.uid() = author_id
    and exists (
      select 1 from public.channels channel
      where channel.id = channel_id and public.is_guild_member(channel.guild_id)
    )
  );
drop policy if exists "messages editable by author" on public.messages;
create policy "messages editable by author" on public.messages for update to authenticated
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);
drop policy if exists "messages deletable by author" on public.messages;
create policy "messages deletable by author" on public.messages for delete to authenticated
  using (auth.uid() = author_id);

drop policy if exists "dm messages editable by sender" on public.dm_messages;
create policy "dm messages editable by sender" on public.dm_messages for update to authenticated
  using (auth.uid() = sender_id and public.is_dm_participant(dm_id))
  with check (auth.uid() = sender_id and public.is_dm_participant(dm_id));
drop policy if exists "dm messages deletable by sender" on public.dm_messages;
create policy "dm messages deletable by sender" on public.dm_messages for delete to authenticated
  using (auth.uid() = sender_id and public.is_dm_participant(dm_id));

-- Channel reactions inherit access from the parent message/channel.
drop policy if exists "channel reactions readable" on public.message_reactions;
create policy "channel reactions readable" on public.message_reactions for select to authenticated
  using (exists (
    select 1 from public.messages msg
    join public.channels channel on channel.id = msg.channel_id
    where msg.id = message_id and public.is_guild_member(channel.guild_id)
  ));
drop policy if exists "channel reactions insert own" on public.message_reactions;
create policy "channel reactions insert own" on public.message_reactions for insert to authenticated
  with check (auth.uid() = user_id and exists (
    select 1 from public.messages msg
    join public.channels channel on channel.id = msg.channel_id
    where msg.id = message_id and public.is_guild_member(channel.guild_id)
  ));
drop policy if exists "channel reactions delete own" on public.message_reactions;
create policy "channel reactions delete own" on public.message_reactions for delete to authenticated
  using (auth.uid() = user_id);

-- DM reactions inherit access from the parent DM.
drop policy if exists "dm reactions readable" on public.dm_message_reactions;
create policy "dm reactions readable" on public.dm_message_reactions for select to authenticated
  using (exists (
    select 1 from public.dm_messages msg
    where msg.id = message_id and public.is_dm_participant(msg.dm_id)
  ));
drop policy if exists "dm reactions insert own" on public.dm_message_reactions;
create policy "dm reactions insert own" on public.dm_message_reactions for insert to authenticated
  with check (auth.uid() = user_id and exists (
    select 1 from public.dm_messages msg
    where msg.id = message_id and public.is_dm_participant(msg.dm_id)
  ));
drop policy if exists "dm reactions delete own" on public.dm_message_reactions;
create policy "dm reactions delete own" on public.dm_message_reactions for delete to authenticated
  using (auth.uid() = user_id);

-- Use username/display_name supplied during sign-up when valid. OAuth users still
-- receive a collision-safe generated username that the callback can improve.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested text;
  generated text;
  shown text;
begin
  requested := coalesce(new.raw_user_meta_data ->> 'username', '');
  if requested !~ '^[a-zA-Z0-9_]{3,32}$'
     or exists (select 1 from public.profiles where lower(username) = lower(requested)) then
    generated := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  else
    generated := requested;
  end if;
  shown := left(coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''),
                         nullif(new.raw_user_meta_data ->> 'full_name', ''),
                         generated), 100);

  insert into public.profiles (id, username, display_name, avatar_url, status)
  values (
    new.id,
    generated,
    shown,
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture'),
    'online'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Member directory with presence for the channel member list.
create or replace function public.get_guild_members_with_presence(p_guild_id uuid)
returns table (user_id uuid, username text, display_name text, avatar_url text, status text, role text)
language sql security definer set search_path = public stable as $$
  select profile.id, profile.username, profile.display_name, profile.avatar_url,
         profile.status, member.role
  from public.guild_members member
  join public.profiles profile on profile.id = member.user_id
  where member.guild_id = p_guild_id
    and public.is_guild_member(p_guild_id)
  order by
    case profile.status when 'online' then 0 when 'idle' then 1 when 'dnd' then 2 else 3 end,
    lower(coalesce(nullif(profile.display_name, ''), profile.username));
$$;
grant execute on function public.get_guild_members_with_presence(uuid) to authenticated;

-- Publish reactions so every connected client updates immediately.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'message_reactions') then
    alter publication supabase_realtime add table public.message_reactions;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'dm_message_reactions') then
    alter publication supabase_realtime add table public.dm_message_reactions;
  end if;
end $$;
