import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function DMFriendsSidebar({
  active,
  currentDmId,
}: {
  active: "friends" | "dms";
  currentDmId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: dmRows } = await supabase.rpc("get_my_dms");
  const dms = (dmRows ?? []) as { dm_id: string; other_id: string | null }[];
  const otherIds = [...new Set(dms.map((d) => d.other_id).filter(Boolean))] as string[];
  let names: Record<string, string> = {};
  if (otherIds.length > 0) {
    const { data: profs } = await supabase
      .from("profiles")
      .select("id,username")
      .in("id", otherIds);
    names = Object.fromEntries((profs ?? []).map((p) => [p.id, p.username]));
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-disc-side">
      <div className="border-b border-disc-rail p-2.5">
        <Link
          href="/friends"
          className="block w-full rounded bg-disc-rail px-2 py-1.5 text-sm text-disc-muted"
        >
          Find or start a conversation
        </Link>
      </div>
      <nav className="space-y-0.5 p-2">
        <Link
          href="/friends"
          className={`block rounded px-2 py-2 font-medium ${
            active === "friends"
              ? "bg-disc-active text-white"
              : "text-disc-muted hover:bg-disc-hover hover:text-disc-text"
          }`}
        >
          Friends
        </Link>
        <Link
          href="/guilds"
          className="block rounded px-2 py-2 font-medium text-disc-muted hover:bg-disc-hover hover:text-disc-text"
        >
          Servers
        </Link>
      </nav>
      <div className="flex items-center justify-between px-4 pt-2">
        <p className="text-xs font-semibold uppercase text-disc-muted">
          Direct messages
        </p>
        <Link href="/dms" className="text-lg text-disc-muted hover:text-disc-text">
          +
        </Link>
      </div>
      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
        {dms.map((d) => {
          const name = d.other_id ? (names[d.other_id] ?? d.other_id.slice(0, 8)) : "DM";
          const selected = d.dm_id === currentDmId;
          return (
            <li key={d.dm_id}>
              <Link
                href={`/dms/${d.dm_id}`}
                className={`flex items-center gap-2.5 rounded px-2 py-1.5 ${
                  selected
                    ? "bg-disc-active text-white"
                    : "text-disc-muted hover:bg-disc-hover hover:text-disc-text"
                }`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-disc-brand text-xs font-bold text-white">
                  {name.slice(0, 1).toUpperCase()}
                </span>
                <span className="truncate font-medium">{name}</span>
              </Link>
            </li>
          );
        })}
        {dms.length === 0 && (
          <li className="px-2 py-1 text-sm text-disc-muted">No conversations</li>
        )}
      </ul>
      <div className="bg-disc-rail p-3 text-sm">
        <Link href="/auth/signout" className="text-disc-muted hover:text-disc-text">
          Sign out
        </Link>
      </div>
    </aside>
  );
}
