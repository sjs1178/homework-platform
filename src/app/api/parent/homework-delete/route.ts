import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { homeworkId } = await req.json() as { homeworkId: string };
  if (!homeworkId) return NextResponse.json({ error: "homeworkId 필요" }, { status: 400 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: hw } = await admin
    .from("homeworks")
    .select("id, pair_id")
    .eq("id", homeworkId)
    .single();

  if (!hw) return NextResponse.json({ error: "숙제 없음" }, { status: 404 });

  const { data: pair } = await admin
    .from("pairs")
    .select("child_id")
    .eq("id", hw.pair_id)
    .single();

  const childId = pair?.child_id;
  if (childId) {
    const { data: parentPair } = await admin
      .from("pairs")
      .select("id")
      .eq("parent_id", user.id)
      .eq("child_id", childId)
      .single();
    if (!parentPair) return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  // 관련 레코드 삭제 후 숙제 삭제
  await admin.from("homework_check_corrections").delete().eq("homework_id", homeworkId);
  await admin.from("homework_checks").delete().eq("homework_id", homeworkId);
  await admin.from("reward_logs").delete().eq("homework_id", homeworkId);
  await admin.from("homeworks").delete().eq("id", homeworkId);

  return NextResponse.json({ ok: true });
}
