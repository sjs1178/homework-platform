import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { notifyUsers, getPrefsMap, getParentIdsOfChild } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { pairId, amount, reason } = await req.json() as {
    pairId: string;
    amount: number;
    reason: string;
  };

  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "금액을 확인해주세요" }, { status: 400 });
  }

  const { data, error } = await supabase.from("reward_requests").insert({
    pair_id: pairId,
    child_id: user.id,
    amount,
    reason: reason.trim() || "",
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 리워드 요청 알림: 연결된 부모 중 reward_change 켠 사람에게
  try {
    const admin = createAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data: childProfile } = await admin
      .from("user_profiles")
      .select("display_name")
      .eq("id", user.id)
      .single();
    const childName = childProfile?.display_name ?? "자녀";
    const parentIds = await getParentIdsOfChild(admin, user.id);
    if (parentIds.length) {
      const prefs = await getPrefsMap(admin, parentIds);
      const targets = parentIds.filter((pid) => prefs[pid].reward_change);
      if (targets.length) {
        await notifyUsers(admin, targets, {
          title: "리워드 요청",
          body: `${childName}님이 리워드 ${amount}을(를) 요청했어요${reason.trim() ? `: ${reason.trim()}` : ""}.`,
          type: "reward_change",
          link: "/parent/rewards",
        });
      }
    }
  } catch (e) {
    console.error("[reward-request] notify failed:", e);
  }

  return NextResponse.json({ ok: true, id: data.id });
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const pairId = req.nextUrl.searchParams.get("pairId");
  if (!pairId) return NextResponse.json({ error: "pairId 필요" }, { status: 400 });

  const { data } = await supabase
    .from("reward_requests")
    .select("*")
    .eq("pair_id", pairId)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ requests: data ?? [] });
}
