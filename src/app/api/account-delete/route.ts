import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const uid = user.id;

  const { data: profile } = await admin
    .from("user_profiles")
    .select("role")
    .eq("id", uid)
    .single();

  const role = profile?.role;

  if (role === "parent") {
    const { data: pairs } = await admin
      .from("pairs")
      .select("id")
      .eq("parent_id", uid);

    const pairIds = (pairs ?? []).map((p) => p.id);

    if (pairIds.length > 0) {
      await admin.from("homework_checks").delete().in("pair_id", pairIds);
      await admin
        .from("homework_check_corrections")
        .delete()
        .in("pair_id", pairIds);
      await admin.from("homeworks").delete().in("pair_id", pairIds);
      await admin.from("reward_logs").delete().in("pair_id", pairIds);
      await admin.from("reward_catalog").delete().in("pair_id", pairIds);
      await admin.from("reward_settings").delete().in("pair_id", pairIds);
      await admin.from("subject_rules").delete().in("pair_id", pairIds);
      await admin.from("mission_settings").delete().in("pair_id", pairIds);
      await admin.from("mission_claims").delete().in("pair_id", pairIds);
      await admin.from("skill_records").delete().in("pair_id", pairIds);
      await admin.from("reward_requests").delete().in("pair_id", pairIds);
      await admin
        .from("pairs")
        .update({ child_id: null, status: "rejected" })
        .in("id", pairIds);
      await admin.from("pairs").delete().in("id", pairIds);
    }
  } else if (role === "child") {
    const { data: pairs } = await admin
      .from("pairs")
      .select("id")
      .eq("child_id", uid);

    const pairIds = (pairs ?? []).map((p) => p.id);

    if (pairIds.length > 0) {
      await admin.from("mission_claims").delete().eq("child_id", uid);
      await admin.from("reward_logs").delete().eq("child_id", uid);
      await admin.from("skill_records").delete().eq("child_id", uid);
      await admin
        .from("pairs")
        .update({ child_id: null })
        .in("id", pairIds);
    }

    await admin.from("pending_approvals").delete().eq("child_auth_id", uid);
  }

  await admin.from("device_tokens").delete().eq("user_id", uid);
  await admin.from("notifications").delete().eq("user_id", uid);
  await admin.from("user_profiles").delete().eq("id", uid);

  const { error } = await admin.auth.admin.deleteUser(uid);

  if (error) {
    return NextResponse.json(
      { error: "Failed to delete account" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
