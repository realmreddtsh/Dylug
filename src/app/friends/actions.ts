"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  return { supabase, user };
}

export async function sendFriendRequest(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim();
  if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) throw new Error("Enter a valid username");
  const { supabase, user } = await requireUser();

  const { data: target } = await supabase.from("profiles").select("id,username").ilike("username", username).limit(1).maybeSingle();
  if (!target) throw new Error("We couldn’t find anyone with that username");
  if (target.id === user.id) throw new Error("You can’t add yourself");

  const { data: existing } = await supabase
    .from("friendships")
    .select("user_id,friend_id,status")
    .or(`and(user_id.eq.${user.id},friend_id.eq.${target.id}),and(user_id.eq.${target.id},friend_id.eq.${user.id})`);

  if (existing?.some((row) => row.status === "accepted")) throw new Error("You’re already friends");
  if (existing?.some((row) => row.status === "pending" && row.user_id === user.id)) throw new Error("Friend request already sent");

  // Sending a request to someone who already requested you accepts it.
  const incoming = existing?.find((row) => row.status === "pending" && row.user_id === target.id);
  if (incoming) {
    const { error: updateError } = await supabase.from("friendships").update({ status: "accepted" }).eq("user_id", target.id).eq("friend_id", user.id).eq("status", "pending");
    if (updateError) throw new Error(updateError.message);
    const { error: mirrorError } = await supabase.from("friendships").upsert({ user_id: user.id, friend_id: target.id, status: "accepted" }, { onConflict: "user_id,friend_id" });
    if (mirrorError) throw new Error(mirrorError.message);
  } else {
    const { error } = await supabase.from("friendships").insert({ user_id: user.id, friend_id: target.id, status: "pending" });
    if (error) throw new Error(error.code === "23505" ? "Friend request already sent" : error.message);
  }
  revalidatePath("/friends");
}

export async function acceptFriendRequest(friendId: string) {
  const { supabase, user } = await requireUser();
  const { data, error } = await supabase.from("friendships").update({ status: "accepted" }).eq("user_id", friendId).eq("friend_id", user.id).eq("status", "pending").select("user_id").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("This friend request is no longer available");

  const { error: mirrorError } = await supabase.from("friendships").upsert({ user_id: user.id, friend_id: friendId, status: "accepted" }, { onConflict: "user_id,friend_id" });
  if (mirrorError) throw new Error(mirrorError.message);
  revalidatePath("/friends");
}

export async function declineFriendRequest(friendId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("friendships").delete().eq("user_id", friendId).eq("friend_id", user.id).eq("status", "pending");
  if (error) throw new Error(error.message);
  revalidatePath("/friends");
}

export async function removeFriend(friendId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("friendships").delete().or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);
  if (error) throw new Error(error.message);
  revalidatePath("/friends");
}
