import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdmin } from "@supabase/supabase-js";
import { currentSchoolYear } from "@/lib/grade";

const admin = () =>
  createAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "인증 필요" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const pairId = searchParams.get("pairId");
  const effectiveGrade = parseInt(searchParams.get("effectiveGrade") ?? "0");
  if (!pairId) return NextResponse.json({ error: "pairId 필요" }, { status: 400 });

  // 이 pair의 숙제 전체
  const { data: homeworks } = await supabase
    .from("homeworks")
    .select("id, subject, is_completed, curriculum_meta")
    .eq("pair_id", pairId)
    .not("curriculum_meta", "is", null);

  // 해당 숙제의 검사 결과
  const hwIds = (homeworks ?? []).map((h) => h.id);
  let checkMap: Record<string, number> = {};
  if (hwIds.length) {
    const { data: checks } = await supabase
      .from("homework_checks")
      .select("homework_id, results")
      .in("homework_id", hwIds);
    for (const c of checks ?? []) {
      const score = (c.results as Record<string, unknown>)?.score;
      if (typeof score === "number") checkMap[c.homework_id] = score;
    }
  }

  // 과목·영역별 집계
  type AreaKey = string;
  type SubjectKey = string;
  const subjectMap: Record<SubjectKey, {
    total: number; completed: number; scores: number[];
    areas: Record<AreaKey, { total: number; completed: number; scores: number[] }>;
  }> = {};

  for (const hw of homeworks ?? []) {
    const meta = hw.curriculum_meta as { subject?: string; area?: string } | null;
    if (!meta?.subject) continue;
    const subj = meta.subject;
    const area = meta.area ?? "기타";
    if (!subjectMap[subj]) subjectMap[subj] = { total: 0, completed: 0, scores: [], areas: {} };
    if (!subjectMap[subj].areas[area]) subjectMap[subj].areas[area] = { total: 0, completed: 0, scores: [] };

    subjectMap[subj].total++;
    subjectMap[subj].areas[area].total++;
    if (hw.is_completed) {
      subjectMap[subj].completed++;
      subjectMap[subj].areas[area].completed++;
    }
    const score = checkMap[hw.id];
    if (score !== undefined) {
      subjectMap[subj].scores.push(score);
      subjectMap[subj].areas[area].scores.push(score);
    }
  }

  const subjects = Object.entries(subjectMap).map(([subject, d]) => ({
    subject,
    total: d.total,
    completed: d.completed,
    completionRate: d.total ? Math.round((d.completed / d.total) * 100) : 0,
    avgScore: d.scores.length ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : null,
    areas: Object.entries(d.areas).map(([area, a]) => ({
      area,
      total: a.total,
      completed: a.completed,
      completionRate: a.total ? Math.round((a.completed / a.total) * 100) : 0,
      avgScore: a.scores.length ? Math.round(a.scores.reduce((a, b) => a + b, 0) / a.scores.length) : null,
    })),
  }));

  // 동학년 평균 (service role)
  let peer: { subject: string; avgCompletionRate: number; avgScore: number | null }[] = [];
  if (effectiveGrade > 0) {
    const db = admin();
    const csYear = currentSchoolYear();

    // 같은 학년 자녀의 pair_id 목록
    const { data: childProfiles } = await db
      .from("user_profiles")
      .select("id, grade, grade_school_year")
      .eq("role", "child")
      .not("grade", "is", null);

    const sameGradePairIds: string[] = [];
    for (const cp of childProfiles ?? []) {
      const eff = (cp.grade ?? 0) + (csYear - (cp.grade_school_year ?? csYear));
      if (eff === effectiveGrade) {
        const { data: pairs } = await db
          .from("pairs")
          .select("id")
          .eq("child_id", cp.id);
        for (const p of pairs ?? []) sameGradePairIds.push(p.id);
      }
    }

    if (sameGradePairIds.length) {
      const { data: peerHws } = await db
        .from("homeworks")
        .select("id, subject, is_completed, curriculum_meta")
        .in("pair_id", sameGradePairIds)
        .not("curriculum_meta", "is", null);

      const peerHwIds = (peerHws ?? []).map((h) => h.id);
      let peerCheckMap: Record<string, number> = {};
      if (peerHwIds.length) {
        const { data: peerChecks } = await db
          .from("homework_checks")
          .select("homework_id, results")
          .in("homework_id", peerHwIds);
        for (const c of peerChecks ?? []) {
          const score = (c.results as Record<string, unknown>)?.score;
          if (typeof score === "number") peerCheckMap[c.homework_id] = score;
        }
      }

      const peerMap: Record<string, { total: number; completed: number; scores: number[] }> = {};
      for (const hw of peerHws ?? []) {
        const meta = hw.curriculum_meta as { subject?: string } | null;
        if (!meta?.subject) continue;
        const subj = meta.subject;
        if (!peerMap[subj]) peerMap[subj] = { total: 0, completed: 0, scores: [] };
        peerMap[subj].total++;
        if (hw.is_completed) peerMap[subj].completed++;
        const score = peerCheckMap[hw.id];
        if (score !== undefined) peerMap[subj].scores.push(score);
      }

      peer = Object.entries(peerMap).map(([subject, d]) => ({
        subject,
        avgCompletionRate: d.total ? Math.round((d.completed / d.total) * 100) : 0,
        avgScore: d.scores.length ? Math.round(d.scores.reduce((a, b) => a + b, 0) / d.scores.length) : null,
      }));
    }
  }

  return NextResponse.json({ subjects, peer });
}
