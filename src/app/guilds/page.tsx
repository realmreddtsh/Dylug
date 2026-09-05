import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createGuild, joinGuild } from "@/app/guilds/actions";

export default async function GuildsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.rpc("get_my_guilds");
  const guilds = (data ?? []) as { guild_id: string; name: string }[];

  return (
    <div className="flex flex-1 bg-disc-chat px-4 py-6">
      <main className="mx-auto w-full max-w-2xl space-y-4">
        <h1 className="text-xl font-bold text-disc-text">Your servers</h1>
        <div className="grid gap-2">
          {guilds.map((g) => (
            <Link
              key={g.guild_id}
              href={`/guilds/${g.guild_id}`}
              className="rounded-lg bg-disc-side px-4 py-3 font-medium text-disc-text hover:bg-disc-hover"
            >
              {g.name}
            </Link>
          ))}
          {guilds.length === 0 && (
            <p className="text-sm text-disc-muted">
              No servers yet — create one or join with an invite.
            </p>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <form
            action={createGuild}
            className="space-y-2 rounded-lg bg-disc-side p-4"
          >
            <h2 className="font-semibold text-disc-text">Create server</h2>
            <input
              name="name"
              required
              maxLength={100}
              placeholder="Server name"
              className="w-full rounded-md bg-disc-rail px-3 py-2 text-disc-text outline-none placeholder:text-disc-muted focus:ring-2 focus:ring-disc-brand"
            />
            <button
              type="submit"
              className="w-full rounded-md bg-disc-brand px-3 py-2 font-medium text-white hover:brightness-110"
            >
              Create
            </button>
          </form>
          <form action={joinGuild} className="space-y-2 rounded-lg bg-disc-side p-4">
            <h2 className="font-semibold text-disc-text">Join server</h2>
            <input
              name="code"
              required
              placeholder="Invite code"
              className="w-full rounded-md bg-disc-rail px-3 py-2 text-disc-text outline-none placeholder:text-disc-muted focus:ring-2 focus:ring-disc-brand"
            />
            <button
              type="submit"
              className="w-full rounded-md bg-disc-green px-3 py-2 font-medium text-white hover:brightness-110"
            >
              Join
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
