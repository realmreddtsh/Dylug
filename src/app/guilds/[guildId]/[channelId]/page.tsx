import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Bell, ChevronDown, CircleHelp, Compass, Hash, Headphones, Inbox, Menu, Mic, Pin, Plus, Search, Settings, UserPlus, Users, Volume2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import GuildChat from "@/components/GuildChat";
import InviteButton from "@/components/InviteButton";
import Avatar from "@/components/Avatar";
import { createChannel } from "@/app/guilds/actions";

export default async function ChannelPage({ params }: { params: Promise<{ guildId: string; channelId: string }> }) {
  const { guildId, channelId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: guilds } = await supabase.rpc("get_my_guilds");
  const guild = ((guilds ?? []) as { guild_id: string; name: string }[]).find((item) => item.guild_id === guildId);
  if (!guild) notFound();

  const [{ data: channelData }, { data: memberData }] = await Promise.all([
    supabase.rpc("get_guild_channels", { p_guild_id: guildId }),
    supabase.rpc("get_guild_members_with_presence", { p_guild_id: guildId }),
  ]);
  const channels = (channelData ?? []) as { id: string; name: string; topic: string }[];
  const channel = channels.find((item) => item.id === channelId);
  if (!channel) notFound();

  const members = (memberData ?? []) as { user_id: string; username: string; display_name: string; avatar_url: string | null; status: "online" | "idle" | "dnd" | "offline"; role: string }[];
  const profiles = Object.fromEntries(members.map((member) => [member.user_id, {
    name: member.display_name || member.username || member.user_id.slice(0, 8),
    avatar_url: member.avatar_url,
    status: member.user_id === user.id ? "online" as const : member.status,
    role: member.role,
  }]));
  const me = profiles[user.id] ?? { name: user.email?.split("@")[0] ?? "You", status: "online" as const };

  const { data: messages } = await supabase
    .from("messages")
    .select("id,author_id,body,created_at,edited_at,reply_to")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .limit(200);
  const messageIds = (messages ?? []).map((message) => message.id);
  let reactions: { message_id: string; user_id: string; emoji: string }[] = [];
  if (messageIds.length > 0) {
    const { data } = await supabase.from("message_reactions").select("message_id,user_id,emoji").in("message_id", messageIds);
    reactions = (data ?? []) as typeof reactions;
  }

  return (
    <div className="flex min-h-0 flex-1">
      <aside className="hidden w-60 shrink-0 flex-col bg-disc-side md:flex">
        <div className="flex h-12 shrink-0 items-center border-b border-black/20 px-4 font-semibold text-white shadow-sm"><span className="min-w-0 flex-1 truncate">{guild.name}</span><ChevronDown size={18} /></div>
        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-4">
          <InviteButton guildId={guildId} />
          <div className="group mt-5 flex h-6 items-center px-1 text-[11px] font-bold uppercase tracking-wide text-disc-muted"><span className="flex-1">Text channels</span><Plus size={15} /></div>
          <nav className="space-y-0.5">
            {channels.map((item) => (
              <Link key={item.id} href={`/guilds/${guildId}/${item.id}`} className={`group flex h-8 items-center rounded px-2 text-[15px] font-medium ${item.id === channelId ? "bg-disc-active text-white" : "text-disc-muted hover:bg-disc-hover hover:text-disc-text"}`}>
                <Hash size={19} className="mr-1.5 shrink-0 text-disc-muted" /><span className="min-w-0 flex-1 truncate">{item.name}</span>{item.id !== channelId && <UserPlus size={14} className="hidden group-hover:block" />}
              </Link>
            ))}
          </nav>
          <details className="mt-2 rounded bg-disc-rail/50 p-1.5 text-sm text-disc-muted">
            <summary className="cursor-pointer list-none px-1 hover:text-white">+ Create a channel</summary>
            <form action={createChannel.bind(null, guildId)} className="mt-2 space-y-1.5">
              <input name="name" required placeholder="new-channel" pattern="[a-z0-9-]{1,50}" className="w-full rounded bg-disc-rail px-2.5 py-2 text-xs text-disc-text outline-none placeholder:text-disc-muted focus:ring-1 focus:ring-disc-brand" />
              <button type="submit" className="w-full rounded bg-disc-brand px-2 py-1.5 text-xs font-medium text-white hover:bg-[#4752c4]">Create channel</button>
            </form>
          </details>
          <div className="mt-5 flex h-6 items-center px-1 text-[11px] font-bold uppercase tracking-wide text-disc-muted"><span className="flex-1">Voice channels</span><Plus size={15} /></div>
          {["Lounge", "Focus room"].map((name) => <button key={name} type="button" className="flex h-8 w-full items-center rounded px-2 text-[15px] font-medium text-disc-muted hover:bg-disc-hover hover:text-disc-text"><Volume2 size={18} className="mr-2" />{name}</button>)}
          <Link href="/guilds" className="mt-4 flex h-8 items-center gap-2 rounded px-2 text-sm font-medium text-disc-muted hover:bg-disc-hover hover:text-disc-text"><Compass size={18} /> Browse Channels</Link>
        </div>
        <div className="flex h-[54px] shrink-0 items-center gap-2 bg-[#232428] px-2"><Link href="/settings"><Avatar name={me.name} src={me.avatar_url} status="online" size={34} /></Link><Link href="/settings" className="min-w-0 flex-1 leading-tight"><span className="block truncate text-sm font-semibold text-white">{me.name}</span><span className="block text-[11px] text-disc-muted">Online</span></Link><button type="button" title="Mute" className="text-disc-muted hover:text-white"><Mic size={17} /></button><button type="button" title="Deafen" className="text-disc-muted hover:text-white"><Headphones size={17} /></button><Link href="/settings" title="Settings" className="text-disc-muted hover:text-white"><Settings size={17} /></Link></div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-disc-chat">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-black/20 px-2 shadow-sm sm:px-4"><Link href="/guilds" aria-label="Servers" className="mr-1 text-disc-muted hover:text-white md:hidden"><Menu size={21} /></Link><Hash size={23} className="shrink-0 text-disc-muted" /><span className="max-w-[160px] truncate font-semibold text-white">{channel.name}</span>{channel.topic && <><span className="mx-2 hidden h-6 w-px bg-white/[0.08] lg:block" /><span className="hidden min-w-0 flex-1 truncate text-sm text-disc-muted lg:block">{channel.topic}</span></>}<span className="flex-1 lg:hidden" /><div className="flex items-center gap-3 text-disc-muted"><Bell size={20} className="hidden hover:text-white sm:block" /><Pin size={20} className="hidden hover:text-white sm:block" /><Users size={21} className="hover:text-white" /><label className="relative hidden md:block"><Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2" /><input placeholder="Search" className="h-6 w-28 rounded bg-disc-rail pl-7 pr-2 text-xs text-disc-text outline-none focus:w-44" /></label><Inbox size={20} className="hidden hover:text-white sm:block" /><CircleHelp size={20} className="hidden hover:text-white sm:block" /></div></header>
        <GuildChat key={channelId} channelId={channelId} channelName={channel.name} currentUserId={user.id} profiles={profiles} initialReactions={reactions} initial={(messages ?? []).map((message) => ({ id: message.id, author_id: message.author_id, body: message.body, created_at: message.created_at, edited_at: message.edited_at, reply_to: message.reply_to }))} />
      </section>

      <aside className="hidden w-60 shrink-0 overflow-y-auto bg-disc-side px-2 pb-6 pt-6 xl:block">
        <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-wide text-disc-muted">Members — {members.length}</p>
        <ul className="space-y-0.5">
          {members.map((member) => {
            const name = member.display_name || member.username;
            return <li key={member.user_id} className={`flex items-center gap-2.5 rounded px-2 py-1.5 hover:bg-disc-hover ${member.status === "offline" ? "opacity-45" : ""}`}><Avatar name={name} src={member.avatar_url} status={member.status} size={32} /><span className={`min-w-0 flex-1 truncate text-sm font-medium ${member.role !== "member" ? "text-disc-yellow" : "text-disc-muted"}`}>{name}{member.role !== "member" && <span className="ml-1 text-[9px] uppercase text-disc-brand">{member.role}</span>}</span></li>;
          })}
        </ul>
      </aside>
    </div>
  );
}
