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

  const ids = [...new Set((rows ?? []).flatMap((row) => [row.user_id, row.friend_id]))].filter((id) => id !== user.id);
  let profiles: Record<string, { username: string; display_name: string; avatar_url: string | null; status: "online" | "idle" | "dnd" | "offline" }> = {};
  if (ids.length > 0) {
    const { data } = await supabase.from("profiles").select("id,username,display_name,avatar_url,status").in("id", ids);
    profiles = Object.fromEntries((data ?? []).map((profile) => [profile.id, profile]));
  }

  const person = (id: string) => ({ id, ...profiles[id] });
  const friends = (rows ?? []).filter((row) => row.status === "accepted" && row.user_id === user.id).map((row) => person(row.friend_id));
  const incoming = (rows ?? []).filter((row) => row.status === "pending" && row.friend_id === user.id).map((row) => person(row.user_id));
  const outgoing = (rows ?? []).filter((row) => row.status === "pending" && row.user_id === user.id).map((row) => person(row.friend_id));

  return (
    <div className="flex min-h-0 flex-1">
      <DMFriendsSidebar active="friends" />
      <FriendsClient friends={friends} incoming={incoming} outgoing={outgoing} />
    </div>
  );
}
