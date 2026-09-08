"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = { ok: boolean; message: string };

export async function updateProfile(_previous: SettingsState, formData: FormData): Promise<SettingsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Your session expired. Please log in again." };

  const username = String(formData.get("username") ?? "").trim();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const avatarUrl = String(formData.get("avatar_url") ?? "").trim();
  const status = String(formData.get("status") ?? "online");

  if (!/^[a-zA-Z0-9_]{3,32}$/.test(username)) return { ok: false, message: "Username must be 3–32 letters, numbers, or underscores." };
  if (!displayName || displayName.length > 100) return { ok: false, message: "Display name must be 1–100 characters." };
  if (avatarUrl) {
    try {
      const parsed = new URL(avatarUrl);
      if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error();
    } catch {
      return { ok: false, message: "Avatar must be a valid http(s) URL." };
    }
  }
  if (!new Set(["online", "idle", "dnd", "offline"]).has(status)) return { ok: false, message: "Choose a valid status." };

  const { error } = await supabase.from("profiles").update({ username, display_name: displayName, avatar_url: avatarUrl || null, status }).eq("id", user.id);
  if (error) return { ok: false, message: error.code === "23505" ? "That username is already taken." : error.message };

  revalidatePath("/settings");
  revalidatePath("/friends");
  return { ok: true, message: "Your profile has been saved." };
}
