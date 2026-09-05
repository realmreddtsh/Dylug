"use client";

import { useState } from "react";
import {
  acceptFriendRequest,
  declineFriendRequest,
  removeFriend,
  sendFriendRequest,
} from "@/app/friends/actions";
import { getOrCreateDM } from "@/app/dms/actions";

type Person = {
  id: string;
  username?: string;
  display_name?: string;
};

type Tab = "all" | "pending" | "add";

export default function FriendsClient({
  friends,
  incoming,
  outgoing,
}: {
  friends: Person[];
  incoming: Person[];
  outgoing: Person[];
}) {
  const [tab, setTab] = useState<Tab>("all");
  const pendingCount = incoming.length + outgoing.length;

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "all", label: "All" },
    { id: "pending", label: "Pending", badge: pendingCount },
    { id: "add", label: "Add Friend" },
  ];

  function row(p: Person, actions: React.ReactNode, sub?: string) {
    return (
      <li
        key={p.id}
        className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-disc-hover/60"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-disc-brand text-sm font-bold text-white">
          {(p.username ?? "?").slice(0, 1).toUpperCase()}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-disc-text">
            {p.display_name && p.display_name !== p.username
              ? p.display_name
              : `@${p.username ?? p.id.slice(0, 8)}`}
          </span>
          <span className="block truncate text-xs text-disc-muted">
            {sub ?? `@${p.username ?? p.id.slice(0, 8)}`}
          </span>
        </span>
        <span className="flex gap-2">{actions}</span>
      </li>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-disc-chat">
      {/* Tab bar */}
      <div className="flex items-center gap-1 border-b border-disc-rail px-4 py-2.5">
        <span className="mr-2 font-bold text-disc-text">Friends</span>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded px-2.5 py-1 text-sm font-medium ${
              tab === t.id
                ? t.id === "add"
                  ? "bg-disc-green text-white"
                  : "bg-disc-active text-white"
                : "text-disc-muted hover:bg-disc-hover hover:text-disc-text"
            }`}
          >
            {t.label}
            {t.badge ? (
              <span className="ml-1.5 rounded-full bg-disc-red px-1.5 text-xs text-white">
                {t.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === "add" && (
          <div className="max-w-xl">
            <h2 className="font-bold text-disc-text">ADD FRIEND</h2>
            <p className="mt-1 text-sm text-disc-muted">
              Add a friend with their Dylug username.
            </p>
            <form
              action={sendFriendRequest}
              className="mt-3 flex gap-2 rounded-lg bg-disc-rail p-2"
            >
              <input
                name="username"
                required
                placeholder="username"
                className="flex-1 rounded bg-disc-rail px-3 py-2 text-disc-text outline-none placeholder:text-disc-muted"
              />
              <button
                type="submit"
                className="rounded bg-disc-brand px-4 py-2 text-sm font-medium text-white hover:brightness-110"
              >
                Send Request
              </button>
            </form>
          </div>
        )}

        {tab === "all" && (
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase text-disc-muted">
              All friends — {friends.length}
            </p>
            <ul className="mt-2 divide-y divide-disc-rail/60">
              {friends.map((p) =>
                row(
                  p,
                  <>
                    <button
                      onClick={() => getOrCreateDM(p.id)}
                      title="Message"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-disc-side text-disc-muted hover:text-disc-text"
                    >
                      ✉
                    </button>
                    <button
                      onClick={() => removeFriend(p.id)}
                      title="Remove"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-disc-side text-disc-muted hover:text-disc-red"
                    >
                      ✕
                    </button>
                  </>
                )
              )}
            </ul>
            {friends.length === 0 && (
              <p className="mt-4 text-sm text-disc-muted">
                No friends yet — add one with the Add Friend tab.
              </p>
            )}
          </div>
        )}

        {tab === "pending" && (
          <div className="max-w-3xl space-y-6">
            <div>
              <p className="text-xs font-semibold uppercase text-disc-muted">
                Incoming — {incoming.length}
              </p>
              <ul className="mt-2 divide-y divide-disc-rail/60">
                {incoming.map((p) =>
                  row(
                    p,
                    <>
                      <button
                        onClick={() => acceptFriendRequest(p.id)}
                        className="rounded bg-disc-green px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => declineFriendRequest(p.id)}
                        className="rounded bg-disc-side px-3 py-1.5 text-sm text-disc-text hover:bg-disc-hover"
                      >
                        Ignore
                      </button>
                    </>,
                    "Incoming friend request"
                  )
                )}
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-disc-muted">
                Outgoing — {outgoing.length}
              </p>
              <ul className="mt-2 divide-y divide-disc-rail/60">
                {outgoing.map((p) =>
                  row(
                    p,
                    <button
                      onClick={() => removeFriend(p.id)}
                      className="rounded bg-disc-side px-3 py-1.5 text-sm text-disc-text hover:bg-disc-hover"
                    >
                      Cancel
                    </button>,
                    "Outgoing friend request"
                  )
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
