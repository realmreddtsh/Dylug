"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Msg = {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function DMChat({
  dmId,
  currentUserId,
  initial,
  otherName,
}: {
  dmId: string;
  currentUserId: string;
  initial: Msg[];
  otherName: string;
}) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [live, setLive] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dm:${dmId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "dm_messages",
          filter: `dm_id=eq.${dmId}`,
        },
        (payload) => {
          const row = payload.new as Msg;
          setMessages((prev) =>
            prev.some((m) => m.id === row.id) ? prev : [...prev, row]
          );
        }
      )
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      setLive(false);
      supabase.removeChannel(channel);
    };
  }, [dmId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function label(senderId: string) {
    return senderId === currentUserId ? "You" : otherName;
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;
    setError(null);
    setSending(true);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("dm_messages")
      .insert({
        dm_id: dmId,
        sender_id: currentUserId,
        body: text.slice(0, 2000),
      })
      .select("id,sender_id,body,created_at")
      .single();
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setBody("");
    if (data) {
      setMessages((prev) =>
        prev.some((m) => m.id === data.id)
          ? prev
          : [...prev, data as Msg]
      );
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ul className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3">
        {messages.map((m) => (
          <li key={m.id} className="group flex gap-3 hover:bg-disc-hover/40">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-disc-brand text-sm font-bold text-white">
              {label(m.sender_id).slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm">
                <span className="font-medium text-disc-text">
                  {label(m.sender_id)}
                </span>{" "}
                <span className="text-xs text-disc-muted">
                  {new Date(m.created_at).toLocaleString()}
                </span>
              </p>
              <p className="break-words text-[15px] text-disc-text">{m.body}</p>
            </div>
          </li>
        ))}
        {messages.length === 0 && (
          <li className="text-sm text-disc-muted">
            This is the beginning of your conversation.
          </li>
        )}
        <div ref={bottomRef} />
      </ul>
      <div className="flex items-center justify-between px-4 text-xs text-disc-muted">
        <span>{live ? "● live" : "○ connecting..."}</span>
        {error && <span className="text-disc-red">{error}</span>}
      </div>
      <form onSubmit={send} className="p-4 pt-1">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder={`Message @${otherName}`}
          maxLength={2000}
          className="w-full rounded-lg bg-disc-active px-4 py-2.5 text-disc-text outline-none placeholder:text-disc-muted"
        />
      </form>
    </div>
  );
}
