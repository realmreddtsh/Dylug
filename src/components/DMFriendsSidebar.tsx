import Link from "next/link";
import { Compass, Headphones, Mic, Plus, Search, Settings, Users, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import Avatar from "@/components/Avatar";

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

  const [{ data: dmRows }, { data: me }] = await Promise.all([
    supabase.rpc("get_my_dms"),
    supabase.from("profiles").select("username,display_name,avatar_url,status").eq("id", user.id).single(),
  ]);
  const dms = (dmRows ?? []) as { dm_id: string; other_id: string | null }[];
  const otherIds = [...new Set(dms.map((dm) => dm.other_id).filter(Boolean))] as string[];
  let profiles: Record<string, { username: string; display_name: string; avatar_url: string | null; status: "online" | "idle" | "dnd" | "offline" }> = {};
  if (otherIds.length > 0) {
    const { data } = await supabase.from("profiles").select("id,username,display_name,avatar_url,status").in("id", otherIds);
    profiles = Object.fromEntries((data ?? []).map((profile) => [profile.id, profile]));
  }

  const myName = me?.display_name || me?.username || user.email?.split("@")[0] || "You";

  return (
    <aside className="hidden w-60 shrink-0 flex-col bg-disc-side md:flex">
      <div className="flex h-12 shrink-0 items-center border-b border-black/20 px-2.5 shadow-sm">
        <Link href="/friends" className="relative flex h-7 w-full items-center rounded bg-disc-rail px-2 text-xs text-disc-muted hover:text-disc-text"><Search size={13} className="mr-1.5" /> Find or start a conversation</Link>
      </div>
      <nav className="space-y-0.5 p-2 pt-3">
        <Link href="/friends" className={`flex h-10 items-center gap-3 rounded px-2 text-[15px] font-medium ${active === "friends" ? "bg-disc-active text-white" : "text-disc-muted hover:bg-disc-hover hover:text-disc-text"}`}><Users size={21} /> Friends</Link>
        <Link href="/dms" className={`flex h-10 items-center gap-3 rounded px-2 text-[15px] font-medium ${active === "dms" && !currentDmId ? "bg-disc-active text-white" : "text-disc-muted hover:bg-disc-hover hover:text-disc-text"}`}><Zap size={21} /> Nitro</Link>
        <Link href="/guilds" className="flex h-10 items-center gap-3 rounded px-2 text-[15px] font-medium text-disc-muted hover:bg-disc-hover hover:text-disc-text"><Compass size={21} /> Discover</Link>
      </nav>
      <div className="mt-3 flex items-center px-4 text-[11px] font-semibold uppercase tracking-wide text-disc-muted"><span className="flex-1">Direct messages</span><Link href="/dms" aria-label="New direct message" className="hover:text-white"><Plus size={15} /></Link></div>
      <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2 pt-1">
        {dms.map((dm) => {
          const profile = dm.other_id ? profiles[dm.other_id] : undefined;
          const name = profile?.display_name || profile?.username || dm.other_id?.slice(0, 8) || "Conversation";
          const selected = dm.dm_id === currentDmId;
          return (
            <li key={dm.dm_id}>
              <Link href={`/dms/${dm.dm_id}`} className={`group flex h-11 items-center gap-2.5 rounded px-2 ${selected ? "bg-disc-active text-white" : "text-disc-muted hover:bg-disc-hover hover:text-disc-text"}`}>
                <Avatar name={name} src={profile?.avatar_url} status={profile?.status ?? "offline"} size={32} />
                <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{name}</span>
              </Link>
            </li>
          );
        })}
        {dms.length === 0 && <li className="px-2 py-5 text-center text-xs leading-5 text-disc-muted">No conversations yet.<br />Add a friend to get started.</li>}
      </ul>
      <div className="flex h-[54px] shrink-0 items-center gap-2 bg-[#232428] px-2">
        <Link href="/settings" className="flex min-w-0 flex-1 items-center gap-2 rounded px-0.5 py-1 hover:bg-white/[0.06]">
          <Avatar name={myName} src={me?.avatar_url} status={(me?.status as "online" | "idle" | "dnd" | "offline") ?? "online"} size={34} />
          <span className="min-w-0 leading-tight"><span className="block truncate text-sm font-semibold text-white">{myName}</span><span className="block truncate text-[11px] text-disc-muted">{me?.username ?? "online"}</span></span>
        </Link>
        <button type="button" title="Mute" className="flex h-8 w-8 items-center justify-center rounded text-disc-muted hover:bg-white/[0.06] hover:text-white"><Mic size={17} /></button>
        <button type="button" title="Deafen" className="flex h-8 w-8 items-center justify-center rounded text-disc-muted hover:bg-white/[0.06] hover:text-white"><Headphones size={17} /></button>
        <Link href="/settings" title="User Settings" className="flex h-8 w-8 items-center justify-center rounded text-disc-muted hover:bg-white/[0.06] hover:text-white"><Settings size={17} /></Link>
      </div>
    </aside>
  );
}
