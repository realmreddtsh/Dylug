"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Provider = "github" | "google" | "discord";

const LABELS: Record<Provider, string> = {
  github: "GitHub",
  google: "Google",
  discord: "Discord",
};

export default function OAuthButtons() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Provider | null>(null);

  async function signIn(provider: Provider) {
    setError(null);
    setPending(provider);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setPending(null);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {(Object.keys(LABELS) as Provider[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => signIn(p)}
            disabled={pending !== null}
            className="rounded bg-disc-active px-3 py-2 text-sm font-medium text-disc-text hover:bg-disc-hover disabled:opacity-50"
          >
            {pending === p ? "..." : LABELS[p]}
          </button>
        ))}
      </div>
      {error && <p className="mt-2 text-sm text-disc-red">{error}</p>}
    </div>
  );
}
