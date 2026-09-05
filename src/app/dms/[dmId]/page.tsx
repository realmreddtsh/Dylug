import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DMChat from "@/components/DMChat";
import DMFriendsSidebar from "@/components/DMFriendsSidebar";

export default async function DMPage({
  params,
}: {
  params: Promise<{ dmId: string }>;
}) {
  const { dmId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: dmRows } = await supabase.rpc("get_my_dms");
  const mine = ((dmRows ?? []) as { dm_id: string; other_id: string | null }[]).find(
    (d) => d.dm_id === dmId
  );
  if (!mine) notFound();

  let otherName = mine.other_id?.slice(0, 8) ?? "DM";
  if (mine.other_id) {
    const { data } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", mine.other_id)
      .single();
    if (data?.username) otherName = data.username;
  }

  const { data: messages } = await supabase
    .from("dm_messages")
    .select("id,sender_id,body,created_at")
    .eq("dm_id", dmId)
    .order("created_at", { ascending: true })
    .limit(200);

  return (
    <div className="flex min-h-0 flex-1">
      <DMFriendsSidebar active="dms" currentDmId={dmId} />
      <main className="flex min-w-0 flex-1 flex-col bg-disc-chat">
        <div className="flex items-center gap-2 border-b border-disc-rail px-4 py-2.5">
          <span className="text-lg text-disc-muted">@</span>
          <span className="font-semibold text-disc-text">{otherName}</span>
        </div>
        <DMChat
          key={dmId}
          dmId={dmId}
          currentUserId={user.id}
          otherName={otherName}
          initial={(messages ?? []).map((m) => ({
            id: m.id,
            sender_id: m.sender_id,
            body: m.body,
            created_at: m.created_at,
          }))}
        />
      </main>
    </div>
  );
}
