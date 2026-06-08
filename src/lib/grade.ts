export interface GradeInfo {
  value: number;  // 1~12
  label: string;  // "초1" ~ "고3"
  school: "초등" | "중등" | "고등";
}

export const GRADES: GradeInfo[] = [
  { value: 1,  label: "초1", school: "초등" },
  { value: 2,  label: "초2", school: "초등" },
  { value: 3,  label: "초3", school: "초등" },
  { value: 4,  label: "초4", school: "초등" },
  { value: 5,  label: "초5", school: "초등" },
  { value: 6,  label: "초6", school: "초등" },
  { value: 7,  label: "중1", school: "중등" },
  { value: 8,  label: "중2", school: "중등" },
  { value: 9,  label: "중3", school: "중등" },
  { value: 10, label: "고1", school: "고등" },
  { value: 11, label: "고2", school: "고등" },
  { value: 12, label: "고3", school: "고등" },
];

export function getGradeLabel(grade: number | null | undefined): string {
  if (!grade) return "";
  return GRADES.find((g) => g.value === grade)?.label ?? "";
}

// 한국 학년도: 3월 기준으로 연도 계산
export function currentSchoolYear(): number {
  const now = new Date();
  return now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
}

// grade_school_year 기준으로 현재 학년 자동 계산
export function getEffectiveGrade(
  grade: number | null | undefined,
  gradeSchoolYear: number | null | undefined
): number | null {
  if (!grade || !gradeSchoolYear) return null;
  const diff = currentSchoolYear() - gradeSchoolYear;
  const effective = grade + diff;
  return Math.min(effective, 12); // 고3 초과 방지
}

export function getEffectiveGradeLabel(
  grade: number | null | undefined,
  gradeSchoolYear: number | null | undefined
): string {
  const effective = getEffectiveGrade(grade, gradeSchoolYear);
  return getGradeLabel(effective);
}
