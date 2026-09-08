"use client";

import {
  AtSign,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Compass,
  Crown,
  Download,
  FileText,
  Gamepad2,
  Gift,
  Hash,
  Headphones,
  Inbox,
  Menu,
  MessageCircle,
  Mic,
  MicOff,
  MoreHorizontal,
  Paperclip,
  Pencil,
  Phone,
  Pin,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Smile,
  Sparkles,
  Sticker,
  Trash2,
  UserPlus,
  Users,
  Video,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { FormEvent, KeyboardEvent, ReactNode, useEffect, useRef, useState } from "react";
import Avatar from "@/components/Avatar";
import BrandMark from "@/components/BrandMark";

type Presence = "online" | "idle" | "dnd" | "offline" | "streaming";
type View = "guild" | "friends" | "dm";
type Modal = "create-server" | "invite" | "create-channel" | "settings" | null;
type FriendTab = "online" | "all" | "pending" | "add";

type Channel = {
  id: string;
  name: string;
  type: "text" | "voice";
  topic?: string;
  unread?: boolean;
  badge?: number;
  locked?: boolean;
};

type Server = {
  id: string;
  name: string;
  mark: string;
  accent: string;
  channels: Channel[];
};

type Reaction = { emoji: string; count: number; mine?: boolean };
type ChatMessage = {
  id: string;
  author: string;
  handle?: string;
  time: string;
  content: string;
  color?: string;
  status?: Presence;
  bot?: boolean;
  edited?: boolean;
  reply?: { author: string; text: string };
  reactions?: Reaction[];
  attachment?: {
    kind: "image" | "file";
    title: string;
    meta: string;
  };
};

type Member = {
  name: string;
  handle: string;
  role: "admin" | "member" | "bot";
  status: Presence;
  activity?: string;
};

const baseChannels: Channel[] = [
  { id: "welcome", name: "welcome", type: "text", topic: "Start here — say hello and grab your roles." },
  { id: "general", name: "general", type: "text", topic: "A place to hang out, share ideas, and make something great." },
  { id: "show-and-tell", name: "show-and-tell", type: "text", topic: "Share what you are working on.", unread: true, badge: 3 },
  { id: "resources", name: "resources", type: "text", topic: "Helpful links, tools, and inspiration." },
  { id: "off-topic", name: "off-topic", type: "text", topic: "Everything that does not fit anywhere else.", unread: true },
  { id: "Lounge", name: "Lounge", type: "voice" },
  { id: "Focus room", name: "Focus room", type: "voice" },
  { id: "Game night", name: "Game night", type: "voice" },
];

const initialServers: Server[] = [
  { id: "nook", name: "The Nook", mark: "N", accent: "linear-gradient(145deg,#5865f2,#8b5cf6)", channels: baseChannels },
  { id: "design", name: "Design Lab", mark: "DL", accent: "linear-gradient(145deg,#ec4899,#f97316)", channels: baseChannels.map((c) => ({ ...c })) },
  { id: "pixel", name: "Pixel Forge", mark: "PF", accent: "linear-gradient(145deg,#0ea5e9,#14b8a6)", channels: baseChannels.map((c) => ({ ...c })) },
  { id: "cozy", name: "Cozy Corner", mark: "CC", accent: "linear-gradient(145deg,#f59e0b,#ef4444)", channels: baseChannels.map((c) => ({ ...c })) },
];

const initialMessages: Record<string, ChatMessage[]> = {
  welcome: [
    {
      id: "w1",
      author: "Nook Keeper",
      handle: "nook-keeper",
      time: "8:00 AM",
      content: "Welcome to The Nook! Read the guidelines, choose a few roles, then come say hello in #general. We are happy you are here ✨",
      color: "#5865f2",
      status: "online",
      bot: true,
      reactions: [{ emoji: "👋", count: 42 }, { emoji: "💜", count: 18 }],
    },
  ],
  general: [
    {
      id: "m1",
      author: "Maya Chen",
      handle: "mayamakes",
      time: "9:41 AM",
      content: "Good morning, everyone! I pushed the first pass of the new community dashboard. Would love another set of eyes on the empty states 👀",
      color: "#ec4899",
      status: "online",
      reactions: [{ emoji: "🔥", count: 6 }, { emoji: "👀", count: 4, mine: true }],
    },
    {
      id: "m2",
      author: "Juno Park",
      handle: "junopark",
      time: "9:43 AM",
      content: "Just opened it — the layout feels really clean. The quick actions are a great touch.",
      color: "#0ea5e9",
      status: "online",
      reply: { author: "Maya Chen", text: "I pushed the first pass of the new community dashboard…" },
    },
    {
      id: "m3",
      author: "Maya Chen",
      handle: "mayamakes",
      time: "9:45 AM",
      content: "Thank you! Here is the direction for the onboarding card. I softened the shadows and gave the illustration a little more room.",
      color: "#ec4899",
      status: "online",
      attachment: { kind: "image", title: "onboarding-card-v2.png", meta: "1.8 MB • 1600 × 1000" },
      reactions: [{ emoji: "💜", count: 8 }, { emoji: "✨", count: 5 }],
    },
    {
      id: "m4",
      author: "Theo Brooks",
      handle: "theob",
      time: "9:52 AM",
      content: "This is lovely. Could we use the same illustration treatment for the no-results search state? It would tie everything together.",
      color: "#f59e0b",
      status: "idle",
    },
    {
      id: "m5",
      author: "Orbit",
      handle: "orbit-bot",
      time: "9:55 AM",
      content: "Build #284 completed successfully. Preview is ready: https://preview.dylug.app/284",
      color: "#8b5cf6",
      status: "online",
      bot: true,
      reactions: [{ emoji: "🚀", count: 3 }],
    },
    {
      id: "m6",
      author: "Sofia Reed",
      handle: "sofia.codes",
      time: "10:02 AM",
      content: "Nice! I can take the search empty state this afternoon. @Maya Chen, want me to match this exact spacing scale?",
      color: "#22c55e",
      status: "online",
    },
  ],
  "show-and-tell": [
    {
      id: "s1",
      author: "Lena Ortiz",
      handle: "lena.draws",
      time: "Yesterday at 6:18 PM",
      content: "A tiny icon set I made during today’s focus room. Still deciding between rounded and sharp corners — thoughts?",
      color: "#d946ef",
      status: "dnd",
      attachment: { kind: "image", title: "tiny-icons.png", meta: "842 KB • 1200 × 800" },
      reactions: [{ emoji: "😍", count: 12 }, { emoji: "🎨", count: 7 }],
    },
  ],
  resources: [
    {
      id: "r1",
      author: "Theo Brooks",
      handle: "theob",
      time: "Monday at 2:14 PM",
      content: "Dropping our updated design critique checklist here. It has made async reviews much more focused.",
      color: "#f59e0b",
      status: "idle",
      attachment: { kind: "file", title: "critique-checklist.pdf", meta: "PDF • 312 KB" },
      reactions: [{ emoji: "🙏", count: 9 }],
    },
  ],
  "off-topic": [
    {
      id: "o1",
      author: "Juno Park",
      handle: "junopark",
      time: "8:12 AM",
      content: "Important question: what is everyone listening to while they work today?",
      color: "#0ea5e9",
      status: "online",
      reactions: [{ emoji: "🎧", count: 11 }],
    },
  ],
};

const members: Member[] = [
  { name: "Maya Chen", handle: "mayamakes", role: "admin", status: "online", activity: "Designing in Figma" },
  { name: "Juno Park", handle: "junopark", role: "admin", status: "online", activity: "Visual Studio Code" },
  { name: "Sofia Reed", handle: "sofia.codes", role: "member", status: "online" },
  { name: "Noah Kim", handle: "noahk", role: "member", status: "online", activity: "Listening to Lofi Radio" },
  { name: "Orbit", handle: "orbit-bot", role: "bot", status: "online", activity: "/help" },
  { name: "Theo Brooks", handle: "theob", role: "member", status: "idle" },
  { name: "Amara Lewis", handle: "amaral", role: "member", status: "idle", activity: "Away for lunch" },
  { name: "Lena Ortiz", handle: "lena.draws", role: "member", status: "dnd" },
  { name: "Kai Wilson", handle: "kaiw", role: "member", status: "offline" },
  { name: "Priya Shah", handle: "priyashah", role: "member", status: "offline" },
  { name: "Sam N.", handle: "samn", role: "member", status: "offline" },
];

const friends = [
  { name: "Juno Park", handle: "junopark", status: "online" as Presence, activity: "Visual Studio Code", mutual: 8 },
  { name: "Maya Chen", handle: "mayamakes", status: "online" as Presence, activity: "Designing in Figma", mutual: 12 },
  { name: "Noah Kim", handle: "noahk", status: "online" as Presence, activity: "Listening to Lofi Radio", mutual: 4 },
  { name: "Theo Brooks", handle: "theob", status: "idle" as Presence, activity: "Idle", mutual: 6 },
  { name: "Lena Ortiz", handle: "lena.draws", status: "dnd" as Presence, activity: "Do Not Disturb", mutual: 3 },
];

const dmMessages: Record<string, ChatMessage[]> = {
  junopark: [
    { id: "d1", author: "Juno Park", handle: "junopark", time: "Yesterday at 4:28 PM", content: "Hey! Are we still on for the critique tomorrow?", color: "#0ea5e9", status: "online" },
    { id: "d2", author: "You", handle: "alex.r", time: "Yesterday at 4:31 PM", content: "Absolutely — I blocked 10 AM. I’ll send the prototype before then.", color: "#5865f2", status: "online", reactions: [{ emoji: "👍", count: 1 }] },
    { id: "d3", author: "Juno Park", handle: "junopark", time: "9:18 AM", content: "Perfect. The latest interactions look so smooth, by the way!", color: "#0ea5e9", status: "online" },
  ],
  mayamakes: [
    { id: "dm1", author: "Maya Chen", handle: "mayamakes", time: "Monday at 1:12 PM", content: "Thanks for the thoughtful feedback on the dashboard ✨", color: "#ec4899", status: "online" },
  ],
  noahk: [
    { id: "dn1", author: "Noah Kim", handle: "noahk", time: "Sunday at 7:04 PM", content: "Sending over that playlist we talked about!", color: "#22c55e", status: "online" },
  ],
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function IconButton({
  label,
  children,
  onClick,
  active,
  className,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "group relative inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-disc-muted transition hover:bg-white/[0.06] hover:text-disc-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-disc-brand",
        active && "bg-white/[0.08] text-white",
        className
      )}
    >
      {children}
    </button>
  );
}

