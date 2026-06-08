import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { checkId, corrections } = await req.json() as {
    checkId: string;
    corrections: {
      problemNumber: number;
      subject: string;
      question: string;
      studentAnswer: string;
      aiIsCorrect: boolean;
      aiCorrectAnswer: string;
      aiExplanation: string | null;
      correctedIsCorrect: boolean;
      correctedCorrectAnswer: string;
      correctedExplanation: string;
    }[];
  };

  const { data: check } = await supabase
    .from("homework_checks")
    .select("pair_id, results")
    .eq("id", checkId)
    .single();

  if (!check) return NextResponse.json({ error: "검사 없음" }, { status: 404 });

  const admin = createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 수정 이력 저장 (학습 데이터)
  const rows = corrections.map((c) => ({
    homework_check_id: checkId,
    pair_id: check.pair_id,
    problem_number: c.problemNumber,
    subject: c.subject,
    question: c.question,
    student_answer: c.studentAnswer,
    ai_is_correct: c.aiIsCorrect,
    ai_correct_answer: c.aiCorrectAnswer,
    ai_explanation: c.aiExplanation,
    corrected_is_correct: c.correctedIsCorrect,
    corrected_correct_answer: c.correctedCorrectAnswer,
    corrected_explanation: c.correctedExplanation,
  }));

  await admin
    .from("homework_check_corrections")
    .upsert(rows, { onConflict: "homework_check_id,problem_number" });

  // results JSON 업데이트 (수정된 값 반영)
  const results = check.results as {
    problems: {
      number: number;
      isCorrect: boolean;
      correctAnswer: string;
      explanation: string | null;
    }[];
    score: number;
    total: number;
  };

  const correctionMap = Object.fromEntries(corrections.map((c) => [c.problemNumber, c]));
  const updatedProblems = results.problems.map((p) => {
    const fix = correctionMap[p.number];
    if (!fix) return p;
    return {
      ...p,
      isCorrect: fix.correctedIsCorrect,
      correctAnswer: fix.correctedCorrectAnswer,
      explanation: fix.correctedExplanation || null,
    };
  });
  const newScore = updatedProblems.filter((p) => p.isCorrect).length;

  await admin.from("homework_checks").update({
    results: { ...results, problems: updatedProblems, score: newScore },
    score: newScore,
    is_reviewed: true,
    reviewed_at: new Date().toISOString(),
  }).eq("id", checkId);

  return NextResponse.json({ ok: true });
}
