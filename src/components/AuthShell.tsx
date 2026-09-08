import Link from "next/link";
import type { ReactNode } from "react";
import { Check, Hash, MessageCircle, ShieldCheck, Sparkles, Users } from "lucide-react";
import Avatar from "@/components/Avatar";
import BrandMark from "@/components/BrandMark";

export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="auth-grid relative flex min-h-[100dvh] w-full overflow-y-auto p-4 sm:p-8">
      <Link href="/" className="absolute left-5 top-5 z-10 flex items-center gap-2 text-lg font-bold text-white sm:left-8 sm:top-7">
        <BrandMark size="sm" /> Dylug
      </Link>
      <div className="relative m-auto grid w-full max-w-[980px] overflow-hidden rounded-2xl border border-white/[0.07] bg-disc-side shadow-2xl shadow-black/50 lg:grid-cols-[1fr_0.82fr]">
        <section className="p-6 pt-8 sm:p-10 lg:p-12">
          <div className="mx-auto max-w-md">
            <h1 className="text-center text-2xl font-bold text-white">{title}</h1>
            <p className="mt-2 text-center text-sm text-disc-muted">{subtitle}</p>
            {children}
          </div>
        </section>
        <aside className="relative hidden min-h-[620px] overflow-hidden border-l border-white/[0.06] bg-[#23253c] p-10 lg:flex lg:flex-col">
          <div className="absolute -right-24 -top-20 h-80 w-80 rounded-full bg-disc-brand/30 blur-3xl" />
          <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl" />
          <span className="relative inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-indigo-200"><Sparkles size={13} /> Made for your people</span>
          <h2 className="relative mt-6 text-3xl font-black leading-tight tracking-tight text-white">Your community is already here.</h2>
          <p className="relative mt-3 text-sm leading-6 text-white/55">Jump into focused channels, instant messages, and conversations that keep moving with you.</p>

          <div className="relative mt-8 rounded-xl border border-white/[0.08] bg-disc-chat/95 p-3 shadow-2xl">
            <div className="mb-3 flex items-center gap-2 border-b border-white/[0.06] pb-3 text-xs text-white"><Hash size={16} className="text-disc-muted" /><strong>general</strong><span className="ml-auto flex items-center gap-1 text-[10px] text-disc-green"><span className="h-1.5 w-1.5 rounded-full bg-disc-green" /> 8 online</span></div>
            {[{ name: "Maya Chen", text: "The new space looks amazing! ✨", status: "online" as const }, { name: "Juno Park", text: "So glad everyone is here 👋", status: "online" as const }].map((message) => (
              <div className="flex gap-2.5 py-2" key={message.name}><Avatar name={message.name} status={message.status} size={31} /><span className="min-w-0"><strong className="block text-[11px] text-white">{message.name}</strong><span className="block truncate text-[10px] text-disc-muted">{message.text}</span></span></div>
            ))}
            <div className="mt-2 flex h-8 items-center rounded bg-disc-active px-2 text-[10px] text-disc-muted">Message #general <MessageCircle size={13} className="ml-auto" /></div>
          </div>

          <div className="relative mt-auto grid grid-cols-2 gap-2 text-xs text-white/65">
            <span className="flex items-center gap-1.5"><Check size={14} className="text-disc-green" /> Realtime chat</span>
            <span className="flex items-center gap-1.5"><Users size={14} className="text-disc-green" /> Private spaces</span>
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-disc-green" /> Secure by default</span>
            <span className="flex items-center gap-1.5"><Hash size={14} className="text-disc-green" /> Organized channels</span>
          </div>
        </aside>
      </div>
    </main>
  );
}
