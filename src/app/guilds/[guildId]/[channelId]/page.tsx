import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import GuildChat from "@/components/GuildChat";
import InviteButton from "@/components/InviteButton";
import { createChannel } from "@/app/guilds/actions";

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ guildId: string; channelId: string }>;
}) {
  const { guildId, channelId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: guilds } = await supabase.rpc("get_my_guilds");
  const guild = ((guilds ?? []) as { guild_id: string; name: string }[]).find(
    (g) => g.guild_id === guildId
  );
  if (!guild) notFound();

  const { data: chData } = await supabase.rpc("get_guild_channels", {
    p_guild_id: guildId,
  });
  const channels = (chData ?? []) as { id: string; name: string; topic: string }[];
  const channel = channels.find((c) => c.id === channelId);
  if (!channel) notFound();

  const { data: memData } = await supabase.rpc("get_guild_members", {
    p_guild_id: guildId,
  });
  const members = (memData ?? []) as {
    user_id: string;
    username: string;
    display_name: string;
    role: string;
  }[];
  const names = Object.fromEntries(
    members.map((m) => [m.user_id, m.username ?? m.display_name ?? m.user_id.slice(0, 8)])
  );

  const { data: messages } = await supabase
    .from("messages")
    .select("id,author_id,body,created_at")
    .eq("channel_id", channelId)
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <div className="flex min-h-0 flex-1">
      {/* Channel sidebar */}
      <aside className="flex w-60 shrink-0 flex-col bg-disc-side">
        <div className="border-b border-disc-rail px-4 py-3 font-bold text-disc-text">
          {guild.name}
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-2">
          <div>
            <p className="px-2 text-xs font-semibold uppercase text-disc-muted">
              Text channels
            </p>
            {channels.map((c) => (
              <Link
                key={c.id}
                href={`/guilds/${guildId}/${c.id}`}
                className={`mt-0.5 block rounded px-2 py-1.5 font-medium ${
                  c.id === channelId
                    ? "bg-disc-active text-white"
                    : "text-disc-muted hover:bg-disc-hover hover:text-disc-text"
                }`}
              >
                # {c.name}
              </Link>
            ))}
          </div>
          <form action={createChannel.bind(null, guildId)} className="space-y-1 p-1">
            <input
              name="name"
              required
              placeholder="new-channel"
              pattern="[a-z0-9-]{1,50}"
              className="w-full rounded bg-disc-rail px-2 py-1.5 text-sm text-disc-text outline-none placeholder:text-disc-muted"
            />
            <button
              type="submit"
              className="w-full rounded bg-disc-side px-2 py-1.5 text-left text-sm text-disc-muted hover:bg-disc-hover hover:text-disc-text"
            >
              + Create channel
            </button>
          </form>
          <div className="p-1">
            <InviteButton guildId={guildId} />
          </div>
        </div>
      </aside>

      {/* Chat */}
      <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-disc-chat">
        <div className="border-b border-disc-rail px-4 py-2.5 font-semibold text-disc-text">
          # {channel.name}
          {channel.topic && (
            <span className="ml-2 text-sm font-normal text-disc-muted">
              {channel.topic}
            </span>
          )}
        </div>
        <GuildChat
          key={channelId}
          channelId={channelId}
          currentUserId={user.id}
          names={names}
          initial={(messages ?? []).map((m) => ({
            id: m.id,
            author_id: m.author_id,
            body: m.body,
            created_at: m.created_at,
          }))}
        />
      </section>

      {/* Members */}
      <aside className="hidden w-52 shrink-0 overflow-y-auto bg-disc-side p-3 lg:block">
        <p className="text-xs font-semibold uppercase text-disc-muted">
          Members — {members.length}
        </p>
        <ul className="mt-2 space-y-1.5">
          {members.map((m) => (
            <li key={m.user_id} className="flex items-center gap-2 text-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-disc-brand text-xs font-bold text-white">
                {(m.username ?? "?").slice(0, 1).toUpperCase()}
              </span>
              <span className="truncate text-disc-muted">
                {m.username}
                {m.role !== "member" && (
                  <span className="ml-1 text-[10px] uppercase text-disc-brand">
                    {m.role}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
