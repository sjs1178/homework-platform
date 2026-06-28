import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PREFS } from "@/lib/notify";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { data } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return NextResponse.json({ prefs: data ?? { user_id: user.id, ...DEFAULT_PREFS } });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const body = await req.json() as Partial<typeof DEFAULT_PREFS>;

  // 허용된 필드만 반영 + 범위 보정
  const patch: Record<string, unknown> = { user_id: user.id, updated_at: new Date().toISOString() };
  if (body.homework_reminder_min !== undefined) {
    const m = Number(body.homework_reminder_min);
    patch.homework_reminder_min = Number.isFinite(m) ? Math.max(0, Math.min(720, Math.round(m))) : 30;
  }
  if (body.homework_notify_parent !== undefined) patch.homework_notify_parent = !!body.homework_notify_parent;
  if (body.check_request !== undefined) patch.check_request = !!body.check_request;
  if (body.check_complete !== undefined) patch.check_complete = !!body.check_complete;
  if (body.reward_change !== undefined) patch.reward_change = !!body.reward_change;

  const { error } = await supabase
    .from("notification_preferences")
    .upsert(patch, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
