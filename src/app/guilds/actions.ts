"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  return supabase;
}

export async function createGuild(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Enter a server name");
  const supabase = await requireUser();
  const { data, error } = await supabase.rpc("create_guild_with", {
    gname: name.slice(0, 100),
  });
  if (error || !data) throw new Error(error?.message ?? "Could not create server");
  revalidatePath("/guilds");
  redirect(`/guilds/${data}`);
}

export async function joinGuild(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  if (!code) throw new Error("Enter an invite code");
  const supabase = await requireUser();
  const { data, error } = await supabase.rpc("join_guild_by_code", {
    invite_code: code,
  });
  if (error || !data) throw new Error(error?.message ?? "Invalid invite");
  revalidatePath("/guilds");
  redirect(`/guilds/${data}`);
}

export async function createChannel(guildId: string, formData: FormData) {
  const raw = String(formData.get("name") ?? "").trim().toLowerCase();
  const topic = String(formData.get("topic") ?? "").slice(0, 200);
  if (!raw) throw new Error("Enter a channel name");
  const supabase = await requireUser();
  const { error } = await supabase.rpc("create_channel_in", {
    p_guild_id: guildId,
    cname: raw,
    ctopic: topic,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/guilds/${guildId}`);
}

export async function createInvite(guildId: string) {
  const supabase = await requireUser();
  const { data, error } = await supabase.rpc("create_invite_for", {
    p_guild_id: guildId,
  });
  if (error || !data) throw new Error(error?.message ?? "Could not create invite");
  return data as string;
}
