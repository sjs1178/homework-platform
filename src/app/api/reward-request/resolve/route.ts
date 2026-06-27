import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { requestId, action } = await req.json() as {
    requestId: string;
    action: "approved" | "rejected";
  };

  const { data: request } = await supabase
    .from("reward_requests")
    .select("*")
    .eq("id", requestId)
    .eq("status", "pending")
    .single();

  if (!request) return NextResponse.json({ error: "요청을 찾을 수 없어요" }, { status: 404 });

  // 해당 자녀와 연결된 부모(공동양육자 포함) 누구나 승인/거절 가능
  const { data: parentPair } = await supabase
    .from("pairs")
    .select("id")
    .eq("parent_id", user.id)
    .eq("child_id", request.child_id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (!parentPair) {
    return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  await supabase
    .from("reward_requests")
    .update({ status: action, resolved_at: new Date().toISOString() })
    .eq("id", requestId);

  if (action === "approved") {
    await supabase.from("reward_logs").insert({
      pair_id: request.pair_id,
      child_id: request.child_id,
      type: "earn",
      reward_type: "point",
      amount: request.amount,
      note: request.reason ? `요청: ${request.reason}` : "자녀 요청 승인",
    });
  }

  return NextResponse.json({ ok: true });
}
