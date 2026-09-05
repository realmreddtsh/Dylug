"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import OAuthButtons from "@/components/OAuthButtons";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    if (data.user && username) {
      await supabase
        .from("profiles")
        .update({ username, display_name: username })
        .eq("id", data.user.id);
    }
    setLoading(false);
    router.push("/friends");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-disc-rail px-4">
      <div className="w-full max-w-md rounded-xl bg-disc-side p-8 shadow-xl">
        <h1 className="text-center text-2xl font-bold text-white">
          Create an account
        </h1>
        <div className="mt-5">
          <OAuthButtons />
        </div>
        <div className="my-4 flex items-center gap-2 text-xs text-disc-muted">
          <span className="h-px flex-1 bg-disc-rail" />
          or with email
          <span className="h-px flex-1 bg-disc-rail" />
        </div>
        <form onSubmit={onSubmit}>
          <label className="block text-xs font-bold uppercase text-disc-muted">
            Username
            <input
              required
              pattern="[a-zA-Z0-9_]{3,32}"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1.5 w-full rounded bg-disc-rail px-3 py-2.5 text-disc-text outline-none focus:ring-2 focus:ring-disc-brand"
            />
          </label>
          <label className="mt-4 block text-xs font-bold uppercase text-disc-muted">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded bg-disc-rail px-3 py-2.5 text-disc-text outline-none focus:ring-2 focus:ring-disc-brand"
            />
          </label>
          <label className="mt-4 block text-xs font-bold uppercase text-disc-muted">
            Password
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded bg-disc-rail px-3 py-2.5 text-disc-text outline-none focus:ring-2 focus:ring-disc-brand"
            />
          </label>
          {error && <p className="mt-3 text-sm text-disc-red">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-5 w-full rounded bg-disc-brand px-3 py-2.5 font-medium text-white hover:brightness-110 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Continue"}
          </button>
        </form>
        <p className="mt-4 text-sm text-disc-muted">
          <Link href="/login" className="text-disc-brand hover:underline">
            Already have an account?
          </Link>
        </p>
      </div>
    </div>
  );
}
