import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "child") {
    return NextResponse.json(
      { error: "부모 계정은 직접 탈퇴할 수 있습니다." },
      { status: 400 }
    );
  }

  const { data: pairs } = await supabase
    .from("pairs")
    .select("id")
    .eq("child_id", user.id)
    .eq("status", "active");

  if (!pairs || pairs.length === 0) {
    return NextResponse.json(
      { error: "연결된 부모 계정이 없습니다." },
      { status: 400 }
    );
  }

  const { data: existing } = await supabase
    .from("withdrawal_requests")
    .select("id")
    .eq("child_id", user.id)
    .eq("status", "pending");

  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "이미 탈퇴 요청이 진행 중입니다." },
      { status: 409 }
    );
  }

  const inserts = pairs.map((p) => ({
    child_id: user.id,
    pair_id: p.id,
  }));

  const { error } = await supabase
    .from("withdrawal_requests")
    .insert(inserts);

  if (error) {
    return NextResponse.json(
      { error: "요청 처리에 실패했습니다." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
