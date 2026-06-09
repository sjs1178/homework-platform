import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { pairId, catalogId, cost } = await req.json() as {
    pairId: string;
    catalogId: string;
    cost: number;
  };

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 현재 잔액 확인
  const { data: logs } = await admin
    .from("reward_logs")
    .select("type, amount")
    .eq("pair_id", pairId)
    .eq("child_id", user.id);

  const earned = (logs ?? []).filter((l) => l.type === "earn").reduce((s, l) => s + l.amount, 0);
  const spent = (logs ?? []).filter((l) => l.type === "spend").reduce((s, l) => s + l.amount, 0);
  const balance = earned - spent;

  if (balance < cost) {
    return NextResponse.json({ error: "포인트 부족" }, { status: 400 });
  }

  const { data: catalog } = await admin
    .from("reward_catalog")
    .select("title")
    .eq("id", catalogId)
    .single();

  await admin.from("reward_logs").insert({
    pair_id: pairId,
    child_id: user.id,
    type: "spend",
    reward_type: "point",
    amount: cost,
    note: `${catalog?.title ?? "리워드"} 교환`,
  });

  return NextResponse.json({ ok: true, newBalance: balance - cost });
}
