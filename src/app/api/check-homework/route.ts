import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { checkHomework } from "@/lib/check-homework";

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { homeworkId, images } = await req.json() as {
    homeworkId: string;
    images: { base64: string; mediaType: MediaType }[];
  };

  if (!images?.length) return NextResponse.json({ error: "이미지 필요" }, { status: 400 });

  const { data: hw } = await supabase
    .from("homeworks")
    .select("*, pairs(id)")
    .eq("id", homeworkId)
    .single();

  if (!hw) return NextResponse.json({ error: "숙제 없음" }, { status: 404 });

  const result = await checkHomework(images);

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: checkRow } = await admin.from("homework_checks").upsert({
    homework_id: homeworkId,
    pair_id: hw.pair_id,
    results: result,
    score: result.score,
    total_problems: result.total,
    is_reviewed: false,
  }, { onConflict: "homework_id" }).select("id").single();

  // 점수 기반 리워드 처리
  const { data: settings } = await admin
    .from("reward_settings")
    .select("*")
    .eq("pair_id", hw.pair_id)
    .single();

  if (settings?.reward_trigger === "score") {
    const { data: pair } = await admin
      .from("pairs")
      .select("child_id")
      .eq("id", hw.pair_id)
      .single();

    if (pair?.child_id) {
      const amount = result.score * (settings.score_multiplier ?? 1);
      if (amount > 0) {
        await admin.from("reward_logs").insert({
          pair_id: hw.pair_id,
          child_id: pair.child_id,
          homework_id: homeworkId,
          type: "earn",
          reward_type: "point",
          amount,
          note: `${hw.subject} 검사 (${result.score}/${result.total}점)`,
        });
      }
    }
  }

  return NextResponse.json({ ok: true, result, checkId: checkRow?.id ?? null });
}
