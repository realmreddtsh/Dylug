"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Gift, LoaderCircle, MessageCircle, MoreHorizontal, Pencil, Plus, Send, Smile, Sticker, Trash2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Avatar from "@/components/Avatar";

type Msg = { id: string; sender_id: string; body: string; created_at: string; edited_at?: string | null; reply_to?: string | null };
type Reaction = { message_id: string; user_id: string; emoji: string };
type Other = { id: string; username: string; display_name: string; avatar_url: string | null; status: "online" | "idle" | "dnd" | "offline" };

function timeLabel(value: string) {
  return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default function DMChat({ dmId, currentUserId, initial, other, initialReactions = [] }: { dmId: string; currentUserId: string; initial: Msg[]; other: Other; initialReactions?: Reaction[] }) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [reactions, setReactions] = useState<Reaction[]>(initialReactions);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(false);
  const [replyTo, setReplyTo] = useState<Msg | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const otherName = other.display_name || other.username;

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dm:${dmId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "dm_messages", filter: `dm_id=eq.${dmId}` }, (payload) => {
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
      .on("postgres_changes", { event: "*", schema: "public", table: "dm_message_reactions" }, (payload) => {
        const row = (payload.eventType === "DELETE" ? payload.old : payload.new) as Reaction;
        if (!row.message_id) return;
        if (payload.eventType === "INSERT") setReactions((current) => current.some((reaction) => reaction.message_id === row.message_id && reaction.user_id === row.user_id && reaction.emoji === row.emoji) ? current : [...current, row]);
        if (payload.eventType === "DELETE") setReactions((current) => current.filter((reaction) => !(reaction.message_id === row.message_id && reaction.user_id === row.user_id && reaction.emoji === row.emoji)));
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => { setLive(false); void supabase.removeChannel(channel); };
  }, [dmId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);
  const byId = useMemo(() => Object.fromEntries(messages.map((message) => [message.id, message])), [messages]);

  function senderName(senderId: string) { return senderId === currentUserId ? "You" : otherName; }

  async function send() {
    const text = body.trim();
    if (!text || sending) return;
    setError(null);
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase.from("dm_messages").insert({ dm_id: dmId, sender_id: currentUserId, body: text.slice(0, 2000), reply_to: replyTo?.id ?? null }).select("id,sender_id,body,created_at,edited_at,reply_to").single();
    setSending(false);
    if (error) { setError(error.message); return; }
    setBody("");
    setReplyTo(null);
    if (data) setMessages((current) => current.some((message) => message.id === data.id) ? current : [...current, data as Msg]);
  }

  async function saveEdit(messageId: string) {
    const text = editBody.trim();
    if (!text) return;
    const editedAt = new Date().toISOString();
    const { error } = await createClient().from("dm_messages").update({ body: text.slice(0, 2000), edited_at: editedAt }).eq("id", messageId).eq("sender_id", currentUserId);
    if (error) { setError(error.message); return; }
    setMessages((current) => current.map((message) => message.id === messageId ? { ...message, body: text, edited_at: editedAt } : message));
    setEditing(null);
  }

  async function remove(messageId: string) {
    const { error } = await createClient().from("dm_messages").delete().eq("id", messageId).eq("sender_id", currentUserId);
    if (error) { setError(error.message); return; }
    setMessages((current) => current.filter((message) => message.id !== messageId));
  }

  async function react(messageId: string, emoji: string) {
    const exists = reactions.some((reaction) => reaction.message_id === messageId && reaction.user_id === currentUserId && reaction.emoji === emoji);
    const supabase = createClient();
    if (exists) {
      const { error } = await supabase.from("dm_message_reactions").delete().eq("message_id", messageId).eq("user_id", currentUserId).eq("emoji", emoji);
      if (error) { setError(error.message); return; }
      setReactions((current) => current.filter((reaction) => !(reaction.message_id === messageId && reaction.user_id === currentUserId && reaction.emoji === emoji)));
    } else {
      const row = { message_id: messageId, user_id: currentUserId, emoji };
      const { error } = await supabase.from("dm_message_reactions").insert(row);
      if (error) { setError(error.message); return; }
      setReactions((current) => [...current, row]);
    }
  }

  function grouped(messageId: string) {
    const map = new Map<string, { count: number; mine: boolean }>();
    reactions.filter((reaction) => reaction.message_id === messageId).forEach((reaction) => { const item = map.get(reaction.emoji) ?? { count: 0, mine: false }; map.set(reaction.emoji, { count: item.count + 1, mine: item.mine || reaction.user_id === currentUserId }); });
    return [...map.entries()];
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        <div className="px-4 pb-5 pt-14"><Avatar name={otherName} src={other.avatar_url} status={other.status} size={80} /><h1 className="mt-3 text-3xl font-bold text-white">{otherName}</h1><p className="mt-1 text-sm text-disc-muted">{other.username}</p><p className="mt-3 text-sm text-disc-text">This is the beginning of your direct message history with <strong>{otherName}</strong>.</p></div>
        <div className="relative my-5 flex items-center px-4"><span className="h-px flex-1 bg-white/[0.08]" /><span className="px-2 text-[11px] font-semibold text-disc-muted">Recent messages</span><span className="h-px flex-1 bg-white/[0.08]" /></div>
        {messages.map((message) => {
          const mine = message.sender_id === currentUserId;
          const name = senderName(message.sender_id);
          const replied = message.reply_to ? byId[message.reply_to] : undefined;
          return (
            <article key={message.id} className="group relative mt-4 flex min-h-11 gap-3 px-4 py-0.5 pr-14 hover:bg-black/[0.06]">
              <Avatar name={name} src={mine ? undefined : other.avatar_url} status={mine ? "online" : other.status} size={40} />
              <div className="min-w-0 flex-1">
                {replied && <div className="relative mb-1 flex items-center gap-1.5 text-xs text-disc-muted before:absolute before:-left-8 before:bottom-1/2 before:h-3 before:w-6 before:rounded-tl-md before:border-l-2 before:border-t-2 before:border-disc-muted/40"><strong className="text-disc-text">{senderName(replied.sender_id)}</strong><span className="truncate">{replied.body}</span></div>}
                <div className="flex items-baseline gap-1.5"><strong className="text-[15px] text-white">{name}</strong><time className="text-[11px] text-disc-muted">{timeLabel(message.created_at)}</time>{message.edited_at && <span className="text-[10px] text-disc-muted">(edited)</span>}</div>
                {editing === message.id ? <div className="mt-1"><input autoFocus value={editBody} onChange={(event) => setEditBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void saveEdit(message.id); if (event.key === "Escape") setEditing(null); }} className="w-full rounded bg-disc-active px-3 py-2 text-sm text-white outline-none ring-1 ring-disc-brand" /><p className="mt-1 text-[10px] text-disc-muted">escape to cancel • enter to save</p></div> : <p className="whitespace-pre-wrap break-words text-[15px] leading-[1.42] text-disc-text">{message.body}</p>}
                {grouped(message.id).length > 0 && <div className="mt-1 flex gap-1">{grouped(message.id).map(([emoji, detail]) => <button type="button" key={emoji} onClick={() => react(message.id, emoji)} className={`flex h-6 items-center gap-1 rounded-md border px-1.5 ${detail.mine ? "border-disc-brand bg-disc-brand/15" : "border-transparent bg-disc-side"}`}><span>{emoji}</span><span className="text-xs text-disc-muted">{detail.count}</span></button>)}</div>}
              </div>
              <div className="absolute -top-3 right-4 hidden overflow-hidden rounded-md border border-black/30 bg-disc-side shadow-lg group-hover:flex"><SmallButton label="React" onClick={() => react(message.id, "👍")}><Smile size={17} /></SmallButton><SmallButton label="Reply" onClick={() => setReplyTo(message)}><MessageCircle size={17} /></SmallButton>{mine && <><SmallButton label="Edit" onClick={() => { setEditing(message.id); setEditBody(message.body); }}><Pencil size={16} /></SmallButton><SmallButton label="Delete" danger onClick={() => remove(message.id)}><Trash2 size={16} /></SmallButton></>}<SmallButton label="More"><MoreHorizontal size={17} /></SmallButton></div>
            </article>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="relative shrink-0 px-4 pb-5 pt-2">
        {replyTo && <div className="flex h-9 items-center rounded-t-lg bg-[#292b2f] px-3 text-xs text-disc-muted"><span className="flex-1">Replying to <strong className="text-disc-text">{senderName(replyTo.sender_id)}</strong></span><button type="button" onClick={() => setReplyTo(null)}><X size={16} /></button></div>}
        {error && <div className="mb-2 flex items-center rounded bg-disc-red/10 px-3 py-2 text-xs text-[#ff9da1]"><span className="flex-1">{error}</span><button type="button" onClick={() => setError(null)}><X size={14} /></button></div>}
        <form onSubmit={(event) => { event.preventDefault(); void send(); }} className={`flex min-h-11 items-start bg-disc-active ${replyTo ? "rounded-b-lg" : "rounded-lg"}`}><SmallButton label="Add attachment" className="ml-1 mt-1.5"><Plus size={22} className="rounded-full bg-disc-muted text-disc-active" /></SmallButton><textarea rows={1} value={body} onChange={(event) => setBody(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder={`Message @${other.username}`} maxLength={2000} className="max-h-36 min-h-11 min-w-0 flex-1 resize-none bg-transparent px-2 py-[11px] text-[15px] leading-[22px] text-disc-text outline-none placeholder:text-disc-muted" /><div className="flex items-center pr-1 pt-1.5"><SmallButton label="Gift" className="hidden sm:flex"><Gift size={20} /></SmallButton><SmallButton label="Sticker" className="hidden sm:flex"><Sticker size={20} /></SmallButton><SmallButton label="Emoji" onClick={() => setBody((value) => value + "✨")}><Smile size={21} /></SmallButton>{body.trim() && <SmallButton label="Send" onClick={() => void send()}>{sending ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}</SmallButton>}</div></form>
        <div className="absolute bottom-0 left-4 text-[10px] text-disc-muted"><span className={live ? "text-disc-green" : "text-disc-muted"}>●</span> {live ? "Live" : "Connecting…"}</div>
      </div>
    </div>
  );
}

function SmallButton({ label, children, onClick, danger, className = "" }: { label: string; children: React.ReactNode; onClick?: () => void; danger?: boolean; className?: string }) {
  return <button type="button" onClick={onClick} title={label} aria-label={label} className={`flex h-8 w-8 shrink-0 items-center justify-center rounded text-disc-muted hover:bg-white/[0.06] ${danger ? "hover:text-disc-red" : "hover:text-white"} ${className}`}>{children}</button>;
}
