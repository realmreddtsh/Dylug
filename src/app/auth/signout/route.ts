import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST(request: Request) {
  const { origin } = new URL(request.url);
  if (!isSupabaseConfigured()) return NextResponse.redirect(`${origin}/demo`, { status: 303 });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) await supabase.from("profiles").update({ status: "offline" }).eq("id", user.id);
  await supabase.auth.signOut();
  return NextResponse.redirect(`${origin}/login`, { status: 303 });
}

// GET is retained for old bookmarks; application UI uses POST.
export async function GET(request: Request) {
  return POST(request);
}
