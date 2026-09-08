import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Compass, Plus, Search, Sparkles, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createGuild, joinGuild } from "@/app/guilds/actions";

export default async function GuildsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.rpc("get_my_guilds");
  const guilds = (data ?? []) as { guild_id: string; name: string; icon_url?: string | null }[];

  return (
    <main className="min-h-0 flex-1 overflow-y-auto bg-[#11131f] text-disc-text">
      <header className="sticky top-0 z-10 flex h-14 items-center border-b border-white/[0.06] bg-[#11131f]/90 px-5 backdrop-blur"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-disc-brand text-white"><Compass size={18} /></span><strong className="ml-2.5 text-white">Server Hub</strong><label className="relative ml-auto hidden sm:block"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-disc-muted" /><input placeholder="Search your servers" className="h-8 w-52 rounded-lg bg-white/[0.06] pl-9 pr-3 text-xs outline-none focus:ring-1 focus:ring-disc-brand" /></label></header>
      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8">
        <section className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-disc-brand/25 via-[#242742] to-fuchsia-500/10 p-7 sm:p-9">
          <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-disc-brand/30 blur-3xl" /><div className="relative max-w-xl"><span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1 text-xs font-medium text-indigo-200"><Sparkles size={13} /> Build your community</span><h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Your next favorite place starts here.</h1><p className="mt-3 max-w-lg text-sm leading-6 text-white/60">Create a server for your friends, club, or team—or join one with an invite from someone you know.</p></div>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          <form action={createGuild} className="rounded-xl border border-white/[0.07] bg-disc-side p-5 transition hover:border-white/[0.12]"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-disc-brand/15 text-[#aeb4ff]"><Plus size={23} /></span><h2 className="mt-4 text-lg font-bold text-white">Create a server</h2><p className="mt-1 text-xs leading-5 text-disc-muted">Start from scratch. We&apos;ll add a #general channel so you can begin right away.</p><label className="mt-5 block text-[10px] font-bold uppercase tracking-wide text-disc-muted">Server name<input name="name" required maxLength={100} placeholder="My awesome community" className="mt-2 h-10 w-full rounded-md bg-disc-rail px-3 text-sm text-disc-text outline-none placeholder:text-disc-muted/70 focus:ring-2 focus:ring-disc-brand" /></label><button type="submit" className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-disc-brand text-sm font-semibold text-white hover:bg-[#4752c4]">Create my server <ArrowRight size={16} /></button></form>
          <form action={joinGuild} className="rounded-xl border border-white/[0.07] bg-disc-side p-5 transition hover:border-white/[0.12]"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-disc-green/15 text-disc-green"><Users size={23} /></span><h2 className="mt-4 text-lg font-bold text-white">Join a server</h2><p className="mt-1 text-xs leading-5 text-disc-muted">Enter an invite code to join an existing community and meet everyone.</p><label className="mt-5 block text-[10px] font-bold uppercase tracking-wide text-disc-muted">Invite code<input name="code" required placeholder="nook-8FX2" className="mt-2 h-10 w-full rounded-md bg-disc-rail px-3 font-mono text-sm text-disc-text outline-none placeholder:text-disc-muted/70 focus:ring-2 focus:ring-disc-green" /></label><button type="submit" className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-disc-green text-sm font-semibold text-white hover:brightness-110">Join server <ArrowRight size={16} /></button></form>
        </div>

        <section className="mt-10"><div className="flex items-end"><div><p className="text-xs font-semibold uppercase tracking-wide text-disc-muted">Your communities</p><h2 className="mt-1 text-xl font-bold text-white">Jump back in</h2></div><span className="ml-auto text-xs text-disc-muted">{guilds.length} {guilds.length === 1 ? "server" : "servers"}</span></div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guilds.map((guild, index) => {
              const mark = guild.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
              const gradients = ["from-indigo-500 to-violet-600", "from-cyan-500 to-teal-600", "from-pink-500 to-orange-500"];
              return <Link key={guild.guild_id} href={`/guilds/${guild.guild_id}`} className="group overflow-hidden rounded-xl border border-white/[0.07] bg-disc-side transition hover:-translate-y-0.5 hover:border-white/[0.14] hover:shadow-xl"><div className={`h-20 bg-gradient-to-br ${gradients[index % gradients.length]}`} /><div className="relative p-4 pt-8"><span className="absolute -top-7 flex h-14 w-14 items-center justify-center rounded-[18px] border-4 border-disc-side bg-disc-chat bg-cover bg-center text-sm font-bold text-white" style={guild.icon_url ? { backgroundImage: `url(${guild.icon_url})` } : undefined}>{!guild.icon_url && mark}</span><h3 className="truncate font-semibold text-white group-hover:underline">{guild.name}</h3><p className="mt-1 text-xs text-disc-muted">Active now • Open server</p></div></Link>;
            })}
            {guilds.length === 0 && <div className="col-span-full rounded-xl border border-dashed border-white/[0.1] p-10 text-center"><Compass size={34} className="mx-auto text-disc-muted" /><h3 className="mt-3 text-sm font-semibold text-white">No servers yet</h3><p className="mt-1 text-xs text-disc-muted">Create one above or join with an invite.</p></div>}
          </div>
        </section>
      </div>
    </main>
  );
}
