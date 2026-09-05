"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getOrCreateDM(friendId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not logged in");
  if (friendId === user.id) throw new Error("Can't DM yourself");

  // find-or-create runs inside a SECURITY DEFINER function (see 0004_dms_rpc.sql),
  // so no direct cross-user dm_participants reads (which RLS forbids).
  const { data, error } = await supabase.rpc("create_dm_with", {
    partner: friendId,
  });
  if (error || !data) throw new Error(error?.message ?? "Could not create DM");
  redirect(`/dms/${data}`);
}
