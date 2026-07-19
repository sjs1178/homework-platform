import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { kindToType, CATEGORIES, type RewardKind } from "@/lib/reward";
import { notifyUsers, getPrefsMap, getParentIdsOfChild } from "@/lib/notify";

// 리워드 '사용' 기록. 자녀도 부모 승인 없이 기록할 수 있다(잔액이 줄어드는 방향이므로).
// 적립은 이 엔드포인트로 불가.
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { childId: bodyChildId, kind, amount, category, note } = await req.json() as {
    childId?: string;
    kind: RewardKind;
    amount: number;
    category?: string;
    note?: string;
  };

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "사용량을 확인해주세요" }, { status: 400 });
  }
  if (kind !== "time" && kind !== "money") {
    return NextResponse.json({ error: "잘못된 리워드 종류예요" }, { status: 400 });
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await admin
    .from("user_profiles").select("role, display_name").eq("id", user.id).single();

  // 자녀 본인 기록이거나, 연결된 부모가 자녀 대신 기록
  let childId: string;
  if (profile?.role === "child") {
    childId = user.id;
  } else {
    if (!bodyChildId) return NextResponse.json({ error: "자녀를 지정해주세요" }, { status: 400 });
    const { data: pair } = await admin
      .from("pairs").select("id").eq("parent_id", user.id)
      .eq("child_id", bodyChildId).eq("status", "active").limit(1).maybeSingle();
    if (!pair) return NextResponse.json({ error: "권한 없음" }, { status: 403 });
    childId = bodyChildId;
  }

  // 기록을 붙일 pair (자녀의 활성 페어 중 하나)
  const { data: childPairs } = await admin
    .from("pairs").select("id").eq("child_id", childId).eq("status", "active").limit(1);
  const pairId = childPairs?.[0]?.id;
  if (!pairId) return NextResponse.json({ error: "연결된 가족이 없어요" }, { status: 400 });

  const safeCategory = category && CATEGORIES[kind].includes(category) ? category : "기타";

  const { error } = await admin.from("reward_logs").insert({
    pair_id: pairId,
    child_id: childId,
    type: "spend",
    reward_type: kindToType(kind),
    entry_kind: "use",
    category: safeCategory,
    amount,
    note: note?.trim() || safeCategory,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 자녀가 기록하면 부모에게 알림 (리워드 변경 알림을 켠 부모만)
  if (profile?.role === "child") {
    try {
      const parentIds = await getParentIdsOfChild(admin, childId);
      if (parentIds.length) {
        const prefs = await getPrefsMap(admin, parentIds);
        const targets = parentIds.filter((pid) => prefs[pid].reward_change);
        if (targets.length) {
          await notifyUsers(admin, targets, {
            title: "리워드 사용",
            body: `${profile.display_name ?? "자녀"}님이 ${safeCategory}에 ${amount}만큼 사용했어요.`,
            type: "reward_change",
            link: "/parent/rewards",
          });
        }
      }
    } catch (e) {
      console.error("[reward-usage] notify failed:", e);
    }
  }

  return NextResponse.json({ ok: true });
}
