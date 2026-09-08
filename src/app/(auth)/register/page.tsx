"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, AtSign, CheckCircle2, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import OAuthButtons from "@/components/OAuthButtons";
import AuthShell from "@/components/AuthShell";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!isSupabaseConfigured()) {
      setError("Supabase is not connected in this preview. You can still explore the live demo.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: { username, display_name: username },
      },
    });
    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }
    if (data.user && data.session) {
      await supabase.from("profiles").update({ username, display_name: username }).eq("id", data.user.id);
      setLoading(false);
      router.push("/friends");
      router.refresh();
      return;
    }
    setLoading(false);
    setConfirmationSent(true);
  }

  if (confirmationSent) {
    return (
      <AuthShell title="Check your inbox" subtitle="One last step, then your community is waiting.">
        <div className="mx-auto mt-9 flex h-20 w-20 items-center justify-center rounded-full bg-disc-green/15 text-disc-green"><Mail size={36} /></div>
        <p className="mx-auto mt-6 max-w-sm text-center text-sm leading-6 text-disc-muted">We sent a confirmation link to <strong className="text-white">{email}</strong>. Click it to activate your Dylug account.</p>
        <button type="button" onClick={() => setConfirmationSent(false)} className="mt-7 h-11 w-full rounded-md bg-disc-brand text-sm font-semibold text-white hover:bg-[#4752c4]">Use a different email</button>
        <Link href="/login" className="mt-4 block text-center text-sm text-[#00a8fc] hover:underline">Back to log in</Link>
      </AuthShell>
    );
  }

  const validUsername = /^[a-zA-Z0-9_]{3,32}$/.test(username);

  return (
    <AuthShell title="Create an account" subtitle="Join the conversation. It only takes a minute.">
      <div className="mt-7"><OAuthButtons /></div>
      <div className="my-5 flex items-center gap-3 text-[10px] font-semibold uppercase tracking-wider text-disc-muted"><span className="h-px flex-1 bg-white/[0.08]" />or continue with email<span className="h-px flex-1 bg-white/[0.08]" /></div>
      <form onSubmit={onSubmit} className="text-left">
        <label className="block text-[11px] font-bold uppercase tracking-wide text-disc-muted">
          Username <span className="text-disc-red">*</span>
          <span className="relative mt-2 block">
            <AtSign size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-disc-muted" />
            <input autoComplete="username" required pattern="[a-zA-Z0-9_]{3,32}" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="How friends will find you" className="h-11 w-full rounded-md border border-transparent bg-disc-rail pl-10 pr-10 text-sm font-normal normal-case text-disc-text outline-none transition placeholder:text-disc-muted/60 focus:border-disc-brand" />
            {validUsername && <CheckCircle2 size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-disc-green" />}
          </span>
          {username && !validUsername && <span className="mt-1.5 block text-[10px] font-normal normal-case text-disc-muted">3–32 letters, numbers, or underscores.</span>}
        </label>
        <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-disc-muted">
          Email <span className="text-disc-red">*</span>
          <span className="relative mt-2 block"><Mail size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-disc-muted" /><input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="h-11 w-full rounded-md border border-transparent bg-disc-rail pl-10 pr-3 text-sm font-normal normal-case text-disc-text outline-none transition placeholder:text-disc-muted/60 focus:border-disc-brand" /></span>
        </label>
        <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-disc-muted">
          Password <span className="text-disc-red">*</span>
          <span className="relative mt-2 block"><LockKeyhole size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-disc-muted" /><input type={showPassword ? "text" : "password"} autoComplete="new-password" required minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" className="h-11 w-full rounded-md border border-transparent bg-disc-rail pl-10 pr-11 text-sm font-normal normal-case text-disc-text outline-none transition placeholder:text-disc-muted/60 focus:border-disc-brand" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-disc-muted hover:text-white" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></span>
        </label>
        {error && <p role="alert" className="mt-3 rounded-md border border-disc-red/20 bg-disc-red/10 px-3 py-2.5 text-xs leading-5 text-[#ff9da1]">{error}</p>}
        <button type="submit" disabled={loading || !validUsername} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-disc-brand px-3 text-sm font-semibold text-white transition hover:bg-[#4752c4] disabled:opacity-50">{loading ? <><LoaderCircle size={18} className="animate-spin" /> Creating account…</> : <>Continue <ArrowRight size={17} /></>}</button>
      </form>
      <p className="mt-3 text-[11px] leading-5 text-disc-muted">By registering, you agree to Dylug&apos;s <button className="text-[#00a8fc] hover:underline">Terms of Service</button> and <button className="text-[#00a8fc] hover:underline">Privacy Policy</button>.</p>
      <p className="mt-3 text-sm text-disc-muted"><Link href="/login" className="font-medium text-[#00a8fc] hover:underline">Already have an account?</Link></p>
    </AuthShell>
  );
}
