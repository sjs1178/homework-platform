import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import type { RewardKind } from "@/lib/reward";

// 리워드 통화 구성(주 통화, 이름·단위, 두 번째 통화 사용 여부)을
// 해당 자녀와 연결된 모든 pair에 동일하게 전파한다.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { pairId, primaryKind, secondaryEnabled, timeName, timeUnit, moneyName, moneyUnit } =
    await req.json() as {
      pairId: string;
      primaryKind: RewardKind;
      secondaryEnabled: boolean;
      timeName: string;
      timeUnit: string;
      moneyName: string;
      moneyUnit: string;
    };

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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

  const { data: childPairs } = await admin
    .from("pairs")
    .select("id")
    .eq("child_id", pair.child_id)
    .eq("status", "active");

  const targetPairIds = (childPairs ?? []).map((p) => p.id);
  if (!targetPairIds.includes(pairId)) targetPairIds.push(pairId);

  const rows = targetPairIds.map((id) => ({
    pair_id: id,
    primary_kind: primaryKind === "time" ? "time" : "money",
    secondary_enabled: !!secondaryEnabled,
    time_reward_name: timeName?.trim() || "게임시간",
    time_reward_unit: timeUnit?.trim() || "분",
    point_reward_name: moneyName?.trim() || "리워드",
    point_reward_unit: moneyUnit?.trim() || "P",
  }));

  const { error } = await admin
    .from("reward_settings")
    .upsert(rows, { onConflict: "pair_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
