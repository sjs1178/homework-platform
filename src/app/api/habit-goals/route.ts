import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import type { RewardKind } from "@/lib/reward";

// 습관 목표(게임시간 한도 / 용돈 예산·저축목표). 설정은 부모만, 조회는 자녀도 가능.
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const childId = req.nextUrl.searchParams.get("childId") ?? user.id;

  const { data } = await supabase
    .from("habit_goals")
    .select("kind, daily_limit, weekly_limit, monthly_budget, saving_goal")
    .eq("child_id", childId);

  return NextResponse.json({ goals: data ?? [] });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { childId, kind, daily_limit, weekly_limit, monthly_budget, saving_goal } =
    await req.json() as {
      childId: string;
      kind: RewardKind;
      daily_limit?: number | null;
      weekly_limit?: number | null;
      monthly_budget?: number | null;
      saving_goal?: number | null;
    };

  if (kind !== "time" && kind !== "money") {
    return NextResponse.json({ error: "잘못된 종류예요" }, { status: 400 });
  }

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 부모가 해당 자녀와 연결되어 있는지 확인
  const { data: pair } = await admin
    .from("pairs").select("id").eq("parent_id", user.id)
    .eq("child_id", childId).eq("status", "active").limit(1).maybeSingle();
  if (!pair) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  };

  const { error } = await admin.from("habit_goals").upsert({
    child_id: childId,
    kind,
    daily_limit: num(daily_limit),
    weekly_limit: num(weekly_limit),
    monthly_budget: num(monthly_budget),
    saving_goal: num(saving_goal),
    updated_at: new Date().toISOString(),
  }, { onConflict: "child_id,kind" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
