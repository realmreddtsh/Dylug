import { redirect } from "next/navigation";
import { MessageCircle, Search, UserPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getOrCreateDM } from "@/app/dms/actions";
import DMFriendsSidebar from "@/components/DMFriendsSidebar";
import Avatar from "@/components/Avatar";

export default async function DMsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: friendships } = await supabase.from("friendships").select("friend_id").eq("user_id", user.id).eq("status", "accepted");
  const friendIds = (friendships ?? []).map((friendship) => friendship.friend_id);
  let friends: { id: string; username: string; display_name: string; avatar_url: string | null; status: "online" | "idle" | "dnd" | "offline" }[] = [];
  if (friendIds.length > 0) {
    const { data } = await supabase.from("profiles").select("id,username,display_name,avatar_url,status").in("id", friendIds);
    friends = (data ?? []) as typeof friends;
  }

  return (
    <div className="flex min-h-0 flex-1">
      <DMFriendsSidebar active="dms" />
      <main className="flex min-w-0 flex-1 flex-col bg-disc-chat">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-black/20 px-4 shadow-sm"><MessageCircle size={21} className="text-disc-muted" /><strong className="text-sm text-white">New Message</strong></header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
          <div className="mx-auto max-w-2xl">
            <div className="text-center"><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-disc-brand/15 text-[#aeb4ff]"><UserPlus size={37} /></span><h1 className="mt-5 text-2xl font-bold text-white">Start a conversation</h1><p className="mt-2 text-sm text-disc-muted">Choose a friend and say hello. Your messages stay in sync in realtime.</p></div>
            {friends.length > 0 && <div className="relative mt-8"><Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-disc-muted" /><input placeholder="Search friends" className="h-9 w-full rounded bg-disc-rail px-3 pr-9 text-sm text-disc-text outline-none focus:ring-1 focus:ring-disc-brand" /></div>}
            <ul className="mt-4 space-y-1">
              {friends.map((friend) => {
                const name = friend.display_name || friend.username;
                return <li key={friend.id} className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 hover:border-white/[0.04] hover:bg-disc-hover"><Avatar name={name} src={friend.avatar_url} status={friend.status} size={40} /><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-white">{name}</strong><span className="block truncate text-xs text-disc-muted">@{friend.username} • {friend.status}</span></span><form action={getOrCreateDM.bind(null, friend.id)}><button type="submit" className="rounded bg-disc-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-[#4752c4]">Message</button></form></li>;
              })}
            </ul>
            {friends.length === 0 && <div className="mt-8 rounded-xl border border-dashed border-white/[0.1] p-8 text-center"><p className="text-sm font-medium text-white">Your friends list is empty</p><p className="mt-1 text-xs text-disc-muted">Head to Friends → Add Friend to find someone.</p></div>}
          </div>
        </div>
      </main>
    </div>
  );
}
