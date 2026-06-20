import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { checkHomework, checkHomeworkByText, CheckResult } from "@/lib/check-homework";
import { tagCurriculum } from "@/lib/curriculum";
import { getEffectiveGrade } from "@/lib/grade";
import type { AiProvider } from "@/lib/ai-token";

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

  const {
    homeworkId,
    images,
    text,
    aiToken,
    aiProvider,
    manualResult,
  } = await req.json() as {
    homeworkId: string;
    images?: { base64: string; mediaType: MediaType }[];
    text?: string;
    aiToken?: string;
    aiProvider?: AiProvider;
    manualResult?: CheckResult;
  };

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: hw } = await admin
    .from("homeworks")
    .select("*, pairs(id, child_id)")
    .eq("id", homeworkId)
    .single();

  if (!hw) return NextResponse.json({ error: "숙제 없음" }, { status: 404 });

  // 이 부모가 해당 자녀와 연결되어 있는지 확인
  const childId = hw.pairs?.child_id;
  if (childId) {
    const { data: parentPair } = await admin
      .from("pairs")
      .select("id")
      .eq("parent_id", user.id)
      .eq("child_id", childId)
      .single();
    if (!parentPair) return NextResponse.json({ error: "권한 없음" }, { status: 403 });
  }

  // curriculum_meta 백필
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
        await admin.from("homeworks").update({ curriculum_meta: meta }).eq("id", homeworkId);
      }
    }
  }

  // 채점 방식 결정
  let result: CheckResult;
  try {
    if (manualResult) {
      result = manualResult;
    } else if (images?.length) {
      result = await checkHomework(images, aiToken, aiProvider);
    } else if (text?.trim()) {
      result = await checkHomeworkByText(text.trim(), aiToken, aiProvider);
    } else {
      result = MANUAL_RESULT;
    }
  } catch (err) {
    const raw = err instanceof Error ? err.message : "";
    const lower = raw.toLowerCase();
    let msg = "채점 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
    if (lower.includes("quota") || lower.includes("rate") || lower.includes("429"))
      msg = "API 키의 사용 한도가 초과되었어요. 잠시 후 다시 시도하거나, 다른 AI 키를 사용해 주세요.";
    else if (lower.includes("invalid") && lower.includes("key"))
      msg = "API 키가 유효하지 않아요. 설정에서 키를 다시 확인해 주세요.";
    else if (lower.includes("unauthorized") || lower.includes("401") || lower.includes("403"))
      msg = "API 키 인증에 실패했어요. 설정에서 키를 다시 확인해 주세요.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // 미완료 숙제를 부모가 검사하면 완료 처리
  if (!hw.is_completed) {
    await admin.from("homeworks").update({ is_completed: true }).eq("id", homeworkId);
  }

  const { data: checkRow } = await admin.from("homework_checks").upsert({
    homework_id: homeworkId,
    pair_id: hw.pair_id,
    results: result,
    score: result.score,
    total_problems: result.total,
    is_reviewed: result.total === 0,
  }, { onConflict: "homework_id" }).select("id").single();

  // 점수 기반 리워드
  if (result.total > 0 && hw.reward_trigger === "score" && hw.reward_amount > 0) {
    const { data: pair } = await admin.from("pairs").select("child_id").eq("id", hw.pair_id).single();
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
