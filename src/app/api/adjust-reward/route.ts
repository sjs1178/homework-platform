import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { notifyUsers, getPrefsMap } from "@/lib/notify";
import { kindToType, type RewardKind } from "@/lib/reward";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { pairId, childId, type, amount, note, kind, entryKind } = await req.json() as {
    pairId: string;
    childId: string;
    type: "earn" | "spend";
    amount: number;
    note: string;
    kind?: RewardKind;       // 통화 (미지정 시 가정의 주 통화)
    entryKind?: string;      // 사유 (미지정 시 지급=grant / 차감=revoke)
  };

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "금액을 확인해주세요" }, { status: 400 });
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 부모가 해당 pair의 parent인지 확인
  const { data: pair } = await admin
    .from("pairs")
    .select("parent_id")
    .eq("id", pairId)
    .single();

  if (pair?.parent_id !== user.id) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  // 통화: 미지정이면 가정의 주 통화를 따른다
  const { data: setting } = await admin
    .from("reward_settings").select("primary_kind").eq("pair_id", pairId).maybeSingle();
  const effectiveKind: RewardKind =
    kind ?? (setting?.primary_kind === "time" ? "time" : "money");

  await admin.from("reward_logs").insert({
    pair_id: pairId,
    child_id: childId,
    type,
    reward_type: kindToType(effectiveKind),
    entry_kind: entryKind ?? (type === "earn" ? "grant" : "revoke"),
    amount,
    note: note || (type === "earn" ? "부모 직접 지급" : "부모 회수"),
  });

  // 리워드 변경 알림: 자녀가 reward_change 켰으면
  try {
    const { data: rs } = await admin
      .from("reward_settings")
      .select("time_reward_name, time_reward_unit, point_reward_name, point_reward_unit")
      .eq("pair_id", pairId)
      .single();
    const isTime = effectiveKind === "time";
    const unit = (isTime ? rs?.time_reward_unit : rs?.point_reward_unit) ?? (isTime ? "분" : "P");
    const name = (isTime ? rs?.time_reward_name : rs?.point_reward_name) ?? (isTime ? "게임시간" : "리워드");
    const prefs = await getPrefsMap(admin, [childId]);
    if (prefs[childId].reward_change) {
      await notifyUsers(admin, [childId], {
        title: type === "earn" ? `${name} 지급` : `${name} 차감`,
        body: `${name} ${amount}${unit}이(가) ${type === "earn" ? "지급" : "차감"}됐어요.`,
        type: "reward_change",
        link: "/child/rewards",
      });
    }
  } catch (e) {
    console.error("[adjust-reward] notify failed:", e);
  }

  return NextResponse.json({ ok: true });
}
