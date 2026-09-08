import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import DemoWorkspace from "@/components/DemoWorkspace";
import LandingPage from "@/components/LandingPage";

export default async function Home() {
  // The repository is useful immediately after cloning: without credentials we
  // render a fully interactive product demo. Once Supabase is configured, this
  // route becomes the public landing page and signed-in users enter the app.
  if (!isSupabaseConfigured()) return <DemoWorkspace />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/friends");
  return <LandingPage />;
}
