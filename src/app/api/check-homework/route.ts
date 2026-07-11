import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { checkHomework, checkHomeworkByText, CheckResult } from "@/lib/check-homework";
import { tagCurriculum, type CurriculumMeta } from "@/lib/curriculum";
import { getEffectiveGrade } from "@/lib/grade";
import { updateSkillRecord } from "@/lib/skill-records";
import { notifyUsers, getPrefsMap } from "@/lib/notify";
import type { AiProvider } from "@/lib/ai-token";

// Vercel 함수 실행 한도 (기본 10초면 AI 채점 중 강제 종료 → 504). Hobby 최대 60초.
export const maxDuration = 60;

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
  let currMeta = hw.curriculum_meta as CurriculumMeta | null;
  if (!currMeta) {
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
      currMeta = tagCurriculum(hw.subject, hw.description ?? "", effectiveGrade);
      if (currMeta) {
        await admin.from("homeworks").update({ curriculum_meta: currMeta }).eq("id", homeworkId);
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
    const name = err instanceof Error ? err.name : "";
    const lower = raw.toLowerCase();
    let msg = "채점 중 오류가 발생했어요. 잠시 후 다시 시도해 주세요.";
    let errorCode = "unknown";
    if (name === "APIConnectionTimeoutError" || name === "AbortError" || lower.includes("timeout") || lower.includes("timed out")) {
      msg = "AI 응답 시간이 초과되었어요. 사진 수를 줄이거나 잠시 후 다시 시도해 주세요.";
      errorCode = "timeout";
    } else if (lower.includes("request too large") || lower.includes("413") || lower.includes("payload")) {
      msg = "이미지 용량이 너무 커요. 사진 수를 줄이거나 작은 이미지를 사용해 주세요.";
      errorCode = "payload_too_large";
    } else if (lower.includes("quota") || lower.includes("rate") || lower.includes("429")) {
      msg = "API 키의 사용 한도가 초과되었어요. 잠시 후 다시 시도하거나, 다른 AI 키를 사용해 주세요.";
      errorCode = "rate_limit";
    } else if (lower.includes("invalid") && lower.includes("key")) {
      msg = "API 키가 유효하지 않아요. 설정에서 키를 다시 확인해 주세요.";
      errorCode = "invalid_key";
    } else if (lower.includes("unauthorized") || lower.includes("401") || lower.includes("403")) {
      msg = "API 키 인증에 실패했어요. 설정에서 키를 다시 확인해 주세요.";
      errorCode = "auth_failed";
    } else if (lower.includes("overloaded") || lower.includes("529")) {
      msg = "AI 서비스가 일시적으로 과부하 상태예요. 잠시 후 다시 시도해 주세요.";
      errorCode = "overloaded";
    } else if (lower.includes("파싱")) {
      msg = "AI 응답을 처리하지 못했어요. 사진이 너무 흐리거나 글씨가 잘 안 보일 수 있어요.";
      errorCode = "parse_failed";
    }
    console.error("[check-homework] error:", name, raw);
    return NextResponse.json({ error: msg, errorCode }, { status: 500 });
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

  // 리워드는 부모가 '검사 완료'를 눌러 지급 (채점 시 자동 지급하지 않음)

  // 스킬 숙달 기록 업데이트
  if (currMeta && result.total > 0 && childId) {
    updateSkillRecord(admin, hw.pair_id, childId, currMeta, result).catch(() => {});
  }

  // 검사 완료 알림: 자녀가 check_complete 켰으면
  if (childId) {
    try {
      const prefs = await getPrefsMap(admin, [childId]);
      if (prefs[childId].check_complete) {
        const scoreText = result.total > 0 ? ` (${result.score}/${result.total})` : "";
        await notifyUsers(admin, [childId], {
          title: "숙제 검사 완료",
          body: `'${hw.subject}' 숙제 검사가 완료됐어요${scoreText}.`,
          type: "check_complete",
          link: "/child/dashboard",
        });
      }
    } catch (e) {
      console.error("[check-homework] notify failed:", e);
    }
  }

  return NextResponse.json({ ok: true, result, checkId: checkRow?.id ?? null });
}
