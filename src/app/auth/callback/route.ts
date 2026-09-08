import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
  return base.length >= 3 ? base : `user_${Math.floor(Math.random() * 9000 + 1000)}`;
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const requested = searchParams.get("next");
  const next = requested?.startsWith("/") && !requested.startsWith("//")
    ? requested
    : "/friends";

  if (code && isSupabaseConfigured()) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // First-time OAuth users get a default user_xxxxxxxx name from the trigger.
      // Upgrade it to their provider username when available.
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();
        if (profile?.username?.startsWith("user_")) {
          const meta = user.user_metadata as Record<string, unknown>;
          const raw =
            (meta.preferred_username as string) ??
            (meta.user_name as string) ??
            (meta.name as string) ??
            (meta.full_name as string) ??
            user.email?.split("@")[0] ??
            "";
          if (raw) {
            const username = slugify(String(raw));
            await supabase
              .from("profiles")
              .update({
                username,
                display_name: String(
                  (meta.name as string) ??
                    (meta.full_name as string) ??
                    username
                ).slice(0, 100),
                avatar_url:
                  (meta.avatar_url as string) ??
                  (meta.picture as string) ??
                  null,
              })
              .eq("id", user.id);
          }
        }
        await supabase.from("profiles").update({ status: "online" }).eq("id", user.id);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }
  return NextResponse.redirect(`${origin}/login`);
}
