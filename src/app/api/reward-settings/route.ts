import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { pairId, rewardName, rewardUnit } = await req.json() as {
    pairId: string;
    rewardName: string;
    rewardUnit: string;
  };

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 부모가 해당 pair의 소유자인지 확인 후 child_id 도출
  const { data: pair } = await admin
    .from("pairs")
    .select("parent_id, child_id")
    .eq("id", pairId)
    .single();

  if (!pair || pair.parent_id !== user.id) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }
  if (!pair.child_id) {
    return NextResponse.json({ error: "자녀가 연결되지 않았어요" }, { status: 400 });
  }

  // 자녀와 연결된 모든 pair(공동양육자 포함)에 동일한 단위/이름 적용
  const { data: childPairs } = await admin
    .from("pairs")
    .select("id")
    .eq("child_id", pair.child_id)
    .eq("status", "active");

  const targetPairIds = (childPairs ?? []).map((p) => p.id);
  if (!targetPairIds.includes(pairId)) targetPairIds.push(pairId);

  const rows = targetPairIds.map((id) => ({
    pair_id: id,
    point_reward_name: rewardName,
    point_reward_unit: rewardUnit,
  }));

  const { error } = await admin
    .from("reward_settings")
    .upsert(rows, { onConflict: "pair_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
