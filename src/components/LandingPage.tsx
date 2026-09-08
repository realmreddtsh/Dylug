import Link from "next/link";
import { ArrowRight, Check, Hash, Headphones, MessageCircle, Sparkles, Users } from "lucide-react";
import Avatar from "@/components/Avatar";
import BrandMark from "@/components/BrandMark";

export default function LandingPage() {
  return (
    <main className="landing-glow min-h-[100dvh] w-full overflow-y-auto text-white">
      <nav className="mx-auto flex h-20 w-full max-w-7xl items-center px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5 text-xl font-bold tracking-tight">
          <BrandMark size="sm" /> Dylug
        </Link>
        <div className="ml-auto hidden items-center gap-8 text-sm font-medium text-white/70 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <Link href="/demo" className="hover:text-white">Live demo</Link>
          <a href="https://github.com/realmreddtsh/Dylug" className="hover:text-white">GitHub</a>
        </div>
        <Link href="/login" className="ml-5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#171827] shadow-lg transition hover:-translate-y-0.5">Open Dylug</Link>
      </nav>

      <section className="mx-auto grid w-full max-w-7xl items-center gap-14 px-5 pb-20 pt-14 sm:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:pb-28 lg:pt-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-indigo-200"><Sparkles size={14} /> Your people, your place</span>
          <h1 className="mt-7 max-w-xl text-5xl font-black leading-[0.98] tracking-[-0.05em] sm:text-6xl xl:text-7xl">Where every conversation feels like home.</h1>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/65 sm:text-lg">Dylug brings servers, channels, crystal-clear conversations, and your favorite people together in one beautifully simple space.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-disc-brand px-6 py-3.5 font-semibold shadow-xl shadow-indigo-950/30 transition hover:-translate-y-0.5 hover:bg-[#6873f4]">Create an account <ArrowRight size={18} /></Link>
            <Link href="/demo" className="rounded-xl border border-white/10 bg-white/[0.07] px-6 py-3.5 font-semibold backdrop-blur hover:bg-white/[0.12]">Explore the live demo</Link>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs text-white/50"><span className="flex items-center gap-1.5"><Check size={14} className="text-disc-green" /> Free to get started</span><span className="flex items-center gap-1.5"><Check size={14} className="text-disc-green" /> Real-time chat</span><span className="flex items-center gap-1.5"><Check size={14} className="text-disc-green" /> Built for communities</span></div>
        </div>

        <div className="relative">
          <div className="absolute -inset-8 rounded-full bg-disc-brand/20 blur-3xl" />
          <div className="relative flex min-h-[510px] overflow-hidden rounded-2xl border border-white/10 bg-disc-chat shadow-2xl shadow-black/50">
            <div className="hidden w-16 shrink-0 flex-col items-center gap-2 bg-disc-rail py-3 sm:flex"><BrandMark size="md" /><span className="h-0.5 w-7 bg-white/10" />{["N", "DL", "PF", "+"].map((item, index) => <span key={item} className={`flex h-10 w-10 items-center justify-center ${index === 0 ? "rounded-xl bg-disc-brand" : "rounded-full bg-disc-side"} text-xs font-bold text-white`}>{item}</span>)}</div>
            <div className="hidden w-44 shrink-0 bg-disc-side sm:block"><div className="border-b border-black/20 px-4 py-3 text-sm font-bold">The Nook</div><div className="px-2 py-5"><p className="px-2 text-[9px] font-bold uppercase text-disc-muted">Text channels</p>{["welcome", "general", "show-and-tell", "resources"].map((channel, index) => <div key={channel} className={`mt-1 flex items-center gap-1.5 rounded px-2 py-1.5 text-xs ${index === 1 ? "bg-disc-active text-white" : "text-disc-muted"}`}><Hash size={14} /> {channel}</div>)}</div><div className="absolute bottom-0 flex w-44 items-center gap-2 bg-[#232428] p-2"><Avatar name="Alex Rivera" status="online" size={30} /><span><strong className="block text-[10px]">Alex Rivera</strong><span className="block text-[8px] text-disc-muted">alex.r</span></span></div></div>
            <div className="min-w-0 flex-1"><div className="flex h-11 items-center gap-2 border-b border-black/20 px-3 text-xs"><Hash size={17} className="text-disc-muted" /><strong>general</strong><span className="ml-auto flex gap-2 text-disc-muted"><Users size={16} /><MessageCircle size={16} /></span></div><div className="flex h-[455px] flex-col justify-end pb-4"><div className="px-4 pb-4"><span className="flex h-12 w-12 items-center justify-center rounded-full bg-disc-active"><Hash size={28} /></span><h3 className="mt-2 text-xl font-bold">Welcome to #general!</h3><p className="text-[10px] text-disc-muted">This is the start of the #general channel.</p></div>{[{ name: "Maya Chen", text: "Good morning! The new dashboard is ready for review ✨", status: "online" as const }, { name: "Juno Park", text: "Just opened it — the layout feels really clean!", status: "online" as const }, { name: "Theo Brooks", text: "The new empty states are such a nice touch.", status: "idle" as const }].map((message) => <div key={message.name} className="flex gap-2.5 px-4 py-2 hover:bg-black/5"><Avatar name={message.name} status={message.status} size={32} /><span className="min-w-0"><strong className="block text-[11px]">{message.name} <small className="font-normal text-disc-muted">Today at 9:42 AM</small></strong><span className="block truncate text-[10px] text-disc-text">{message.text}</span></span></div>)}<div className="mx-4 mt-3 flex h-9 items-center rounded-md bg-disc-active px-3 text-[10px] text-disc-muted">Message #general <span className="ml-auto">☺</span></div></div></div>
          </div>
        </div>
      </section>

      <section id="features" className="border-t border-white/[0.07] bg-black/10 px-5 py-20 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-5 md:grid-cols-3">
          {[{ icon: <Hash />, title: "Spaces that make sense", copy: "Organize every conversation into focused servers and channels." }, { icon: <MessageCircle />, title: "Always in sync", copy: "Messages arrive instantly with realtime delivery powered by Supabase." }, { icon: <Headphones />, title: "Made for togetherness", copy: "Build a home for friends, teammates, and every community in between." }].map((feature) => <div key={feature.title} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-disc-brand/20 text-indigo-300">{feature.icon}</span><h3 className="mt-5 text-lg font-bold">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-white/55">{feature.copy}</p></div>)}
        </div>
      </section>
    </main>
  );
}
