"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import OAuthButtons from "@/components/OAuthButtons";
import AuthShell from "@/components/AuthShell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase is not connected in this preview. Open the live demo instead.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    if (data.user) {
      await supabase.from("profiles").update({ status: "online" }).eq("id", data.user.id);
    }
    const requested = new URLSearchParams(window.location.search).get("next");
    const destination = requested?.startsWith("/") && !requested.startsWith("//")
      ? requested
      : "/friends";
    router.push(destination);
    router.refresh();
  }

  return (
    <AuthShell title="Welcome back!" subtitle="We’re so excited to see you again.">
      <div className="mt-7"><OAuthButtons /></div>
      <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-disc-muted"><span className="h-px flex-1 bg-white/[0.08]" />or continue with email<span className="h-px flex-1 bg-white/[0.08]" /></div>
      <form onSubmit={onSubmit} className="text-left">
        <label className="block text-[11px] font-bold uppercase tracking-wide text-disc-muted">
          Email <span className="text-disc-red">*</span>
          <span className="relative mt-2 block">
            <Mail size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-disc-muted" />
            <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-11 w-full rounded-md border border-transparent bg-disc-rail pl-10 pr-3 text-sm font-normal normal-case text-disc-text outline-none transition placeholder:text-disc-muted/60 focus:border-disc-brand" />
          </span>
        </label>
        <label className="mt-5 block text-[11px] font-bold uppercase tracking-wide text-disc-muted">
          Password <span className="text-disc-red">*</span>
          <span className="relative mt-2 block">
            <LockKeyhole size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-disc-muted" />
            <input type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" className="h-11 w-full rounded-md border border-transparent bg-disc-rail pl-10 pr-11 text-sm font-normal normal-case text-disc-text outline-none transition placeholder:text-disc-muted/60 focus:border-disc-brand" />
            <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-disc-muted hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
          </span>
        </label>
        <button type="button" className="mt-2 text-xs font-medium text-[#00a8fc] hover:underline">Forgot your password?</button>
        {error && <p role="alert" className="mt-3 rounded-md border border-disc-red/20 bg-disc-red/10 px-3 py-2.5 text-xs leading-5 text-[#ff9da1]">{error}</p>}
        <button type="submit" disabled={loading} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-disc-brand px-3 text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:opacity-50">
          {loading ? <><LoaderCircle size={18} className="animate-spin" /> Logging in…</> : <>Log In <ArrowRight size={17} /></>}
        </button>
      </form>
      <p className="mt-4 text-sm text-disc-muted">Need an account? <Link href="/register" className="font-medium text-[#00a8fc] hover:underline">Register</Link></p>
      <Link href="/demo" className="mt-5 flex h-10 w-full items-center justify-center rounded-md border border-white/[0.08] text-sm font-medium text-disc-text transition hover:bg-white/[0.05]">Explore the live demo</Link>
    </AuthShell>
  );
}
