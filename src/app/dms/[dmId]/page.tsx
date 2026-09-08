import { redirect, notFound } from "next/navigation";
import { AtSign, CircleHelp, Inbox, Menu, Phone, Pin, UserPlus, Video } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DMChat from "@/components/DMChat";
import DMFriendsSidebar from "@/components/DMFriendsSidebar";

export default async function DMPage({ params }: { params: Promise<{ dmId: string }> }) {
  const { dmId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dmRows } = await supabase.rpc("get_my_dms");
  const mine = ((dmRows ?? []) as { dm_id: string; other_id: string | null }[]).find((dm) => dm.dm_id === dmId);
  if (!mine) notFound();

  let other = { id: mine.other_id ?? "", username: "DM", display_name: "Direct Message", avatar_url: null as string | null, status: "offline" as "online" | "idle" | "dnd" | "offline" };
  if (mine.other_id) {
    const { data } = await supabase.from("profiles").select("id,username,display_name,avatar_url,status").eq("id", mine.other_id).single();
    if (data) other = { ...other, ...data, status: data.status as typeof other.status };
  }
  const otherName = other.display_name || other.username;

  const { data: messages } = await supabase.from("dm_messages").select("id,sender_id,body,created_at,edited_at,reply_to").eq("dm_id", dmId).order("created_at", { ascending: true }).limit(200);
  const messageIds = (messages ?? []).map((message) => message.id);
  let reactions: { message_id: string; user_id: string; emoji: string }[] = [];
  if (messageIds.length > 0) {
    const { data } = await supabase.from("dm_message_reactions").select("message_id,user_id,emoji").in("message_id", messageIds);
    reactions = (data ?? []) as typeof reactions;
  }

  return (
    <div className="flex min-h-0 flex-1">
      <DMFriendsSidebar active="dms" currentDmId={dmId} />
      <main className="flex min-w-0 flex-1 flex-col bg-disc-chat">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-black/20 px-2 shadow-sm sm:px-4"><Link href="/dms" className="text-disc-muted hover:text-white md:hidden"><Menu size={21} /></Link><AtSign size={22} className="text-disc-muted" /><strong className="truncate text-sm text-white">{otherName}</strong><span className="mx-2 hidden h-6 w-px bg-white/[0.08] sm:block" /><span className="hidden text-xs capitalize text-disc-muted sm:block">{other.status}</span><span className="flex-1" /><div className="flex items-center gap-3 text-disc-muted"><Phone size={20} className="hover:text-white" fill="currentColor" /><Video size={20} className="hover:text-white" fill="currentColor" /><Pin size={20} className="hidden hover:text-white sm:block" /><UserPlus size={20} className="hidden hover:text-white sm:block" /><Inbox size={20} className="hidden hover:text-white md:block" /><CircleHelp size={20} className="hidden hover:text-white md:block" /></div></header>
        <DMChat key={dmId} dmId={dmId} currentUserId={user.id} other={other} initialReactions={reactions} initial={(messages ?? []).map((message) => ({ id: message.id, sender_id: message.sender_id, body: message.body, created_at: message.created_at, edited_at: message.edited_at, reply_to: message.reply_to }))} />
      </main>
    </div>
  );
}
