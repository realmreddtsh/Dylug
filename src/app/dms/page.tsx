import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDM } from "@/app/dms/actions";
import DMFriendsSidebar from "@/components/DMFriendsSidebar";

export default async function DMsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: friendships } = await supabase
    .from("friendships")
    .select("friend_id")
    .eq("user_id", user.id)
    .eq("status", "accepted");
  const friendIds = (friendships ?? []).map((f) => f.friend_id);
  let friends: { id: string; username: string }[] = [];
  if (friendIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id,username")
      .in("id", friendIds);
    friends = (data ?? []).map((p) => ({ id: p.id, username: p.username }));
  }

  return (
    <div className="flex min-h-0 flex-1">
      <DMFriendsSidebar active="dms" />
      <main className="flex min-w-0 flex-1 flex-col bg-disc-chat">
        <div className="border-b border-disc-rail px-4 py-2.5 font-semibold text-disc-text">
          Direct Messages
        </div>
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="w-full max-w-md rounded-lg bg-disc-side p-6">
            <h2 className="font-bold text-disc-text">Start a conversation</h2>
            {friends.length === 0 ? (
              <p className="mt-2 text-sm text-disc-muted">
                Add friends first — head to Friends → Add Friend.
              </p>
            ) : (
              <ul className="mt-3 space-y-1.5">
                {friends.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-disc-hover/60"
                  >
                    <span className="flex items-center gap-2.5 text-disc-text">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-disc-brand text-xs font-bold text-white">
                        {f.username.slice(0, 1).toUpperCase()}
                      </span>
                      @{f.username}
                    </span>
                    <form action={getOrCreateDM.bind(null, f.id)}>
                      <button
                        type="submit"
                        className="rounded bg-disc-brand px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
                      >
                        Message
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
