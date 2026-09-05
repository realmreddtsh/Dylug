import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/friends");

  return (
    <div className="flex flex-1 items-center justify-center bg-disc-rail px-4">
      <main className="w-full max-w-md rounded-xl bg-disc-side p-8 text-center shadow-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-disc-brand text-3xl font-bold text-white">
          D
        </div>
        <h1 className="mt-4 text-3xl font-bold text-white">Dylug</h1>
        <p className="mt-2 text-sm text-disc-muted">
          Group chat that&apos;s almost like Discord, but not quite. Servers,
          channels, friends, and DMs.
        </p>
        <div className="mt-6 flex gap-2">
          <Link
            href="/login"
            className="flex-1 rounded bg-disc-brand px-3 py-2.5 font-medium text-white hover:brightness-110"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="flex-1 rounded bg-disc-active px-3 py-2.5 font-medium text-white hover:bg-disc-hover"
          >
            Register
          </Link>
        </div>
      </main>
    </div>
  );
}
