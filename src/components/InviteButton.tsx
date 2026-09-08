"use client";

import { useState, useTransition } from "react";
import { Check, Copy, LoaderCircle, UserPlus, X } from "lucide-react";
import { createInvite } from "@/app/guilds/actions";

export default function InviteButton({ guildId }: { guildId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function make() {
    setError(null);
    startTransition(async () => {
      try {
        setCode(await createInvite(guildId));
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Could not create invite");
      }
    });
  }

  async function copy() {
    if (!code) return;
    const invite = `${window.location.origin}/invite/${code}`;
    await navigator.clipboard?.writeText(invite);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div>
      <button type="button" onClick={make} disabled={pending} className="flex h-9 w-full items-center gap-2 rounded bg-disc-brand/15 px-2.5 text-left text-sm font-medium text-[#c9cdfb] hover:bg-disc-brand/25">
        {pending ? <LoaderCircle size={17} className="animate-spin" /> : <UserPlus size={17} />} Invite people
      </button>
      {code && <div className="mt-2 flex items-center rounded bg-disc-rail p-1"><span className="min-w-0 flex-1 truncate px-1 font-mono text-[10px] text-disc-text">{code}</span><button type="button" onClick={copy} title="Copy invite" className="flex h-7 w-7 items-center justify-center rounded bg-disc-brand text-white hover:bg-[#4752c4]">{copied ? <Check size={14} /> : <Copy size={14} />}</button></div>}
      {error && <p className="mt-2 flex items-center gap-1 rounded bg-disc-red/10 px-2 py-1.5 text-[10px] text-[#ff9da1]"><X size={12} />{error}</p>}
    </div>
  );
}
