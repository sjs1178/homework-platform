import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
