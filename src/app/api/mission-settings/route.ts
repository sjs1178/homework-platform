import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const pairId = req.nextUrl.searchParams.get("pairId");
  if (!pairId) return NextResponse.json({ error: "pairId 필요" }, { status: 400 });

  const { data } = await supabase
    .from("mission_settings")
    .select("*")
    .eq("pair_id", pairId)
    .single();

  return NextResponse.json({
    daily_reward: data?.daily_reward ?? 5,
    weekly_reward: data?.weekly_reward ?? 30,
    monthly_reward: data?.monthly_reward ?? 100,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { pairId, daily_reward, weekly_reward, monthly_reward } = await req.json();

  const { data: pair } = await supabase
    .from("pairs")
    .select("id")
    .eq("id", pairId)
    .eq("parent_id", user.id)
    .single();

  if (!pair) return NextResponse.json({ error: "권한 없음" }, { status: 403 });

  const { error } = await supabase.from("mission_settings").upsert(
    {
      pair_id: pairId,
      daily_reward: daily_reward ?? 5,
      weekly_reward: weekly_reward ?? 30,
      monthly_reward: monthly_reward ?? 100,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "pair_id" }
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
