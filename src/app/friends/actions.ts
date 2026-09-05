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
  if (!username) throw new Error("Enter a username");
  const { supabase, user } = await requireUser();

  const { data: target } = await supabase
    .from("profiles")
    .select("id,username")
    .eq("username", username)
    .single();
  if (!target) throw new Error("User not found");
  if (target.id === user.id) throw new Error("You can't add yourself");

  const { error } = await supabase.from("friendships").insert({
    user_id: user.id,
    friend_id: target.id,
    status: "pending",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/friends");
}

export async function acceptFriendRequest(friendId: string) {
  const { supabase, user } = await requireUser();
  // Incoming row is (friendId -> me). Mark accepted...
  const { error: e1 } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("user_id", friendId)
    .eq("friend_id", user.id);
  if (e1) throw new Error(e1.message);
  // ...and mirror it so both sides list each other.
  const { error: e2 } = await supabase.from("friendships").upsert(
    { user_id: user.id, friend_id: friendId, status: "accepted" },
    { onConflict: "user_id,friend_id" }
  );
  if (e2) throw new Error(e2.message);
  revalidatePath("/friends");
}

export async function declineFriendRequest(friendId: string) {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("user_id", friendId)
    .eq("friend_id", user.id);
  if (error) throw new Error(error.message);
  revalidatePath("/friends");
}

export async function removeFriend(friendId: string) {
  const { supabase, user } = await requireUser();
  // Delete both directions (pending or accepted).
  const { error } = await supabase
    .from("friendships")
    .delete()
    .or(
      `and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`
    );
  if (error) throw new Error(error.message);
  revalidatePath("/friends");
}
