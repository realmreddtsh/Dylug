"use client";

import { useState, type ReactNode } from "react";
import { Gamepad2, Github, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

type Provider = "github" | "google" | "discord";

const PROVIDERS: Array<{ id: Provider; label: string; icon: ReactNode }> = [
  { id: "github", label: "GitHub", icon: <Github size={18} /> },
  { id: "google", label: "Google", icon: <GoogleIcon /> },
  { id: "discord", label: "Discord", icon: <Gamepad2 size={19} /> },
];

export default function OAuthButtons() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<Provider | null>(null);

  async function signIn(provider: Provider) {
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Connect Supabase to enable account sign-in, or use the live demo.");
      return;
    }

    setPending(provider);
    const supabase = createClient();
    const requested = new URLSearchParams(window.location.search).get("next");
    const next = requested?.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/friends";
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
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
        {PROVIDERS.map((provider) => (
          <button
            key={provider.id}
            type="button"
            onClick={() => signIn(provider.id)}
            disabled={pending !== null}
            className="flex h-10 items-center justify-center gap-2 rounded-md border border-white/[0.06] bg-disc-active px-2 text-sm font-medium text-disc-text transition hover:border-white/[0.12] hover:bg-disc-hover hover:text-white disabled:opacity-50"
          >
            {pending === provider.id ? <LoaderCircle size={17} className="animate-spin" /> : provider.icon}
            <span className="hidden sm:inline">{provider.label}</span>
          </button>
        ))}
      </div>
      {error && <p className="mt-2 rounded bg-disc-red/10 px-3 py-2 text-xs text-[#ff9da1]">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.32 2.98-7.41Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.43l-3.24-2.54c-.9.6-2.05.97-3.39.97-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.39 13.87A6.03 6.03 0 0 1 6.07 12c0-.65.11-1.28.32-1.87V7.51H3.04A10 10 0 0 0 2 12c0 1.61.39 3.14 1.04 4.49l3.35-2.62Z" />
      <path fill="#EA4335" d="M12 6c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.51l3.35 2.62C7.18 7.76 9.39 6 12 6Z" />
    </svg>
  );
}
