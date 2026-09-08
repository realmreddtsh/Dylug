import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, Check, Users, X } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { joinGuild } from "@/app/guilds/actions";
import BrandMark from "@/components/BrandMark";

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (!isSupabaseConfigured()) redirect("/demo");

  const supabase = await createClient();
  const [{ data: auth }, { data }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.rpc("get_invite_preview", { invite_code: code }),
  ]);
  const invite = ((data ?? []) as { guild_id: string; guild_name: string; icon_url: string | null; member_count: number; valid: boolean }[])[0];
  if (!invite) notFound();

  const mark = invite.guild_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return (
    <main className="auth-grid flex min-h-[100dvh] w-full items-center justify-center overflow-y-auto p-5">
      <Link href="/" className="absolute left-6 top-6 flex items-center gap-2 text-lg font-bold text-white"><BrandMark size="sm" /> Dylug</Link>
      <div className="w-full max-w-md rounded-2xl border border-white/[0.07] bg-disc-side p-7 text-center shadow-2xl">
        <span className="mx-auto flex h-24 w-24 items-center justify-center rounded-[32px] bg-disc-brand bg-cover bg-center text-2xl font-black text-white shadow-xl" style={invite.icon_url ? { backgroundImage: `url(${invite.icon_url})` } : undefined}>{!invite.icon_url && mark}</span>
        <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-disc-muted">You&apos;ve been invited to join</p>
        <h1 className="mt-2 text-2xl font-bold text-white">{invite.guild_name}</h1>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-disc-muted"><Users size={16} /> {invite.member_count} {invite.member_count === 1 ? "member" : "members"}</p>
        {invite.valid ? <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-disc-green"><Check size={14} /> This invite is ready to use</p> : <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-disc-red"><X size={14} /> This invite has expired</p>}
        {invite.valid && auth.user ? (
          <form action={joinGuild} className="mt-6"><input type="hidden" name="code" value={code} /><button type="submit" className="flex h-11 w-full items-center justify-center gap-2 rounded-md bg-disc-brand text-sm font-semibold text-white hover:bg-[#4752c4]">Accept Invite <ArrowRight size={17} /></button></form>
        ) : invite.valid ? (
          <Link href={`/login?next=/invite/${encodeURIComponent(code)}`} className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-disc-brand text-sm font-semibold text-white hover:bg-[#4752c4]">Log in to accept <ArrowRight size={17} /></Link>
        ) : (
          <Link href="/" className="mt-6 flex h-11 w-full items-center justify-center rounded-md bg-disc-active text-sm font-semibold text-white hover:bg-disc-hover">Return home</Link>
        )}
      </div>
    </main>
  );
}
