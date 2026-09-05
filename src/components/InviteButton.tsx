"use client";

import { useState } from "react";
import { createInvite } from "@/app/guilds/actions";

export default function InviteButton({ guildId }: { guildId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function make() {
    setError(null);
    try {
      const c = await createInvite(guildId);
      setCode(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create invite");
    }
  }

  return (
    <div>
      <button
        onClick={make}
        className="w-full rounded-md bg-disc-side px-3 py-1.5 text-left text-sm text-disc-muted hover:bg-disc-hover hover:text-disc-text"
      >
        + Invite people
      </button>
      {code && (
        <p className="mt-1 rounded bg-disc-rail p-2 text-xs text-disc-text">
          Code: <span className="font-mono font-bold">{code}</span>
        </p>
      )}
      {error && <p className="mt-1 text-xs text-disc-red">{error}</p>}
    </div>
  );
}
