"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Gift, Hash, LoaderCircle, MessageCircle, MoreHorizontal, Pencil, Plus, Send, Smile, Sticker, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

type Msg = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  edited_at?: string | null;
  reply_to?: string | null;
};

type Profile = {
  name: string;
  avatar_url?: string | null;
  status?: "online" | "idle" | "dnd" | "offline";
  role?: string;
};

type Reaction = { message_id: string; user_id: string; emoji: string };

function timeLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default function GuildChat({
  channelId,
  channelName,
  currentUserId,
  initial,
  profiles,
  initialReactions = [],
}: {
  channelId: string;
  channelName: string;
  currentUserId: string;
  initial: Msg[];
  profiles: Record<string, Profile>;
  initialReactions?: Reaction[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(false);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`channel:${channelId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages", filter: `channel_id=eq.${channelId}` }, (payload) => {
        if (payload.eventType === "INSERT") {
          const row = payload.new as Msg;
          setMessages((current) => current.some((message) => message.id === row.id) ? current : [...current, row]);
        } else if (payload.eventType === "UPDATE") {
          const row = payload.new as Msg;
          setMessages((current) => current.map((message) => message.id === row.id ? row : message));
        } else if (payload.eventType === "DELETE") {
          const row = payload.old as Partial<Msg>;
          setMessages((current) => current.filter((message) => message.id !== row.id));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "message_reactions" }, (payload) => {
        const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as Reaction;
        if (!row.message_id) return;
        if (payload.eventType === "INSERT") {
          setReactions((current) => current.some((reaction) => reaction.message_id === row.message_id && reaction.user_id === row.user_id && reaction.emoji === row.emoji) ? current : [...current, row]);
        } else if (payload.eventType === "DELETE") {
          setReactions((current) => current.filter((reaction) => !(reaction.message_id === row.message_id && reaction.user_id === row.user_id && reaction.emoji === row.emoji)));
        }
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => { setLive(false); void supabase.removeChannel(channel); };
  }, [channelId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  const byId = useMemo(() => Object.fromEntries(messages.map((message) => [message.id, message])), [messages]);

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    setError(null);
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("messages")
      .insert({ channel_id: channelId, author_id: currentUserId, body: text.slice(0, 2000), reply_to: replyTo?.id ?? null })
      .select("id,author_id,body,created_at,edited_at,reply_to")
      .single();
    setSending(false);
    if (error) { setError(error.message); return; }
    setBody("");
    setReplyTo(null);
    if (data) setMessages((current) => current.some((message) => message.id === data.id) ? current : [...current, data as Msg]);
  }

  async function saveEdit(messageId: string) {
    const text = editBody.trim();
    if (!text) return;
    const supabase = createClient();
    const { error } = await supabase.from("messages").update({ body: text.slice(0, 2000), edited_at: new Date().toISOString() }).eq("id", messageId).eq("author_id", currentUserId);
    if (error) { setError(error.message); return; }
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, body: text, edited_at: new Date().toISOString() } : message));
    setEditing(null);
  }

  async function deleteMessage(messageId: string) {
    const supabase = createClient();
    const { error } = await supabase.from("messages").delete().eq("id", messageId).eq("author_id", currentUserId);
    if (error) { setError(error.message); return; }
    setMessages((current) => current.filter((message) => message.id !== messageId));
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const exists = reactions.some((reaction) => reaction.message_id === messageId && reaction.user_id === currentUserId && reaction.emoji === emoji);
    const supabase = createClient();
    if (exists) {
      const { error } = await supabase.from("message_reactions").delete().eq("message_id", messageId).eq("user_id", currentUserId).eq("emoji", emoji);
      if (error) { setError(error.message); return; }
      setReactions((current) => current.filter((reaction) => !(reaction.message_id === messageId && reaction.user_id === currentUserId && reaction.emoji === emoji)));
    } else {
      const row = { message_id: messageId, user_id: currentUserId, emoji };
      const { error } = await supabase.from("message_reactions").insert(row);
      if (error) { setError(error.message); return; }
      setReactions((current) => [...current, row]);
    }
  }

  function reactionGroups(messageId: string) {
    const grouped = new Map<string, { count: number; mine: boolean }>();
    reactions.filter((reaction) => reaction.message_id === messageId).forEach((reaction) => {
      const current = grouped.get(reaction.emoji) ?? { count: 0, mine: false };
      grouped.set(reaction.emoji, { count: current.count + 1, mine: current.mine || reaction.user_id === currentUserId });
    });
    return [...grouped.entries()];
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden pb-2">
        <div className="flex min-h-[240px] flex-col justify-end px-4 pb-5 pt-12">
          <span className="mb-3 flex h-[68px] w-[68px] items-center justify-center rounded-full bg-disc-active text-white"><Hash size={42} strokeWidth={2.5} /></span>
          <h1 className="text-[30px] font-bold leading-tight text-white">Welcome to #{channelName}!</h1>
          <p className="mt-1 text-sm text-disc-muted">This is the start of the #{channelName} channel.</p>
        </div>
        <div className="relative my-5 flex items-center px-4"><span className="h-px flex-1 bg-white/[0.08]" /><span className="px-2 text-[11px] font-semibold text-disc-muted">Recent messages</span><span className="h-px flex-1 bg-white/[0.08]" /></div>
        {messages.map((message) => {
          const profile = profiles[message.author_id] ?? { name: message.author_id.slice(0, 8) };
          const replied = message.reply_to ? byId[message.reply_to] : undefined;
          const repliedProfile = replied ? profiles[replied.author_id] : undefined;
          return (
            <article key={message.id} className="group relative mt-4 flex min-h-11 gap-3 px-4 py-0.5 pr-14 hover:bg-black/[0.06]">
              <Avatar name={profile.name} src={profile.avatar_url} status={profile.status} size={40} />
              <div className="min-w-0 flex-1">
                {replied && <div className="relative mb-1 flex items-center gap-1.5 text-xs text-disc-muted before:absolute before:-left-8 before:bottom-1/2 before:h-3 before:w-6 before:rounded-tl-md before:border-l-2 before:border-t-2 before:border-disc-muted/40"><span className="font-medium text-disc-text">{repliedProfile?.name ?? "Unknown"}</span><span className="truncate">{replied.body}</span></div>}
                <div className="flex items-baseline gap-1.5"><span className="font-semibold text-white">{profile.name}</span>{profile.role && profile.role !== "member" && <span className="rounded bg-disc-brand px-1 py-0.5 text-[9px] font-bold uppercase leading-none text-white">{profile.role}</span>}<time className="text-[11px] text-disc-muted">{timeLabel(message.created_at)}</time>{message.edited_at && <span className="text-[10px] text-disc-muted">(edited)</span>}</div>
                {editing === message.id ? (
                  <div className="mt-1"><input autoFocus value={editBody} onChange={(event) => setEditBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void saveEdit(message.id); if (event.key === "Escape") setEditing(null); }} className="w-full rounded bg-disc-active px-3 py-2 text-sm text-white outline-none ring-1 ring-disc-brand" /><p className="mt-1 text-[10px] text-disc-muted">escape to cancel • enter to save</p></div>
                ) : <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.42] text-disc-text">{message.body}</p>}
                {reactionGroups(message.id).length > 0 && <div className="mt-1 flex flex-wrap gap-1">{reactionGroups(message.id).map(([emoji, detail]) => <button key={emoji} type="button" onClick={() => toggleReaction(message.id, emoji)} className={`flex h-6 items-center gap-1 rounded-md border px-1.5 text-sm ${detail.mine ? "border-disc-brand bg-disc-brand/15" : "border-transparent bg-disc-side hover:border-disc-muted/50"}`}><span>{emoji}</span><span className="text-xs text-disc-muted">{detail.count}</span></button>)}</div>}
              </div>
              <div className="absolute -top-3 right-4 hidden overflow-hidden rounded-md border border-black/30 bg-disc-side shadow-lg group-hover:flex">
                <ActionButton label="Add reaction" onClick={() => toggleReaction(message.id, "👍")}><Smile size={17} /></ActionButton>
                <ActionButton label="Reply" onClick={() => setReplyTo(message)}><MessageCircle size={17} /></ActionButton>
                {message.author_id === currentUserId && <><ActionButton label="Edit" onClick={() => { setEditing(message.id); setEditBody(message.body); }}><Pencil size={16} /></ActionButton><ActionButton label="Delete" danger onClick={() => deleteMessage(message.id)}><Trash2 size={16} /></ActionButton></>}
                <ActionButton label="More"><MoreHorizontal size={17} /></ActionButton>
              </div>
            </article>
          );
        })}
        {messages.length === 0 && <p className="px-4 py-8 text-sm text-disc-muted">It&apos;s quiet here. Be the first to say something.</p>}
        <div ref={bottomRef} />
      </div>

      <div className="relative shrink-0 px-4 pb-5 pt-2">
        {replyTo && <div className="flex h-9 items-center rounded-t-lg bg-[#292b2f] px-3 text-xs text-disc-muted"><span className="flex-1">Replying to <strong className="text-disc-text">{profiles[replyTo.author_id]?.name ?? "message"}</strong></span><button type="button" onClick={() => setReplyTo(null)}><X size={16} /></button></div>}
        {error && <div className="mb-2 flex items-center rounded bg-disc-red/10 px-3 py-2 text-xs text-[#ff9da1]"><span className="flex-1">{error}</span><button type="button" onClick={() => setError(null)}><X size={14} /></button></div>}
        <form onSubmit={(event) => { event.preventDefault(); void send(); }} className={`flex min-h-11 items-start bg-disc-active ${replyTo ? "rounded-b-lg" : "rounded-lg"}`}>
          <ActionButton label="Upload a file" className="ml-1 mt-1.5"><Plus size={22} className="rounded-full bg-disc-muted text-disc-active" /></ActionButton>
          <textarea rows={1} value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={`Message #${channelName}`} maxLength={2000} className="max-h-36 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-[11px] text-[15px] leading-[22px] text-disc-text outline-none placeholder:text-disc-muted" />
          <div className="flex items-center pr-1 pt-1.5"><ActionButton label="Send a gift" className="hidden sm:flex"><Gift size={20} fill="currentColor" /></ActionButton><ActionButton label="Stickers" className="hidden sm:flex"><Sticker size={20} /></ActionButton><div className="relative"><ActionButton label="Emoji" onClick={() => setEmojiOpen((value) => !value)}><Smile size={21} fill="currentColor" /></ActionButton>{emojiOpen && <div className="absolute bottom-10 right-0 z-20 flex gap-1 rounded-lg bg-[#111214] p-2 text-lg shadow-2xl">{["👍", "❤️", "😂", "🔥", "✨"].map((emoji) => <button type="button" key={emoji} onClick={() => { setBody((current) => current + emoji); setEmojiOpen(false); }} className="rounded p-1 hover:bg-disc-active">{emoji}</button>)}</div>}</div>{body.trim() && <ActionButton label="Send" onClick={() => void send()}>{sending ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}</ActionButton>}</div>
        </form>
        <div className="absolute bottom-0 left-4 text-[10px] text-disc-muted"><span className={live ? "text-disc-green" : "text-disc-muted"}>●</span> {live ? "Live" : "Connecting…"}</div>
      </div>
    </div>
  );
}

function ActionButton({ label, children, onClick, danger, className = "" }: { label: string; children: React.ReactNode; onClick?: () => void; danger?: boolean; className?: string }) {
  return <button type="button" title={label} aria-label={label} onClick={onClick} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-disc-muted hover:bg-white/[0.06] ${danger ? "hover:text-disc-red" : "hover:text-white"} ${className}`}>{children}</button>;
}
