import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

const admin = () => createAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { action, parentId, pairId } = await req.json();
  const db = admin();

  if (action === "create") {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    const { data: pair, error } = await db
      .from("pairs")
      .insert({ parent_id: parentId, invite_code: code })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ pair });
  }

  if (action === "remove") {
    // child_id 조회 후 user_profiles 업데이트
    const { data: pair } = await db.from("pairs").select("child_id").eq("id", pairId).single();
    if (pair?.child_id) {
      await db.from("user_profiles").update({ pair_id: null }).eq("id", pair.child_id);
    }
    // 페어 초기화 (코드 재발급, child 해제)
    const newCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    await db.from("pairs").update({ child_id: null, invite_code: newCode }).eq("id", pairId);
    return NextResponse.json({ ok: true });
  }

  if (action === "delete") {
    await db.from("pairs").delete().eq("id", pairId);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
