import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import GuildRailClient from "@/components/GuildRailClient";

export default async function GuildRail() {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.rpc("get_my_guilds");
  const guilds = (data ?? []) as {
    guild_id: string;
    name: string;
    icon_url?: string | null;
  }[];

  return <GuildRailClient guilds={guilds} />;
}
