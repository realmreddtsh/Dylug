import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function GuildRail() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.rpc("get_my_guilds");
  const guilds = (data ?? []) as { guild_id: string; name: string }[];

  return (
    <nav className="flex w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-disc-rail py-3">
      <Link
        href="/friends"
        title="Home"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-disc-side text-lg font-bold text-white transition-all hover:rounded-2xl hover:bg-disc-brand"
      >
        D
      </Link>
      <div className="h-0.5 w-8 rounded bg-disc-side" />
      {guilds.map((g) => (
        <Link
          key={g.guild_id}
          href={`/guilds/${g.guild_id}`}
          title={g.name}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-disc-side font-bold text-white transition-all hover:rounded-2xl hover:bg-disc-brand"
        >
          {g.name.slice(0, 1).toUpperCase()}
        </Link>
      ))}
      <Link
        href="/guilds"
        title="Add server"
        className="flex h-12 w-12 items-center justify-center rounded-full bg-disc-side text-2xl text-disc-green transition-all hover:rounded-2xl hover:bg-disc-green hover:text-white"
      >
        +
      </Link>
    </nav>
  );
}
