"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Bell, Check, KeyRound, Link2, LogOut, Palette, Save, ShieldCheck, UserRound, X } from "lucide-react";
import Avatar from "@/components/Avatar";
import { updateProfile, type SettingsState } from "@/app/settings/actions";

type Profile = { username: string; display_name: string; avatar_url: string | null; status: "online" | "idle" | "dnd" | "offline" };

export default function SettingsClient({ profile, email }: { profile: Profile; email: string }) {
  const [state, action] = useActionState<SettingsState, FormData>(updateProfile, { ok: false, message: "" });
  const [avatar, setAvatar] = useState(profile.avatar_url ?? "");
  const [displayName, setDisplayName] = useState(profile.display_name);

  return (
    <main className="flex min-h-0 flex-1 bg-disc-chat">
      <aside className="hidden w-[34%] shrink-0 justify-end bg-disc-side py-14 pr-3 md:flex">
        <div className="w-52">
          <p className="px-2.5 pb-1 text-[11px] font-bold uppercase tracking-wide text-disc-muted">User Settings</p>
          <button className="settings-link bg-disc-active text-white"><UserRound size={16} /> My Account</button>
          <button className="settings-link"><Palette size={16} /> Profiles</button>
          <button className="settings-link"><ShieldCheck size={16} /> Privacy & Safety</button>
          <button className="settings-link"><KeyRound size={16} /> Authorized Apps</button>
          <button className="settings-link"><Link2 size={16} /> Connections</button>
          <div className="my-2 h-px bg-white/[0.08]" />
          <p className="px-2.5 pb-1 text-[11px] font-bold uppercase tracking-wide text-disc-muted">App Settings</p>
          <button className="settings-link"><Bell size={16} /> Notifications</button>
          <button className="settings-link"><Palette size={16} /> Appearance</button>
          <div className="my-2 h-px bg-white/[0.08]" />
          <form action="/auth/signout" method="post"><button type="submit" className="settings-link text-disc-red hover:bg-disc-red hover:text-white"><LogOut size={16} /> Log Out</button></form>
        </div>
      </aside>

      <section className="relative min-w-0 flex-1 overflow-y-auto px-5 py-12 sm:px-8 md:px-10 md:py-14">
        <Link href="/friends" className="absolute right-5 top-5 flex flex-col items-center text-disc-muted hover:text-white md:right-10 md:top-10"><span className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-current"><X size={19} /></span><span className="mt-1 text-[9px] font-bold">ESC</span></Link>
        <div className="mx-auto max-w-2xl md:mx-0">
          <h1 className="mb-5 text-xl font-bold text-white">My Account</h1>
          <div className="overflow-hidden rounded-xl bg-disc-rail shadow-xl">
            <div className="h-24 bg-gradient-to-r from-disc-brand via-violet-500 to-fuchsia-500" />
            <div className="relative px-4 pb-5 sm:px-5">
              <Avatar name={displayName || profile.username} src={avatar || null} status={profile.status} size={86} className="-mt-11 rounded-full border-[6px] border-disc-rail" />
              <span className="absolute right-5 top-4 rounded-full bg-disc-green/15 px-3 py-1 text-[11px] font-semibold text-[#57d792]">Profile ready</span>
              <form action={action} className="mt-5 rounded-lg bg-disc-side p-4 sm:p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Display name"><input name="display_name" required maxLength={100} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="settings-input" /></Field>
                  <Field label="Username"><input name="username" required pattern="[a-zA-Z0-9_]{3,32}" defaultValue={profile.username} className="settings-input" /></Field>
                  <Field label="Email"><input disabled value={email} className="settings-input cursor-not-allowed opacity-55" /></Field>
                  <Field label="Presence"><select name="status" defaultValue={profile.status} className="settings-input"><option value="online">Online</option><option value="idle">Idle</option><option value="dnd">Do Not Disturb</option><option value="offline">Invisible</option></select></Field>
                  <div className="sm:col-span-2"><Field label="Avatar URL"><input name="avatar_url" type="url" value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://example.com/avatar.png" className="settings-input" /></Field><p className="mt-1.5 text-[10px] text-disc-muted">Use a direct HTTPS link to an image, or leave blank for a generated avatar.</p></div>
                </div>
                {state.message && <p className={`mt-4 flex items-center gap-2 rounded px-3 py-2 text-xs ${state.ok ? "bg-disc-green/10 text-[#57d792]" : "bg-disc-red/10 text-[#ff9da1]"}`}>{state.ok ? <Check size={14} /> : <X size={14} />}{state.message}</p>}
                <div className="mt-5 flex justify-end"><SaveButton /></div>
              </form>
            </div>
          </div>

          <h2 className="mt-8 text-base font-bold text-white">Password and Authentication</h2>
          <div className="mt-3 rounded-lg border border-white/[0.06] bg-disc-side p-4"><div className="flex items-center"><span className="flex h-10 w-10 items-center justify-center rounded-lg bg-disc-brand/15 text-[#aeb4ff]"><KeyRound size={20} /></span><span className="ml-3 min-w-0 flex-1"><strong className="block text-sm text-white">Password</strong><span className="text-xs text-disc-muted">Keep your account protected with a strong password.</span></span><button className="rounded bg-disc-active px-3 py-2 text-xs font-medium text-white hover:bg-disc-hover">Change</button></div></div>
          <form action="/auth/signout" method="post" className="mt-8 border-t border-white/[0.08] pt-6"><button type="submit" className="rounded border border-disc-red px-4 py-2 text-sm font-medium text-disc-red transition hover:bg-disc-red hover:text-white">Log Out</button></form>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-[10px] font-bold uppercase tracking-wide text-disc-muted">{label}{children}</label>;
}

function SaveButton() {
  const { pending } = useFormStatus();
  return <button type="submit" disabled={pending} className="flex h-10 items-center gap-2 rounded bg-disc-brand px-4 text-sm font-semibold text-white hover:bg-[#4752c4] disabled:opacity-50"><Save size={16} />{pending ? "Saving…" : "Save changes"}</button>;
}
