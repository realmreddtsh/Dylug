import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SettingsClient from "@/components/SettingsClient";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase.from("profiles").select("username,display_name,avatar_url,status").eq("id", user.id).single();
  if (!data) redirect("/friends");

  return <SettingsClient profile={{ ...data, status: data.status as "online" | "idle" | "dnd" | "offline" }} email={user.email ?? "No email address"} />;
}
