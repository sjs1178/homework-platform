import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { pairId, childId, type, amount, note } = await req.json() as {
    pairId: string;
    childId: string;
    type: "earn" | "spend";
    amount: number;
    note: string;
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

  await admin.from("reward_logs").insert({
    pair_id: pairId,
    child_id: childId,
    type,
    reward_type: "point",
    amount,
    note: note || (type === "earn" ? "부모 직접 지급" : "부모 차감"),
  });

  return NextResponse.json({ ok: true });
}