function renderMessageText(content: string) {
  const parts = content.split(/(https?:\/\/[^\s]+|@[A-Za-z ]+(?=,|\s|$)|#[a-z0-9-]+)/gi);
  return parts.map((part, index) => {
    if (part.startsWith("http")) {
      return <span key={`${part}-${index}`} className="cursor-pointer text-[#00a8fc] hover:underline">{part}</span>;
    }
    if (part.startsWith("@") || part.startsWith("#")) {
      return <span key={`${part}-${index}`} className="cursor-pointer rounded-[3px] bg-disc-brand/25 px-0.5 font-medium text-[#c9cdfb] hover:bg-disc-brand hover:text-white">{part}</span>;
    }
    return part;
  });
}

function ServerRail({
  servers,
  activeServerId,
  view,
  onHome,
  onServer,
  onCreate,
  onToast,
}: {
  servers: Server[];
  activeServerId: string;
  view: View;
  onHome: () => void;
  onServer: (id: string) => void;
  onCreate: () => void;
  onToast: (text: string) => void;
}) {
  return (
    <nav className="server-rail hidden h-full w-[72px] shrink-0 flex-col items-center gap-2 overflow-y-auto bg-disc-rail py-3 sm:flex" aria-label="Servers">
      <button className="server-button group" type="button" onClick={onHome} aria-label="Direct messages">
        <span className={cn("server-pill", view !== "guild" && "server-pill-active")} />
        <BrandMark size="md" className={cn("transition-all duration-200 group-hover:rounded-[14px]", view !== "guild" ? "rounded-[14px]" : "bg-disc-side")} />
        <span className="server-tooltip">Direct Messages</span>
      </button>
      <div className="mx-auto h-0.5 w-8 shrink-0 rounded-full bg-white/[0.08]" />
      {servers.map((server) => {
        const selected = view === "guild" && activeServerId === server.id;
        return (
          <button key={server.id} className="server-button group" type="button" onClick={() => onServer(server.id)} aria-label={server.name}>
            <span className={cn("server-pill", selected && "server-pill-active")} />
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-[24px] text-sm font-bold text-white transition-all duration-200 group-hover:rounded-[14px]",
                selected && "rounded-[14px]"
              )}
              style={{ background: selected ? server.accent : "#313338" }}
            >
              {server.mark}
            </span>
            <span className="server-tooltip">{server.name}</span>
          </button>
        );
      })}
      <button className="server-button group" type="button" onClick={onCreate} aria-label="Add a Server">
        <span className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-disc-side text-disc-green transition-all duration-200 group-hover:rounded-[14px] group-hover:bg-disc-green group-hover:text-white">
          <Plus size={24} />
        </span>
        <span className="server-tooltip">Add a Server</span>
      </button>
      <button className="server-button group" type="button" onClick={() => onToast("Server discovery is coming soon") } aria-label="Explore Discoverable Servers">
        <span className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-disc-side text-disc-green transition-all duration-200 group-hover:rounded-[14px] group-hover:bg-disc-green group-hover:text-white">
          <Compass size={22} />
        </span>
        <span className="server-tooltip">Explore Discoverable Servers</span>
      </button>
      <div className="mx-auto h-0.5 w-8 shrink-0 rounded-full bg-white/[0.08]" />
      <button className="server-button group" type="button" onClick={() => onToast("Thanks for trying Dylug!")} aria-label="Download Apps">
        <span className="flex h-12 w-12 items-center justify-center rounded-[24px] bg-disc-side text-disc-green transition-all duration-200 group-hover:rounded-[14px] group-hover:bg-disc-green group-hover:text-white">
          <Download size={21} />
        </span>
        <span className="server-tooltip">Download Apps</span>
      </button>
    </nav>
  );
}

function UserPanel({
  muted,
  deafened,
  onMuted,
  onDeafened,
  onSettings,
}: {
  muted: boolean;
  deafened: boolean;
  onMuted: () => void;
  onDeafened: () => void;
  onSettings: () => void;
}) {
  return (
    <div className="flex h-[54px] shrink-0 items-center gap-2 bg-[#232428] px-2">
      <button type="button" className="flex min-w-0 flex-1 items-center gap-2 rounded px-0.5 py-1 text-left hover:bg-white/[0.06]">
        <Avatar name="Alex Rivera" status="online" size={34} />
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold text-white">Alex Rivera</span>
          <span className="block truncate text-[11px] text-disc-muted">alex.r</span>
        </span>
      </button>
      <div className="flex">
        <IconButton label={muted ? "Unmute" : "Mute"} onClick={onMuted} active={muted}>
          {muted ? <MicOff size={18} /> : <Mic size={18} />}
        </IconButton>
        <IconButton label={deafened ? "Undeafen" : "Deafen"} onClick={onDeafened} active={deafened}>
          {deafened ? <VolumeX size={18} /> : <Headphones size={18} />}
        </IconButton>
        <IconButton label="User Settings" onClick={onSettings}>
          <Settings size={18} />
        </IconButton>
      </div>
    </div>
  );
}

