import type { SupabaseClient } from "@supabase/supabase-js";
import type { CurriculumMeta } from "./curriculum";
import type { CheckResult } from "./check-homework";

interface AccuracyEntry {
  date: string;
  score: number;
  total: number;
  accuracy: number;
}

export async function updateSkillRecord(
  admin: SupabaseClient,
  pairId: string,
  childId: string,
  meta: CurriculumMeta,
  result: CheckResult,
) {
  const today = new Date().toISOString().split("T")[0];
  const accuracy = Math.round((result.score / result.total) * 1000) / 1000;

  const { data: existing } = await admin
    .from("skill_records")
    .select("id, total_attempts, correct_count, accuracy_history, mastered_at")
    .eq("pair_id", pairId)
    .eq("child_id", childId)
    .eq("subject", meta.subject)
    .eq("topic", meta.area)
    .maybeSingle();

  if (existing) {
    const newTotal = existing.total_attempts + result.total;
    const newCorrect = existing.correct_count + result.score;
    const history: AccuracyEntry[] = [
      ...((existing.accuracy_history as AccuracyEntry[]) || []),
      { date: today, score: result.score, total: result.total, accuracy },
    ];
    const masteryScore = Math.round((newCorrect / newTotal) * 1000) / 1000;
    const mastered = masteryScore >= 0.9 && newTotal >= 10;

    await admin
      .from("skill_records")
      .update({
        total_attempts: newTotal,
        correct_count: newCorrect,
        accuracy_history: history,
        mastery_score: masteryScore,
        mastered_at: mastered ? existing.mastered_at ?? new Date().toISOString() : null,
        learning_unit: meta.learningUnit,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await admin.from("skill_records").insert({
      pair_id: pairId,
      child_id: childId,
      subject: meta.subject,
      topic: meta.area,
      learning_unit: meta.learningUnit,
      total_attempts: result.total,
      correct_count: result.score,
      mastery_score: accuracy,
      accuracy_history: [{ date: today, score: result.score, total: result.total, accuracy }],
    });
  }
}
