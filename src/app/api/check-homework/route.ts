import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { checkHomework, checkHomeworkByText, CheckResult } from "@/lib/check-homework";
import { tagCurriculum } from "@/lib/curriculum";
import { getEffectiveGrade } from "@/lib/grade";

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const MANUAL_RESULT: CheckResult = {
  subject: "-",
  problems: [],
  score: 0,
  total: 0,
  feedback: "부모가 직접 확인 완료했습니다.",
};

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { homeworkId, images, text } = await req.json() as {
    homeworkId: string;
    images?: { base64: string; mediaType: MediaType }[];
    text?: string;
  };

  const { data: hw } = await supabase
    .from("homeworks")
    .select("*, pairs(id)")
    .eq("id", homeworkId)
    .single();

  if (!hw) return NextResponse.json({ error: "숙제 없음" }, { status: 404 });

  // curriculum_meta 백필: 검사 시점에 없으면 채워줌
  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  if (!hw.curriculum_meta) {
    const { data: pair } = await admin
      .from("pairs")
      .select("child_id")
      .eq("id", hw.pair_id)
      .single();
    if (pair?.child_id) {
      const { data: childProfile } = await admin
        .from("user_profiles")
        .select("grade, grade_school_year")
        .eq("id", pair.child_id)
        .single();
      const effectiveGrade = getEffectiveGrade(
        childProfile?.grade ?? null,
        childProfile?.grade_school_year ?? null
      );
      const meta = tagCurriculum(hw.subject, hw.description ?? "", effectiveGrade);
      if (meta) {
        await admin
          .from("homeworks")
          .update({ curriculum_meta: meta })
          .eq("id", homeworkId);
      }
    }
  }

  // 채점 방식 결정
  let result: CheckResult;
  try {
    if (images?.length) {
      result = await checkHomework(images);
    } else if (text?.trim()) {
      result = await checkHomeworkByText(text.trim());
    } else {
      result = MANUAL_RESULT;
    }
  } catch {
    return NextResponse.json({ error: "채점 중 오류가 발생했어요." }, { status: 500 });
  }

  const { data: checkRow } = await admin.from("homework_checks").upsert({
    homework_id: homeworkId,
    pair_id: hw.pair_id,
    results: result,
    score: result.score,
    total_problems: result.total,
    is_reviewed: result.total === 0, // 수동 확인은 즉시 검토 완료
  }, { onConflict: "homework_id" }).select("id").single();

  // 점수 기반 리워드 처리 (숙제별 trigger 사용)
  if (result.total > 0 && hw.reward_trigger === "score" && hw.reward_amount > 0) {
    const { data: pair } = await admin
      .from("pairs")
      .select("child_id")
      .eq("id", hw.pair_id)
      .single();

    if (pair?.child_id) {
      const amount = result.score * hw.reward_amount;
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