function ChannelSidebar({
  server,
  activeChannelId,
  onChannel,
  onInvite,
  onCreateChannel,
  onSettings,
  onToast,
  muted,
  deafened,
  onMuted,
  onDeafened,
  mobileOpen,
  onCloseMobile,
}: {
  server: Server;
  activeChannelId: string;
  onChannel: (channel: Channel) => void;
  onInvite: () => void;
  onCreateChannel: () => void;
  onSettings: () => void;
  onToast: (text: string) => void;
  muted: boolean;
  deafened: boolean;
  onMuted: () => void;
  onDeafened: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const textChannels = server.channels.filter((c) => c.type === "text");
  const voiceChannels = server.channels.filter((c) => c.type === "voice");

  const section = (title: string, items: Channel[]) => (
    <div className="mb-3">
      <div className="group flex h-6 items-center px-1 text-[11px] font-bold uppercase tracking-[0.02em] text-disc-muted hover:text-disc-text">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center text-left"
          onClick={() => setCollapsed((prev) => ({ ...prev, [title]: !prev[title] }))}
        >
          <ChevronDown size={12} className={cn("mr-0.5 transition-transform", collapsed[title] && "-rotate-90")} />
          <span className="truncate">{title}</span>
        </button>
        <button type="button" onClick={onCreateChannel} aria-label={`Create ${title}`} title={`Create ${title}`} className="rounded p-1 hover:text-white">
          <Plus size={15} />
        </button>
      </div>
      {!collapsed[title] && (
        <div className="space-y-[2px]">
          {items.map((channel) => {
            const active = channel.id === activeChannelId;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => onChannel(channel)}
                className={cn(
                  "group relative flex h-8 w-full items-center rounded-[4px] px-2 text-left text-[15px] font-medium transition",
                  active ? "bg-disc-active text-white" : channel.unread ? "text-disc-text hover:bg-disc-hover" : "text-disc-muted hover:bg-disc-hover hover:text-disc-text"
                )}
              >
                {channel.unread && !active && <span className="absolute -left-2 h-2 w-1 rounded-r-full bg-white" />}
                {channel.type === "text" ? <Hash size={19} className="mr-1.5 shrink-0 text-disc-muted" /> : <Volume2 size={18} className="mr-2 shrink-0 text-disc-muted" />}
                <span className="min-w-0 flex-1 truncate">{channel.name}</span>
                {channel.badge && !active ? (
                  <span className="ml-1 min-w-4 rounded-full bg-disc-red px-1 text-center text-[10px] font-bold leading-4 text-white">{channel.badge}</span>
                ) : (
                  <span className="hidden items-center gap-1 text-disc-muted group-hover:flex">
                    {channel.type === "text" && <UserPlus size={14} onClick={(event) => { event.stopPropagation(); onInvite(); }} />}
                    <Settings size={14} onClick={(event) => { event.stopPropagation(); onToast("Channel settings are available in the connected app"); }} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <>
      {mobileOpen && <button type="button" className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={onCloseMobile} aria-label="Close navigation" />}
      <aside className={cn("channel-sidebar fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 -translate-x-full flex-col bg-disc-side transition-transform md:static md:z-auto md:translate-x-0", mobileOpen && "translate-x-0")}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="flex h-12 w-full items-center border-b border-black/20 px-4 text-left font-semibold text-white shadow-sm transition hover:bg-white/[0.03]"
          >
            <span className="min-w-0 flex-1 truncate">{server.name}</span>
            {menuOpen ? <X size={18} /> : <ChevronDown size={18} />}
          </button>
          {menuOpen && (
            <div className="absolute left-2 right-2 top-14 z-30 rounded-md bg-[#111214] p-1.5 text-sm shadow-2xl ring-1 ring-black/30">
              <button type="button" onClick={() => { setMenuOpen(false); onInvite(); }} className="menu-row text-[#b5bac1] hover:bg-disc-brand hover:text-white">
                Invite People <UserPlus size={17} />
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); onCreateChannel(); }} className="menu-row">
                Create Channel <Plus size={17} />
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); onToast("Server events are coming soon"); }} className="menu-row">
                Create Event <CalendarDays size={17} />
              </button>
              <div className="my-1 h-px bg-white/[0.08]" />
              <button type="button" onClick={() => { setMenuOpen(false); onToast("Server settings opened"); }} className="menu-row">
                Server Settings <Settings size={17} />
              </button>
              <button type="button" onClick={() => { setMenuOpen(false); onToast("Notification preference saved"); }} className="menu-row">
                Notification Settings <Bell size={17} />
              </button>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3 pt-4">
          <button type="button" onClick={() => onToast("Your server passed all community checks")} className="mb-4 flex w-full items-center gap-2 rounded bg-gradient-to-r from-disc-brand/20 to-fuchsia-500/10 px-2.5 py-2 text-left hover:from-disc-brand/30">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-disc-brand text-white"><Sparkles size={16} /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-white">Community goal</span>
              <span className="block truncate text-[11px] text-disc-muted">8 of 10 boosts</span>
            </span>
            <ChevronRight size={15} className="text-disc-muted" />
          </button>
          {section("Text channels", textChannels)}
          {section("Voice channels", voiceChannels)}
          <button type="button" onClick={() => onToast("Browse Channels opened")} className="flex h-8 w-full items-center gap-2 rounded px-2 text-sm font-medium text-disc-muted hover:bg-disc-hover hover:text-disc-text">
            <Compass size={18} /> Browse Channels
          </button>
        </div>
        <UserPanel muted={muted} deafened={deafened} onMuted={onMuted} onDeafened={onDeafened} onSettings={onSettings} />
      </aside>
    </>
  );
}

function HomeSidebar({
  activeDm,
  view,
  onFriends,
  onDm,
  onSettings,
  muted,
  deafened,
  onMuted,
  onDeafened,
  mobileOpen,
  onCloseMobile,
}: {
  activeDm: string;
  view: View;
  onFriends: () => void;
  onDm: (handle: string) => void;
  onSettings: () => void;
  muted: boolean;
  deafened: boolean;
  onMuted: () => void;
  onDeafened: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      {mobileOpen && <button type="button" className="fixed inset-0 z-30 bg-black/60 md:hidden" onClick={onCloseMobile} aria-label="Close navigation" />}
      <aside className={cn("fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 -translate-x-full flex-col bg-disc-side transition-transform md:static md:z-auto md:translate-x-0", mobileOpen && "translate-x-0")}>
        <div className="flex h-12 items-center border-b border-black/20 px-2.5 shadow-sm">
          <button type="button" className="w-full rounded bg-[#1e1f22] px-2.5 py-1.5 text-left text-xs text-disc-muted hover:text-disc-text">Find or start a conversation</button>
        </div>
        <nav className="space-y-0.5 p-2 pt-3">
          <button type="button" onClick={onFriends} className={cn("flex h-10 w-full items-center gap-3 rounded px-2 text-left text-[15px] font-medium", view === "friends" ? "bg-disc-active text-white" : "text-disc-muted hover:bg-disc-hover hover:text-disc-text")}>
            <Users size={21} /> Friends
          </button>
          <button type="button" className="flex h-10 w-full items-center gap-3 rounded px-2 text-left text-[15px] font-medium text-disc-muted hover:bg-disc-hover hover:text-disc-text">
            <Zap size={21} /> Nitro
          </button>
          <button type="button" className="flex h-10 w-full items-center gap-3 rounded px-2 text-left text-[15px] font-medium text-disc-muted hover:bg-disc-hover hover:text-disc-text">
            <ShopIcon /> Shop
          </button>
        </nav>
        <div className="mt-3 flex items-center px-4 text-xs font-semibold uppercase tracking-wide text-disc-muted">
          <span className="flex-1">Direct Messages</span><Plus size={15} />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-2 pt-1">
          {friends.slice(0, 5).map((friend) => (
            <button
              type="button"
              key={friend.handle}
              onClick={() => onDm(friend.handle)}
              className={cn("group flex h-11 w-full items-center gap-2.5 rounded px-2 text-left", view === "dm" && activeDm === friend.handle ? "bg-disc-active text-white" : "text-disc-muted hover:bg-disc-hover hover:text-disc-text")}
            >
              <Avatar name={friend.name} size={32} status={friend.status} />
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{friend.name}</span>
              <X size={14} className="hidden text-disc-muted group-hover:block" />
            </button>
          ))}
        </div>
        <UserPanel muted={muted} deafened={deafened} onMuted={onMuted} onDeafened={onDeafened} onSettings={onSettings} />
      </aside>
    </>
  );
}

function ShopIcon() {
  return <Gift size={21} />;
}

function ChatHeader({
  channel,
  showMembers,
  onToggleMembers,
  onMobileMenu,
  search,
  onSearch,
  onToast,
}: {
  channel: Channel;
  showMembers: boolean;
  onToggleMembers: () => void;
  onMobileMenu: () => void;
  search: string;
  onSearch: (value: string) => void;
  onToast: (text: string) => void;
}) {
  return (
    <header className="relative z-20 flex h-12 shrink-0 items-center gap-2 border-b border-black/20 bg-disc-chat px-2 shadow-sm sm:px-4">
      <IconButton label="Open channels" onClick={onMobileMenu} className="md:hidden"><Menu size={21} /></IconButton>
      <Hash size={24} className="shrink-0 text-disc-muted" />
      <span className="max-w-[160px] truncate font-semibold text-white">{channel.name}</span>
      {channel.topic && <><span className="mx-2 hidden h-6 w-px bg-white/[0.08] lg:block" /><span className="hidden min-w-0 flex-1 truncate text-sm text-disc-muted lg:block">{channel.topic}</span></>}
      <span className="flex-1 lg:hidden" />
      <div className="flex items-center gap-0.5">
        <IconButton label="Threads" onClick={() => onToast("No active threads in this channel")} className="hidden sm:inline-flex"><MessageCircle size={20} /></IconButton>
        <IconButton label="Notification Settings" onClick={() => onToast("Notifications set to mentions only")} className="hidden sm:inline-flex"><Bell size={20} /></IconButton>
        <IconButton label="Pinned Messages" onClick={() => onToast("There are 2 pinned messages")} className="hidden sm:inline-flex"><Pin size={20} /></IconButton>
        <IconButton label={showMembers ? "Hide Member List" : "Show Member List"} active={showMembers} onClick={onToggleMembers}><Users size={21} /></IconButton>
        <div className="relative ml-1 hidden md:block">
          <Search size={15} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-disc-muted" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search"
            aria-label="Search messages"
            className="h-6 w-32 rounded bg-disc-rail pl-7 pr-7 text-xs text-disc-text outline-none transition-all placeholder:text-disc-muted focus:w-52 focus:ring-1 focus:ring-disc-brand"
          />
          {search && <button type="button" onClick={() => onSearch("")} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-disc-muted hover:text-white"><X size={14} /></button>}
        </div>
        <IconButton label="Inbox" onClick={() => onToast("You are all caught up")} className="hidden sm:inline-flex"><Inbox size={20} /></IconButton>
        <IconButton label="Help" onClick={() => onToast("Tip: press Enter to send a message")} className="hidden sm:inline-flex"><CircleHelp size={20} /></IconButton>
      </div>
    </header>
  );
}

function AttachmentPreview({ attachment }: { attachment: NonNullable<ChatMessage["attachment"]> }) {
  if (attachment.kind === "file") {
    return (
      <div className="mt-2 flex max-w-md items-center gap-3 rounded-lg border border-black/30 bg-disc-side p-3">
        <span className="flex h-10 w-10 items-center justify-center rounded bg-disc-red/15 text-disc-red"><FileText size={23} /></span>
        <span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium text-[#00a8fc] hover:underline">{attachment.title}</span><span className="text-xs text-disc-muted">{attachment.meta}</span></span>
        <Download size={19} className="text-disc-muted" />
      </div>
    );
  }

  return (
    <div className="mt-2 max-w-[440px] overflow-hidden rounded-lg border border-black/20 bg-[#202228]">
      <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-[#17182a] via-[#282b4a] to-[#172b38] p-4 sm:p-6">
        <div className="absolute -right-12 -top-16 h-52 w-52 rounded-full bg-disc-brand/30 blur-2xl" />
        <div className="absolute -bottom-24 -left-8 h-52 w-52 rounded-full bg-cyan-400/20 blur-2xl" />
        <div className="relative mx-auto flex h-full max-w-[330px] flex-col rounded-xl border border-white/10 bg-[#f7f8ff] p-3 shadow-2xl sm:p-4">
          <div className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-disc-brand to-violet-400" />
            <span className="h-2.5 w-24 rounded-full bg-slate-300" />
            <span className="ml-auto h-6 w-14 rounded-md bg-indigo-500" />
          </div>
          <div className="mt-4 grid min-h-0 flex-1 grid-cols-[1fr_1.4fr] gap-3">
            <div className="rounded-lg bg-gradient-to-br from-indigo-100 to-fuchsia-100 p-2">
              <div className="h-2 w-2/3 rounded bg-indigo-300" />
              <div className="mt-2 h-2 w-full rounded bg-white/80" />
              <div className="mt-1 h-2 w-4/5 rounded bg-white/80" />
              <div className="mx-auto mt-3 h-12 w-12 rounded-full bg-gradient-to-br from-indigo-400 to-fuchsia-400" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-1/2 rounded bg-slate-300" />
              <div className="h-2 w-full rounded bg-slate-200" />
              <div className="h-2 w-4/5 rounded bg-slate-200" />
              <div className="grid grid-cols-2 gap-2 pt-1"><div className="h-8 rounded bg-slate-100" /><div className="h-8 rounded bg-slate-100" /></div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between px-3 py-2 text-xs text-disc-muted"><span>{attachment.title}</span><span>{attachment.meta}</span></div>
    </div>
  );
}

function MessageRow({
  message,
  onReaction,
  onReply,
  onDelete,
}: {
  message: ChatMessage;
  onReaction: (emoji: string) => void;
  onReply: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="message-row group relative mt-4 flex gap-3 px-4 py-0.5 pr-12 hover:bg-black/[0.06]">
      <Avatar name={message.author} status={message.status} size={40} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        {message.reply && (
          <div className="relative mb-1 flex items-center gap-1.5 text-xs text-disc-muted before:absolute before:-left-8 before:bottom-1/2 before:h-3 before:w-6 before:rounded-tl-md before:border-l-2 before:border-t-2 before:border-disc-muted/40">
            <Avatar name={message.reply.author} size={16} /><span className="font-medium text-disc-text">{message.reply.author}</span><span className="truncate">{message.reply.text}</span>
          </div>
        )}
        <div className="flex min-w-0 items-baseline gap-1.5">
          <button type="button" className="truncate text-[15px] font-semibold text-white hover:underline">{message.author}</button>
          {message.bot && <span className="inline-flex items-center gap-0.5 rounded bg-disc-brand px-1 py-0.5 text-[9px] font-bold uppercase leading-none text-white"><Check size={9} strokeWidth={4} /> App</span>}
          <span className="shrink-0 text-[11px] text-disc-muted">{message.time}</span>
          {message.edited && <span className="text-[10px] text-disc-muted">(edited)</span>}
        </div>
        <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.42] text-disc-text">{renderMessageText(message.content)}</p>
        {message.attachment && <AttachmentPreview attachment={message.attachment} />}
        {message.reactions && message.reactions.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {message.reactions.map((reaction) => (
              <button
                type="button"
                key={reaction.emoji}
                onClick={() => onReaction(reaction.emoji)}
                className={cn(
                  "flex h-6 items-center gap-1 rounded-md border px-1.5 text-sm transition",
                  reaction.mine ? "border-disc-brand bg-disc-brand/15" : "border-transparent bg-disc-side hover:border-disc-muted/50"
                )}
              >
                <span>{reaction.emoji}</span><span className={cn("text-xs font-medium", reaction.mine ? "text-[#c9cdfb]" : "text-disc-muted")}>{reaction.count}</span>
              </button>
            ))}
            <button type="button" onClick={() => onReaction("✨")} aria-label="Add reaction" className="hidden h-6 items-center rounded-md bg-disc-side px-1.5 text-disc-muted hover:text-white group-hover:flex"><Smile size={14} /></button>
          </div>
        )}
      </div>
      <div className="absolute -top-3 right-4 hidden overflow-hidden rounded-md border border-black/30 bg-disc-side shadow-lg group-hover:flex">
        <IconButton label="Add Reaction" onClick={() => onReaction("👍")}><Smile size={17} /></IconButton>
        <IconButton label="Reply" onClick={onReply}><MessageCircle size={17} /></IconButton>
        <IconButton label="More"><MoreHorizontal size={18} /></IconButton>
        {message.author === "You" && <IconButton label="Delete" onClick={onDelete} className="hover:text-disc-red"><Trash2 size={16} /></IconButton>}
      </div>
    </article>
  );
}

function Composer({
  channelName,
  value,
  onChange,
  onSend,
  replyTo,
  onCancelReply,
  onToast,
}: {
  channelName: string;
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  replyTo: string | null;
  onCancelReply: () => void;
  onToast: (text: string) => void;
}) {
  const [picker, setPicker] = useState<"attach" | "emoji" | null>(null);

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend();
    }
  }

  return (
    <div className="relative shrink-0 px-4 pb-5 pt-2">
      {replyTo && (
        <div className="flex h-9 items-center rounded-t-lg bg-[#292b2f] px-3 text-xs text-disc-muted">
          <span className="flex-1">Replying to <strong className="text-disc-text">{replyTo}</strong></span>
          <button type="button" onClick={onCancelReply} className="rounded-full text-disc-muted hover:text-white"><X size={16} /></button>
        </div>
      )}
      <div className={cn("flex min-h-11 items-start rounded-lg bg-disc-active", replyTo && "rounded-t-none")}>
        <div className="relative">
          <IconButton label="Add Attachment" onClick={() => setPicker(picker === "attach" ? null : "attach")} className="ml-1 mt-1.5 h-8 w-8 rounded-full hover:bg-transparent">
            <Plus size={22} className="rounded-full bg-disc-muted text-disc-active group-hover:bg-disc-text" />
          </IconButton>
          {picker === "attach" && (
            <div className="absolute bottom-11 left-0 z-30 w-52 rounded-lg bg-[#111214] p-1.5 text-sm shadow-2xl ring-1 ring-black/30">
              <button type="button" onClick={() => { setPicker(null); onToast("Attachment picker opened"); }} className="menu-row"><span className="flex items-center gap-2"><Paperclip size={17} /> Upload a File</span></button>
              <button type="button" onClick={() => { setPicker(null); onToast("Create Thread selected"); }} className="menu-row"><span className="flex items-center gap-2"><MessageCircle size={17} /> Create Thread</span></button>
              <button type="button" onClick={() => { setPicker(null); onToast("App launcher opened"); }} className="menu-row"><span className="flex items-center gap-2"><Gamepad2 size={17} /> Use Apps</span></button>
            </div>
          )}
        </div>
        <textarea
          rows={1}
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, 2000))}
          onKeyDown={onKeyDown}
          placeholder={`Message #${channelName}`}
          aria-label={`Message ${channelName}`}
          className="max-h-36 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-[11px] text-[15px] leading-[22px] text-disc-text outline-none placeholder:text-disc-muted"
        />
        <div className="flex items-center pr-1 pt-1.5">
          <IconButton label="Send a gift" onClick={() => onToast("Gift inventory opened")} className="hidden sm:inline-flex"><Gift size={20} fill="currentColor" /></IconButton>
          <button type="button" onClick={() => onToast("GIF picker opened")} className="hidden h-8 items-center px-1 text-[10px] font-black text-disc-muted hover:text-disc-text sm:flex">GIF</button>
          <IconButton label="Open sticker picker" onClick={() => onToast("Sticker picker opened")} className="hidden sm:inline-flex"><Sticker size={20} fill="currentColor" /></IconButton>
          <div className="relative">
            <IconButton label="Select emoji" onClick={() => setPicker(picker === "emoji" ? null : "emoji")}><Smile size={21} fill="currentColor" /></IconButton>
            {picker === "emoji" && (
              <div className="absolute bottom-11 right-0 z-30 grid w-48 grid-cols-5 gap-1 rounded-lg bg-[#111214] p-2 text-xl shadow-2xl ring-1 ring-black/30">
                {["😀", "😂", "🥹", "😍", "🤔", "👍", "👏", "🔥", "✨", "💜"].map((emoji) => (
                  <button type="button" key={emoji} onClick={() => { onChange(value + emoji); setPicker(null); }} className="flex h-8 items-center justify-center rounded hover:bg-disc-active">{emoji}</button>
                ))}
              </div>
            )}
          </div>
          {value.trim() && <IconButton label="Send" onClick={onSend} className="text-[#b5b9ff] hover:text-white"><Send size={19} /></IconButton>}
        </div>
      </div>
      <div className="absolute bottom-0 left-4 text-[11px] font-medium text-disc-muted"><strong className="text-disc-text">Juno Park</strong> is typing<span className="typing-dots">...</span></div>
    </div>
  );
}

