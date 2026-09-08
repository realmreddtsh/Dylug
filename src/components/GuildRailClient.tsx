"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Download, Plus } from "lucide-react";
import BrandMark from "@/components/BrandMark";

type Guild = { guild_id: string; name: string; icon_url?: string | null };

export default function GuildRailClient({ guilds }: { guilds: Guild[] }) {
  const pathname = usePathname();
  const homeActive = pathname.startsWith("/friends") || pathname.startsWith("/dms") || pathname.startsWith("/settings");

  return (
    <nav className="server-rail hidden h-[100dvh] w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-disc-rail py-3 sm:flex" aria-label="Servers">
      <Link href="/friends" className="server-button group" aria-label="Direct Messages">
        <span className={`server-pill ${homeActive ? "server-pill-active" : ""}`} />
        <BrandMark size="md" className={homeActive ? "rounded-[14px]" : "bg-disc-side transition-all group-hover:rounded-[14px]"} />
        <span className="server-tooltip">Direct Messages</span>
      </Link>
      <div className="h-0.5 w-8 shrink-0 rounded-full bg-white/[0.08]" />
      {guilds.map((guild) => {
        const active = pathname.startsWith(`/guilds/${guild.guild_id}`);
        const mark = guild.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
        return (
          <Link key={guild.guild_id} href={`/guilds/${guild.guild_id}`} className="server-button group" aria-label={guild.name}>
            <span className={`server-pill ${active ? "server-pill-active" : ""}`} />
            <span
              className={`flex h-12 w-12 items-center justify-center bg-cover bg-center text-sm font-bold text-white transition-all duration-200 group-hover:rounded-[14px] ${active ? "rounded-[14px] bg-disc-brand" : "rounded-[24px] bg-disc-side group-hover:bg-disc-brand"}`}
              style={guild.icon_url ? { backgroundImage: `url(${guild.icon_url})` } : undefined}
            >
              {!guild.icon_url && mark}
            </span>
            <span className="server-tooltip">{guild.name}</span>
          </Link>
        );
      })}
      <Link href="/guilds" className="server-button group" aria-label="Add a Server">
        <span className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-disc-side text-disc-green transition-all duration-200 group-hover:rounded-[14px] group-hover:bg-disc-green group-hover:text-white"><Plus size={24} /></span>
        <span className="server-tooltip">Add a Server</span>
      </Link>
      <Link href="/guilds" className="server-button group" aria-label="Explore Servers">
        <span className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-disc-side text-disc-green transition-all duration-200 group-hover:rounded-[14px] group-hover:bg-disc-green group-hover:text-white"><Compass size={21} /></span>
        <span className="server-tooltip">Explore Servers</span>
      </Link>
      <div className="h-0.5 w-8 shrink-0 rounded-full bg-white/[0.08]" />
      <Link href="/demo" className="server-button group" aria-label="Open Demo">
        <span className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-disc-side text-disc-green transition-all duration-200 group-hover:rounded-[14px] group-hover:bg-disc-green group-hover:text-white"><Download size={20} /></span>
        <span className="server-tooltip">Interactive Demo</span>
      </Link>
    </nav>
  );
}
