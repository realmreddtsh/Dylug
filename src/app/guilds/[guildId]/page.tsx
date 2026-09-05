import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function GuildRoot({
  params,
}: {
  params: Promise<{ guildId: string }>;
}) {
  const { guildId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.rpc("get_guild_channels", {
    p_guild_id: guildId,
  });
  const channels = (data ?? []) as { id: string; name: string }[];
  if (channels.length === 0) notFound();
  redirect(`/guilds/${guildId}/${channels[0].id}`);
}