function SearchResults({ query, messages, onClose }: { query: string; messages: ChatMessage[]; onClose: () => void }) {
  const results = messages.filter((message) => `${message.author} ${message.content}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="absolute right-3 top-14 z-40 w-[min(420px,calc(100vw-24px))] overflow-hidden rounded-lg bg-[#111214] shadow-2xl ring-1 ring-black/40">
      <div className="flex items-center border-b border-white/[0.07] px-4 py-3"><Search size={16} className="mr-2 text-disc-muted" /><span className="min-w-0 flex-1 truncate text-sm font-semibold text-white">Search results for “{query}”</span><button type="button" onClick={onClose}><X size={17} className="text-disc-muted hover:text-white" /></button></div>
      <div className="max-h-[420px] overflow-y-auto p-3">
        <p className="mb-2 text-xs font-semibold uppercase text-disc-muted">{results.length} results</p>
        {results.map((message) => (
          <div key={message.id} className="mb-2 rounded-md bg-disc-side p-3">
            <div className="flex items-center gap-2"><Avatar name={message.author} size={24} /><span className="text-sm font-semibold text-white">{message.author}</span><span className="text-[10px] text-disc-muted">{message.time}</span></div>
            <p className="mt-1 line-clamp-3 text-sm text-disc-text">{message.content}</p>
          </div>
        ))}
        {results.length === 0 && <div className="py-10 text-center"><Search size={30} className="mx-auto text-disc-muted" /><p className="mt-2 text-sm text-disc-muted">We searched everywhere, but found nothing.</p></div>}
      </div>
    </div>
  );
}

function ChatPanel({
  channel,
  messages,
  showMembers,
  onToggleMembers,
  onMobileMenu,
  onUpdateMessages,
  onToast,
}: {
  channel: Channel;
  messages: ChatMessage[];
  showMembers: boolean;
  onToggleMembers: () => void;
  onMobileMenu: () => void;
  onUpdateMessages: (messages: ChatMessage[]) => void;
  onToast: (text: string) => void;
}) {
  const [composer, setComposer] = useState("");
  const [search, setSearch] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const bottom = useRef<HTMLDivElement>(null);

  function send() {
    const text = composer.trim();
    if (!text) return;
    const newMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      author: "You",
      handle: "alex.r",
      time: new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date()),
      content: text,
      color: "#5865f2",
      status: "online",
      reply: replyTo ? { author: replyTo, text: "Replying to an earlier message" } : undefined,
    };
    onUpdateMessages([...messages, newMessage]);
    setComposer("");
    setReplyTo(null);
    setTimeout(() => bottom.current?.scrollIntoView({ behavior: "smooth" }), 30);
  }

  function react(messageId: string, emoji: string) {
    onUpdateMessages(messages.map((message) => {
      if (message.id !== messageId) return message;
      const reactions = [...(message.reactions ?? [])];
      const existing = reactions.find((reaction) => reaction.emoji === emoji);
      if (existing) {
        return { ...message, reactions: reactions.map((reaction) => reaction.emoji === emoji ? { ...reaction, count: reaction.count + (reaction.mine ? -1 : 1), mine: !reaction.mine } : reaction).filter((reaction) => reaction.count > 0) };
      }
      return { ...message, reactions: [...reactions, { emoji, count: 1, mine: true }] };
    }));
  }

  return (
    <section className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-disc-chat">
      <ChatHeader channel={channel} showMembers={showMembers} onToggleMembers={onToggleMembers} onMobileMenu={onMobileMenu} search={search} onSearch={setSearch} onToast={onToast} />
      {search && <SearchResults query={search} messages={messages} onClose={() => setSearch("")} />}
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-1">
        <div className="flex min-h-[230px] flex-col justify-end px-4 pb-4 pt-10">
          <span className="mb-3 flex h-[68px] w-[68px] items-center justify-center rounded-full bg-disc-active text-white"><Hash size={42} strokeWidth={2.5} /></span>
          <h1 className="text-[30px] font-bold leading-tight text-white">Welcome to #{channel.name}!</h1>
          <p className="mt-1 text-sm text-disc-muted">This is the start of the #{channel.name} channel.</p>
        </div>
        <div className="relative my-5 flex items-center px-4"><span className="h-px flex-1 bg-white/[0.08]" /><span className="px-2 text-[11px] font-semibold text-disc-muted">September 8, 2026</span><span className="h-px flex-1 bg-white/[0.08]" /></div>
        {messages.map((message) => (
          <MessageRow
            key={message.id}
            message={message}
            onReaction={(emoji) => react(message.id, emoji)}
            onReply={() => { setReplyTo(message.author); onToast(`Replying to ${message.author}`); }}
            onDelete={() => onUpdateMessages(messages.filter((item) => item.id !== message.id))}
          />
        ))}
        {messages.length === 0 && <p className="px-4 py-6 text-sm text-disc-muted">It is quiet here. Be the first to say something.</p>}
        <div ref={bottom} />
      </div>
      <Composer channelName={channel.name} value={composer} onChange={setComposer} onSend={send} replyTo={replyTo} onCancelReply={() => setReplyTo(null)} onToast={onToast} />
    </section>
  );
}

function MembersPanel({ onToast }: { onToast: (text: string) => void }) {
  const admins = members.filter((member) => member.role === "admin");
  const online = members.filter((member) => member.role !== "admin" && member.status !== "offline");
  const offline = members.filter((member) => member.status === "offline");

  const group = (title: string, list: Member[]) => (
    <div className="mb-5">
      <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.02em] text-disc-muted">{title} — {list.length}</p>
      {list.map((member) => (
        <button type="button" onClick={() => onToast(`Opened ${member.name}’s profile`)} key={member.handle} className="flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-left hover:bg-disc-hover">
          <Avatar name={member.name} status={member.status} size={32} className={member.status === "offline" ? "opacity-50" : ""} />
          <span className={cn("min-w-0 flex-1", member.status === "offline" && "opacity-45")}>
            <span className={cn("flex items-center gap-1 truncate text-sm font-medium", member.role === "admin" ? "text-[#f0b232]" : member.role === "bot" ? "text-[#c9cdfb]" : "text-disc-muted")}>
              {member.name}{member.role === "admin" && <Crown size={12} fill="currentColor" />}{member.role === "bot" && <ShieldCheck size={12} />}
            </span>
            {member.activity && <span className="block truncate text-[10px] text-disc-muted">{member.activity}</span>}
          </span>
        </button>
      ))}
    </div>
  );

  return (
    <aside className="hidden h-full w-60 shrink-0 overflow-y-auto bg-disc-side px-2 pb-6 pt-6 xl:block">
      {group("Admin", admins)}
      {group("Online", online)}
      {group("Offline", offline)}
    </aside>
  );
}

function FriendsView({ onDm, onMobileMenu, onToast }: { onDm: (handle: string) => void; onMobileMenu: () => void; onToast: (text: string) => void }) {
  const [tab, setTab] = useState<FriendTab>("online");
  const [query, setQuery] = useState("");
  const [username, setUsername] = useState("");
  const visible = friends.filter((friend) => (tab === "all" || friend.status !== "offline") && `${friend.name} ${friend.handle}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-disc-chat">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-black/20 px-2 shadow-sm sm:px-4">
        <IconButton label="Open navigation" onClick={onMobileMenu} className="md:hidden"><Menu size={21} /></IconButton>
        <Users size={21} className="text-disc-muted" /><strong className="mr-2 text-sm text-white">Friends</strong><span className="hidden h-6 w-px bg-white/[0.08] sm:block" />
        {(["online", "all", "pending", "add"] as FriendTab[]).map((item) => (
          <button type="button" key={item} onClick={() => setTab(item)} className={cn("rounded px-2.5 py-1 text-sm font-medium capitalize", tab === item ? item === "add" ? "bg-disc-green text-white" : "bg-disc-active text-white" : item === "add" ? "bg-disc-green text-white" : "text-disc-muted hover:bg-disc-hover hover:text-disc-text")}>
            {item === "add" ? "Add Friend" : item}{item === "pending" && <span className="ml-1.5 rounded-full bg-disc-red px-1.5 text-[10px] text-white">2</span>}
          </button>
        ))}
        <span className="flex-1" /><IconButton label="New Group DM"><MessageCircle size={20} /></IconButton><IconButton label="Inbox"><Inbox size={20} /></IconButton><IconButton label="Help"><CircleHelp size={20} /></IconButton>
      </header>
      {tab === "add" ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
          <h1 className="text-base font-bold uppercase text-white">Add Friend</h1>
          <p className="mt-2 text-sm text-disc-muted">You can add friends with their Dylug username.</p>
          <form onSubmit={(event) => { event.preventDefault(); if (username.trim()) { onToast(`Friend request sent to ${username.trim()}`); setUsername(""); } }} className="mt-5 flex max-w-3xl rounded-lg border border-transparent bg-disc-rail p-2 focus-within:border-disc-brand">
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="You can add friends with their Dylug username." className="min-w-0 flex-1 bg-transparent px-2 text-sm text-disc-text outline-none placeholder:text-disc-muted" />
            <button type="submit" disabled={!username.trim()} className="rounded bg-disc-brand px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40">Send Friend Request</button>
          </form>
          <div className="mx-auto mt-20 max-w-sm text-center"><span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-disc-side text-disc-brand"><UserPlus size={43} /></span><p className="mt-5 text-sm text-disc-muted">Wumpus is waiting on friends. You do not have to, though!</p></div>
        </div>
      ) : tab === "pending" ? (
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
          <p className="text-xs font-semibold uppercase text-disc-muted">Pending — 2</p>
          {[friends[3], friends[4]].map((friend, index) => (
            <div key={friend.handle} className="mt-2 flex max-w-3xl items-center gap-3 border-t border-white/[0.06] px-2 py-3 hover:rounded-lg hover:bg-disc-hover">
              <Avatar name={friend.name} status={friend.status} size={40} /><span className="min-w-0 flex-1"><strong className="block text-sm text-white">{friend.name}</strong><span className="text-xs text-disc-muted">{index === 0 ? "Incoming Friend Request" : "Outgoing Friend Request"}</span></span>
              <IconButton label="Accept" onClick={() => onToast(`${friend.name} is now your friend`)} className="rounded-full bg-disc-side hover:text-disc-green"><Check size={18} /></IconButton><IconButton label="Ignore" className="rounded-full bg-disc-side hover:text-disc-red"><X size={18} /></IconButton>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <div className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-8">
            <div className="relative max-w-3xl"><Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-disc-muted" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" className="h-9 w-full rounded bg-disc-rail px-3 pr-10 text-sm text-disc-text outline-none focus:ring-1 focus:ring-disc-brand" /></div>
            <p className="mt-5 text-xs font-semibold uppercase text-disc-muted">{tab === "online" ? "Online" : "All Friends"} — {visible.length}</p>
            <div className="mt-2 max-w-3xl">
              {visible.map((friend) => (
                <div key={friend.handle} className="group flex items-center gap-3 border-t border-white/[0.06] px-2 py-3 hover:rounded-lg hover:bg-disc-hover">
                  <Avatar name={friend.name} status={friend.status} size={40} />
                  <span className="min-w-0 flex-1"><span className="flex items-center gap-1"><strong className="truncate text-sm text-white">{friend.name}</strong><span className="hidden text-xs text-disc-muted group-hover:inline">{friend.handle}</span></span><span className="block truncate text-xs text-disc-muted">{friend.activity}</span></span>
                  <IconButton label="Message" onClick={() => onDm(friend.handle)} className="rounded-full bg-disc-side"><MessageCircle size={18} fill="currentColor" /></IconButton><IconButton label="More" className="rounded-full bg-disc-side"><MoreHorizontal size={19} /></IconButton>
                </div>
              ))}
            </div>
          </div>
          <aside className="hidden w-[340px] shrink-0 border-l border-white/[0.06] p-5 2xl:block">
            <h2 className="text-lg font-bold text-white">Active Now</h2>
            <div className="mt-4 rounded-lg bg-disc-side p-4"><div className="flex items-center gap-2"><Avatar name="Maya Chen" status="online" size={36} /><span><strong className="block text-sm text-white">Maya Chen</strong><span className="text-xs text-disc-muted">Designing in Figma</span></span></div><div className="mt-3 rounded-md bg-disc-rail p-3"><p className="text-sm font-semibold text-white">Dashboard explorations</p><p className="mt-1 text-xs text-disc-muted">Working with 2 others</p></div></div>
          </aside>
        </div>
      )}
    </section>
  );
}

function DMView({ friend, onMobileMenu, onToast }: { friend: (typeof friends)[number]; onMobileMenu: () => void; onToast: (text: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>(dmMessages[friend.handle] ?? []);
  const [body, setBody] = useState("");

  function send() {
    if (!body.trim()) return;
    setMessages((current) => [...current, { id: `dm-${Date.now()}`, author: "You", handle: "alex.r", time: new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(new Date()), content: body.trim(), color: "#5865f2", status: "online" }]);
    setBody("");
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-disc-chat">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-black/20 px-2 shadow-sm sm:px-4">
        <IconButton label="Open navigation" onClick={onMobileMenu} className="md:hidden"><Menu size={21} /></IconButton><AtSign size={22} className="text-disc-muted" /><strong className="text-sm text-white">{friend.name}</strong><span className="mx-2 h-6 w-px bg-white/[0.08]" /><span className="text-xs text-disc-muted">{friend.status === "online" ? "Online" : friend.activity}</span><span className="flex-1" />
        <IconButton label="Start Voice Call" onClick={() => onToast(`Calling ${friend.name}…`)}><Phone size={20} fill="currentColor" /></IconButton><IconButton label="Start Video Call" onClick={() => onToast(`Starting video with ${friend.name}…`)}><Video size={20} fill="currentColor" /></IconButton><IconButton label="Pinned Messages"><Pin size={20} /></IconButton><IconButton label="Add Friends to DM"><UserPlus size={20} /></IconButton>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto pb-4">
        <div className="px-4 pb-5 pt-14"><Avatar name={friend.name} status={friend.status} size={80} /><h1 className="mt-3 text-3xl font-bold text-white">{friend.name}</h1><p className="mt-1 text-sm text-disc-muted">{friend.handle}</p><p className="mt-3 text-sm text-disc-text">This is the beginning of your direct message history with <strong>{friend.name}</strong>.</p><p className="mt-1 text-xs text-disc-muted">{friend.mutual} Mutual Servers • 4 Mutual Friends</p></div>
        <div className="relative my-4 flex items-center px-4"><span className="h-px flex-1 bg-white/[0.08]" /><span className="px-2 text-[11px] font-semibold text-disc-muted">September 8, 2026</span><span className="h-px flex-1 bg-white/[0.08]" /></div>
        {messages.map((message) => <MessageRow key={message.id} message={message} onReaction={(emoji) => setMessages((current) => current.map((item) => item.id === message.id ? { ...item, reactions: [...(item.reactions ?? []), { emoji, count: 1, mine: true }] } : item))} onReply={() => { setBody(`@${message.author} `); }} onDelete={() => setMessages((current) => current.filter((item) => item.id !== message.id))} />)}
      </div>
      <Composer channelName={friend.name} value={body} onChange={setBody} onSend={send} replyTo={null} onCancelReply={() => undefined} onToast={onToast} />
    </section>
  );
}

function ModalFrame({ title, subtitle, onClose, children }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={title} onMouseDown={(event) => { if (event.currentTarget === event.target) onClose(); }}>
      <div className="modal-enter w-full max-w-md overflow-hidden rounded-xl bg-disc-side shadow-2xl ring-1 ring-white/[0.06]">
        <div className="relative px-6 pb-4 pt-6 text-center"><button type="button" onClick={onClose} aria-label="Close" className="absolute right-4 top-4 text-disc-muted hover:text-white"><X size={21} /></button><h2 className="text-xl font-bold text-white">{title}</h2>{subtitle && <p className="mt-1 text-sm leading-5 text-disc-muted">{subtitle}</p>}</div>
        {children}
      </div>
    </div>
  );
}

function WorkspaceModal({ modal, onClose, onCreateServer, onCreateChannel, onToast }: { modal: Modal; onClose: () => void; onCreateServer: (name: string) => void; onCreateChannel: (name: string) => void; onToast: (text: string) => void }) {
  const [value, setValue] = useState("");
  if (!modal) return null;

  if (modal === "settings") {
    return (
      <div className="fixed inset-0 z-[100] flex bg-[#313338] text-disc-text">
        <aside className="hidden w-[35%] justify-end bg-disc-side py-14 pr-3 md:flex"><div className="w-52"><p className="px-2 pb-1 text-xs font-semibold uppercase text-disc-muted">User Settings</p>{["My Account", "Profiles", "Privacy & Safety", "Authorized Apps", "Connections"].map((item, index) => <button type="button" key={item} className={cn("block w-full rounded px-2.5 py-1.5 text-left text-sm", index === 0 ? "bg-disc-active text-white" : "text-disc-muted hover:bg-disc-hover hover:text-disc-text")}>{item}</button>)}<div className="my-2 h-px bg-white/[0.08]" /><button type="button" className="flex w-full items-center justify-between rounded px-2.5 py-1.5 text-sm text-disc-red hover:bg-disc-red hover:text-white">Log Out <LogOutIcon /></button></div></aside>
        <main className="relative flex-1 overflow-y-auto px-6 py-14 md:px-10"><button type="button" onClick={onClose} className="absolute right-6 top-10 flex flex-col items-center text-disc-muted hover:text-white"><span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-current"><X size={20} /></span><span className="mt-1 text-[10px] font-semibold">ESC</span></button><div className="max-w-2xl"><h1 className="mb-5 text-xl font-bold text-white">My Account</h1><div className="overflow-hidden rounded-lg bg-disc-rail"><div className="h-24 bg-gradient-to-r from-disc-brand to-violet-500" /><div className="relative px-4 pb-4"><Avatar name="Alex Rivera" status="online" size={82} className="-mt-10 border-[6px] border-disc-rail rounded-full" /><button type="button" onClick={() => onToast("Profile editor opened")} className="absolute right-4 top-4 rounded bg-disc-brand px-4 py-2 text-sm font-medium text-white hover:brightness-110">Edit User Profile</button><div className="mt-4 rounded-lg bg-disc-side p-4"><SettingRow label="Display Name" value="Alex Rivera" /><SettingRow label="Username" value="alex.r" /><SettingRow label="Email" value="a••••@example.com" last /></div></div></div><h2 className="mt-8 text-base font-bold text-white">Password and Authentication</h2><button type="button" className="mt-4 rounded bg-disc-brand px-4 py-2 text-sm font-medium text-white">Change Password</button></div></main>
      </div>
    );
  }

  if (modal === "invite") {
    return (
      <ModalFrame title="Invite friends to The Nook" subtitle="Share this link with others to grant access to this server." onClose={onClose}>
        <div className="px-6 pb-6"><label className="text-xs font-bold uppercase text-disc-muted">Send a server invite link to a friend</label><div className="mt-2 flex rounded bg-disc-rail p-1.5"><input readOnly value="https://dylug.app/invite/nook-8FX2" className="min-w-0 flex-1 bg-transparent px-2 text-sm text-disc-text outline-none" /><button type="button" onClick={() => { navigator.clipboard?.writeText("https://dylug.app/invite/nook-8FX2"); onToast("Invite link copied"); }} className="rounded bg-disc-brand px-4 py-1.5 text-sm font-medium text-white">Copy</button></div><p className="mt-2 text-xs text-disc-muted">Your invite link expires in 7 days.</p><div className="mt-5 space-y-2">{friends.slice(0, 3).map((friend) => <div key={friend.handle} className="flex items-center gap-2"><Avatar name={friend.name} status={friend.status} size={34} /><span className="flex-1 text-sm font-medium text-white">{friend.name}</span><button type="button" onClick={() => onToast(`Invite sent to ${friend.name}`)} className="rounded border border-disc-green px-3 py-1 text-xs font-medium text-disc-green hover:bg-disc-green hover:text-white">Invite</button></div>)}</div></div>
      </ModalFrame>
    );
  }

  const createServer = modal === "create-server";
  return (
    <ModalFrame title={createServer ? "Create your server" : "Create a channel"} subtitle={createServer ? "Your server is where you and your friends hang out. Make yours and start talking." : "Give your new text channel a name."} onClose={onClose}>
      <form onSubmit={(event: FormEvent) => { event.preventDefault(); if (!value.trim()) return; if (createServer) onCreateServer(value.trim()); else onCreateChannel(value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-")); onClose(); }}>
        <div className="px-6 pb-5">
          {createServer && <button type="button" className="mx-auto mb-5 flex h-20 w-20 flex-col items-center justify-center rounded-full border-2 border-dashed border-disc-muted text-disc-muted hover:border-white hover:text-white"><Plus size={24} /><span className="text-[9px] font-bold uppercase">Upload</span></button>}
          {!createServer && <label className="mb-2 flex items-center gap-2 rounded bg-disc-rail px-3 py-2 text-sm text-disc-muted"><span className="flex h-4 w-4 items-center justify-center rounded-full border-4 border-disc-brand" /> Text</label>}
          <label className="text-xs font-bold uppercase text-disc-muted">{createServer ? "Server name" : "Channel name"}</label>
          <div className="relative mt-2">{!createServer && <Hash size={19} className="absolute left-3 top-1/2 -translate-y-1/2 text-disc-muted" />}<input autoFocus value={value} onChange={(event) => setValue(event.target.value)} maxLength={createServer ? 100 : 50} placeholder={createServer ? "Alex's server" : "new-channel"} className={cn("h-10 w-full rounded bg-disc-rail px-3 text-sm text-white outline-none focus:ring-2 focus:ring-disc-brand", !createServer && "pl-9")} /></div>
        </div>
        <div className="flex items-center justify-end gap-3 bg-[#2b2d31] px-6 py-4"><button type="button" onClick={onClose} className="text-sm text-white hover:underline">Cancel</button><button type="submit" disabled={!value.trim()} className="rounded bg-disc-brand px-4 py-2 text-sm font-medium text-white hover:brightness-110 disabled:opacity-40">{createServer ? "Create" : "Create Channel"}</button></div>
      </form>
    </ModalFrame>
  );
}

function SettingRow({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return <div className={cn("flex items-center py-3", !last && "border-b border-white/[0.06]")}><span className="min-w-0 flex-1"><span className="block text-[11px] font-bold uppercase text-disc-muted">{label}</span><span className="text-sm text-white">{value}</span></span><button type="button" className="rounded bg-disc-active px-3 py-1.5 text-xs font-medium text-white hover:bg-disc-hover"><Pencil size={13} className="inline mr-1" /> Edit</button></div>;
}

function LogOutIcon() {
  return <ChevronRight size={16} />;
}

export default function DemoWorkspace() {
  const [servers, setServers] = useState<Server[]>(initialServers);
  const [activeServerId, setActiveServerId] = useState("nook");
  const [activeChannelId, setActiveChannelId] = useState("general");
  const [view, setView] = useState<View>("guild");
  const [activeDm, setActiveDm] = useState("junopark");
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, ChatMessage[]>>(initialMessages);
  const [showMembers, setShowMembers] = useState(true);
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [deafened, setDeafened] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  const server = servers.find((item) => item.id === activeServerId) ?? servers[0];
  const channel = server.channels.find((item) => item.id === activeChannelId && item.type === "text") ?? server.channels.find((item) => item.type === "text")!;
  const activeFriend = friends.find((friend) => friend.handle === activeDm) ?? friends[0];
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify(text: string) {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  function selectServer(id: string) {
    const selected = servers.find((item) => item.id === id);
    setActiveServerId(id);
    setView("guild");
    setActiveChannelId(selected?.channels.find((item) => item.type === "text")?.id ?? "general");
    setMobileMenu(false);
  }

  function selectChannel(selected: Channel) {
    if (selected.type === "voice") {
      notify(`Connected to ${selected.name}`);
      return;
    }
    setActiveChannelId(selected.id);
    setMobileMenu(false);
    setServers((current) => current.map((item) => item.id === activeServerId ? { ...item, channels: item.channels.map((entry) => entry.id === selected.id ? { ...entry, unread: false, badge: undefined } : entry) } : item));
  }

  function createServer(name: string) {
    const id = `server-${Date.now()}`;
    const created: Server = { id, name, mark: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), accent: "linear-gradient(145deg,#23a55a,#0ea5e9)", channels: [{ id: `${id}-general`, name: "general", type: "text", topic: `Welcome to ${name}` }, { id: `${id}-lounge`, name: "Lounge", type: "voice" }] };
    setServers((current) => [...current, created]);
    setActiveServerId(id);
    setActiveChannelId(`${id}-general`);
    setView("guild");
    notify(`${name} created`);
  }

  function createChannel(name: string) {
    const id = `${activeServerId}-${name}-${Date.now()}`;
    setServers((current) => current.map((item) => item.id === activeServerId ? { ...item, channels: [...item.channels.filter((entry) => entry.type === "text"), { id, name, type: "text" as const, topic: `Welcome to #${name}` }, ...item.channels.filter((entry) => entry.type === "voice")] } : item));
    setActiveChannelId(id);
    setMessagesByChannel((current) => ({ ...current, [id]: [] }));
    notify(`#${name} created`);
  }

  return (
    <main className="relative flex h-[100dvh] min-h-0 w-full overflow-hidden bg-disc-chat text-disc-text selection:bg-disc-brand/60 selection:text-white">
      <ServerRail servers={servers} activeServerId={activeServerId} view={view} onHome={() => { setView("friends"); setMobileMenu(false); }} onServer={selectServer} onCreate={() => setModal("create-server")} onToast={notify} />
      {view === "guild" ? (
        <ChannelSidebar server={server} activeChannelId={channel.id} onChannel={selectChannel} onInvite={() => setModal("invite")} onCreateChannel={() => setModal("create-channel")} onSettings={() => setModal("settings")} onToast={notify} muted={muted} deafened={deafened} onMuted={() => setMuted((value) => !value)} onDeafened={() => setDeafened((value) => !value)} mobileOpen={mobileMenu} onCloseMobile={() => setMobileMenu(false)} />
      ) : (
        <HomeSidebar activeDm={activeDm} view={view} onFriends={() => { setView("friends"); setMobileMenu(false); }} onDm={(handle) => { setActiveDm(handle); setView("dm"); setMobileMenu(false); }} onSettings={() => setModal("settings")} muted={muted} deafened={deafened} onMuted={() => setMuted((value) => !value)} onDeafened={() => setDeafened((value) => !value)} mobileOpen={mobileMenu} onCloseMobile={() => setMobileMenu(false)} />
      )}
      {view === "guild" ? (
        <>
          <ChatPanel key={channel.id} channel={channel} messages={messagesByChannel[channel.id] ?? []} showMembers={showMembers} onToggleMembers={() => setShowMembers((value) => !value)} onMobileMenu={() => setMobileMenu(true)} onUpdateMessages={(messages) => setMessagesByChannel((current) => ({ ...current, [channel.id]: messages }))} onToast={notify} />
          {showMembers && <MembersPanel onToast={notify} />}
        </>
      ) : view === "friends" ? (
        <FriendsView onDm={(handle) => { setActiveDm(handle); setView("dm"); }} onMobileMenu={() => setMobileMenu(true)} onToast={notify} />
      ) : (
        <DMView key={activeFriend.handle} friend={activeFriend} onMobileMenu={() => setMobileMenu(true)} onToast={notify} />
      )}
      <WorkspaceModal modal={modal} onClose={() => setModal(null)} onCreateServer={createServer} onCreateChannel={createChannel} onToast={notify} />
      {toast && <div className="toast-enter fixed bottom-6 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-2 rounded-lg bg-[#111214] px-4 py-2.5 text-sm font-medium text-white shadow-2xl ring-1 ring-white/[0.08]"><Check size={16} className="text-disc-green" />{toast}</div>}
    </main>
  );
}
