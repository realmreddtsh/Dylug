"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, CircleHelp, Inbox, MessageCircle, MoreHorizontal, Search, UserPlus, Users, X } from "lucide-react";
import { acceptFriendRequest, declineFriendRequest, removeFriend, sendFriendRequest } from "@/app/friends/actions";
import { getOrCreateDM } from "@/app/dms/actions";
import Avatar from "@/components/Avatar";

type Person = {
  id: string;
  username?: string;
  display_name?: string;
  avatar_url?: string | null;
  status?: "online" | "idle" | "dnd" | "offline";
};

type Tab = "online" | "all" | "pending" | "add";

function cn(...parts: Array<string | false | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function FriendsClient({ friends, incoming, outgoing }: { friends: Person[]; incoming: Person[]; outgoing: Person[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("online");
  const [search, setSearch] = useState("");
  const [username, setUsername] = useState("");
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();
  const pendingCount = incoming.length + outgoing.length;
  const visibleFriends = friends.filter((person) => {
    const matches = `${person.display_name ?? ""} ${person.username ?? ""}`.toLowerCase().includes(search.toLowerCase());
    return matches && (tab === "all" || person.status !== "offline");
  });

  function run(action: () => Promise<void>, success?: string) {
    setNotice(null);
    startTransition(async () => {
      try {
        await action();
        if (success) setNotice({ kind: "success", text: success });
        router.refresh();
      } catch (error) {
        setNotice({ kind: "error", text: error instanceof Error ? error.message : "Something went wrong" });
      }
    });
  }

  function displayName(person: Person) {
    return person.display_name || person.username || person.id.slice(0, 8);
  }

  return (
    <main className="flex min-h-0 min-w-0 flex-1 flex-col bg-disc-chat">
      <header className="flex h-12 shrink-0 items-center gap-1 border-b border-black/20 px-3 shadow-sm sm:gap-2 sm:px-4">
        <Users size={21} className="text-disc-muted" />
        <strong className="mr-2 hidden text-sm text-white sm:block">Friends</strong>
        <span className="mr-1 hidden h-6 w-px bg-white/[0.08] sm:block" />
        {(["online", "all", "pending", "add"] as Tab[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => { setTab(item); setNotice(null); }}
            className={cn(
              "rounded px-2 py-1 text-sm font-medium capitalize transition sm:px-2.5",
              tab === item
                ? item === "add" ? "bg-disc-green text-white" : "bg-disc-active text-white"
                : item === "add" ? "bg-disc-green text-white hover:brightness-110" : "text-disc-muted hover:bg-disc-hover hover:text-disc-text"
            )}
          >
            {item === "add" ? <span className="whitespace-nowrap">Add Friend</span> : item}
            {item === "pending" && pendingCount > 0 && <span className="ml-1.5 rounded-full bg-disc-red px-1.5 text-[10px] leading-4 text-white">{pendingCount}</span>}
          </button>
        ))}
        <span className="flex-1" />
        <button type="button" title="New Group DM" className="hidden h-8 w-8 items-center justify-center text-disc-muted hover:text-white sm:flex"><MessageCircle size={20} /></button>
        <button type="button" title="Inbox" className="hidden h-8 w-8 items-center justify-center text-disc-muted hover:text-white md:flex"><Inbox size={20} /></button>
        <button type="button" title="Help" className="hidden h-8 w-8 items-center justify-center text-disc-muted hover:text-white md:flex"><CircleHelp size={20} /></button>
      </header>

      {tab === "add" ? (
        <section className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
          <h1 className="text-base font-bold uppercase text-white">Add Friend</h1>
          <p className="mt-2 text-sm text-disc-muted">You can add friends with their Dylug username.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData();
              form.set("username", username);
              run(() => sendFriendRequest(form), `Friend request sent to ${username}`);
              setUsername("");
            }}
            className="mt-5 flex max-w-3xl rounded-lg border border-transparent bg-disc-rail p-2 focus-within:border-disc-brand"
          >
            <input name="username" required value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Enter a username" className="min-w-0 flex-1 bg-transparent px-2 text-sm text-disc-text outline-none placeholder:text-disc-muted" />
            <button type="submit" disabled={!username.trim() || pending} className="rounded bg-disc-brand px-4 py-2 text-sm font-medium text-white transition hover:bg-[#4752c4] disabled:opacity-40">Send Friend Request</button>
          </form>
          {notice && <p className={cn("mt-3 max-w-3xl rounded-md px-3 py-2 text-sm", notice.kind === "success" ? "bg-disc-green/10 text-[#57d792]" : "bg-disc-red/10 text-[#ff9da1]")}>{notice.text}</p>}
          <div className="mx-auto mt-20 max-w-sm text-center"><span className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-disc-side text-disc-brand"><UserPlus size={42} /></span><p className="mt-5 text-sm text-disc-muted">Find your people and start a conversation.</p></div>
        </section>
      ) : tab === "pending" ? (
        <section className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
          {notice && <p className={cn("mb-3 max-w-3xl rounded-md px-3 py-2 text-sm", notice.kind === "success" ? "bg-disc-green/10 text-[#57d792]" : "bg-disc-red/10 text-[#ff9da1]")}>{notice.text}</p>}
          <FriendSection title="Incoming" count={incoming.length}>
            {incoming.map((person) => <PersonRow key={person.id} person={person} subtitle="Incoming Friend Request" actions={<><RoundButton label="Accept" onClick={() => run(() => acceptFriendRequest(person.id), `${displayName(person)} is now your friend`)} success><Check size={18} /></RoundButton><RoundButton label="Ignore" onClick={() => run(() => declineFriendRequest(person.id))} danger><X size={18} /></RoundButton></>} />)}
          </FriendSection>
          <FriendSection title="Outgoing" count={outgoing.length} className="mt-8">
            {outgoing.map((person) => <PersonRow key={person.id} person={person} subtitle="Outgoing Friend Request" actions={<RoundButton label="Cancel" onClick={() => run(() => removeFriend(person.id))} danger><X size={18} /></RoundButton>} />)}
          </FriendSection>
          {pendingCount === 0 && <EmptyState icon={<Check size={38} />} title="You're all caught up" copy="No pending friend requests right now." />}
        </section>
      ) : (
        <div className="flex min-h-0 flex-1">
          <section className="min-w-0 flex-1 overflow-y-auto p-5 sm:p-8">
            <div className="relative max-w-3xl"><Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-disc-muted" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search" className="h-9 w-full rounded bg-disc-rail px-3 pr-10 text-sm text-disc-text outline-none focus:ring-1 focus:ring-disc-brand" /></div>
            <p className="mt-5 text-xs font-semibold uppercase text-disc-muted">{tab === "online" ? "Online" : "All Friends"} — {visibleFriends.length}</p>
            <div className="mt-2 max-w-3xl">
              {visibleFriends.map((person) => (
                <PersonRow
                  key={person.id}
                  person={person}
                  subtitle={person.status === "online" ? "Online" : person.status === "idle" ? "Idle" : person.status === "dnd" ? "Do Not Disturb" : "Offline"}
                  actions={<><form action={getOrCreateDM.bind(null, person.id)}><RoundButton label="Message" submit><MessageCircle size={18} fill="currentColor" /></RoundButton></form><RoundButton label="More" onClick={() => undefined}><MoreHorizontal size={19} /></RoundButton></>}
                />
              ))}
              {visibleFriends.length === 0 && <EmptyState icon={<Users size={38} />} title={search ? "No friends found" : tab === "online" ? "No one is around right now" : "Your friends will appear here"} copy={search ? "Try a different name or username." : "Add a friend to start chatting."} />}
            </div>
          </section>
          <aside className="hidden w-[330px] shrink-0 border-l border-white/[0.06] p-5 2xl:block"><h2 className="text-lg font-bold text-white">Active Now</h2>{friends.filter((person) => person.status === "online").slice(0, 2).map((person) => <div key={person.id} className="mt-4 rounded-lg bg-disc-side p-4"><div className="flex items-center gap-2.5"><Avatar name={displayName(person)} src={person.avatar_url} status={person.status} size={36} /><span className="min-w-0"><strong className="block truncate text-sm text-white">{displayName(person)}</strong><span className="text-xs text-disc-muted">Hanging out</span></span></div><div className="mt-3 rounded-md bg-disc-rail p-3"><p className="text-sm font-semibold text-white">In a voice channel</p><p className="mt-1 text-xs text-disc-muted">The Nook • Lounge</p></div></div>)}{friends.length === 0 && <div className="mt-20 text-center"><strong className="text-sm text-white">It&apos;s quiet for now...</strong><p className="mt-1 text-xs leading-5 text-disc-muted">When a friend starts an activity, it will show up here.</p></div>}</aside>
        </div>
      )}
    </main>
  );
}

