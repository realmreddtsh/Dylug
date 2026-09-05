import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FriendsClient from "@/components/FriendsClient";
import DMFriendsSidebar from "@/components/DMFriendsSidebar";

export default async function FriendsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: rows } = await supabase
    .from("friendships")
    .select("user_id,friend_id,status,created_at")
    .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

  const ids = [...new Set((rows ?? []).flatMap((r) => [r.user_id, r.friend_id]))].filter(
    (id) => id !== user.id
  );
  let profiles: Record<string, { username: string; display_name: string; avatar_url: string | null }> = {};
  if (ids.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("id,username,display_name,avatar_url")
      .in("id", ids);
    profiles = Object.fromEntries((data ?? []).map((p) => [p.id, p]));
  }

  const friends = (rows ?? [])
    .filter((r) => r.status === "accepted" && r.user_id === user.id)
    .map((r) => ({ id: r.friend_id, ...profiles[r.friend_id] }));
  const incoming = (rows ?? [])
    .filter((r) => r.status === "pending" && r.friend_id === user.id)
    .map((r) => ({ id: r.user_id, ...profiles[r.user_id] }));
  const outgoing = (rows ?? [])
    .filter((r) => r.status === "pending" && r.user_id === user.id)
    .map((r) => ({ id: r.friend_id, ...profiles[r.friend_id] }));

  return (
    <div className="flex min-h-0 flex-1">
      <DMFriendsSidebar active="friends" />
      <FriendsClient friends={friends} incoming={incoming} outgoing={outgoing} />
    </div>
  );
}
