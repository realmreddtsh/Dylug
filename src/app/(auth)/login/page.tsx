"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import OAuthButtons from "@/components/OAuthButtons";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/friends");
    router.refresh();
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-disc-rail px-4">
      <div className="w-full max-w-md rounded-xl bg-disc-side p-8 shadow-xl">
        <h1 className="text-center text-2xl font-bold text-white">
          Welcome back!
        </h1>
        <p className="mt-1 text-center text-sm text-disc-muted">
          We&apos;re so excited to see you again!
        </p>
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
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
        <p className="mt-4 text-sm text-disc-muted">
          Need an account?{" "}
          <Link href="/register" className="text-disc-brand hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