function FriendSection({ title, count, children, className }: { title: string; count: number; children: React.ReactNode; className?: string }) {
  return <div className={className}><p className="text-xs font-semibold uppercase text-disc-muted">{title} — {count}</p><div className="mt-2 max-w-3xl">{children}</div></div>;
}

function PersonRow({ person, subtitle, actions }: { person: Person; subtitle: string; actions: React.ReactNode }) {
  const name = person.display_name || person.username || person.id.slice(0, 8);
  return <div className="group flex items-center gap-3 border-t border-white/[0.06] px-2 py-3 hover:rounded-lg hover:bg-disc-hover"><Avatar name={name} src={person.avatar_url} status={person.status ?? "offline"} size={40} /><span className="min-w-0 flex-1"><span className="flex items-center gap-1"><strong className="truncate text-sm text-white">{name}</strong>{person.username && <span className="hidden truncate text-xs text-disc-muted group-hover:inline">{person.username}</span>}</span><span className="block truncate text-xs text-disc-muted">{subtitle}</span></span><span className="flex shrink-0 gap-2">{actions}</span></div>;
}

function RoundButton({ label, onClick, children, danger, success, submit }: { label: string; onClick?: () => void; children: React.ReactNode; danger?: boolean; success?: boolean; submit?: boolean }) {
  return <button type={submit ? "submit" : "button"} onClick={onClick} title={label} aria-label={label} className={cn("flex h-9 w-9 items-center justify-center rounded-full bg-disc-side text-disc-muted hover:text-white", danger && "hover:text-disc-red", success && "hover:text-disc-green")}>{children}</button>;
}

function EmptyState({ icon, title, copy }: { icon: React.ReactNode; title: string; copy: string }) {
  return <div className="py-20 text-center"><span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-disc-side text-disc-muted">{icon}</span><h3 className="mt-4 text-sm font-semibold text-white">{title}</h3><p className="mt-1 text-xs text-disc-muted">{copy}</p></div>;
}
