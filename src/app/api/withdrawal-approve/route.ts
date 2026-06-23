import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { requestId, action } = await req.json();

  if (!requestId || !["approve", "reject"].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { data: wr } = await supabase
    .from("withdrawal_requests")
    .select("id, child_id, pair_id, status")
    .eq("id", requestId)
    .single();

  if (!wr || wr.status !== "pending") {
    return NextResponse.json(
      { error: "요청을 찾을 수 없습니다." },
      { status: 404 }
    );
  }

  const { data: pair } = await supabase
    .from("pairs")
    .select("parent_id")
    .eq("id", wr.pair_id)
    .single();

  if (!pair || pair.parent_id !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (action === "reject") {
    await supabase
      .from("withdrawal_requests")
      .update({ status: "rejected", resolved_at: new Date().toISOString() })
      .eq("id", requestId);

    return NextResponse.json({ success: true, action: "rejected" });
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const childId = wr.child_id;

  const { data: childPairs } = await admin
    .from("pairs")
    .select("id")
    .eq("child_id", childId);

  const pairIds = (childPairs ?? []).map((p) => p.id);

  if (pairIds.length > 0) {
    await admin.from("mission_claims").delete().eq("child_id", childId);
    await admin.from("reward_logs").delete().eq("child_id", childId);
    await admin.from("skill_records").delete().eq("child_id", childId);
    await admin
      .from("pairs")
      .update({ child_id: null })
      .in("id", pairIds);
  }

  await admin
    .from("withdrawal_requests")
    .delete()
    .eq("child_id", childId);
  await admin.from("pending_approvals").delete().eq("child_auth_id", childId);
  await admin.from("device_tokens").delete().eq("user_id", childId);
  await admin.from("notifications").delete().eq("user_id", childId);
  await admin.from("user_profiles").delete().eq("id", childId);

  await admin.auth.admin.deleteUser(childId);

  return NextResponse.json({ success: true, action: "approved" });
}
