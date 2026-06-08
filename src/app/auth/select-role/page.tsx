"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { GRADES, currentSchoolYear } from "@/lib/grade";

const SCHOOL_LEVELS = ["초등", "중등", "고등"] as const;

export default function SelectRolePage() {
  const router = useRouter();
  const [step, setStep] = useState<"role" | "grade">("role");
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleParent() {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_profiles").upsert({
      id: user.id,
      role: "parent",
      display_name: user.user_metadata.full_name ?? user.email,
    });
    router.push("/parent/dashboard");
  }

  async function handleChildGradeSave() {
    if (!selectedGrade) return;
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("user_profiles").upsert({
      id: user.id,
      role: "child",
      display_name: user.user_metadata.full_name ?? user.email,
      grade: selectedGrade,
      grade_school_year: currentSchoolYear(),
    });
    router.push("/child/dashboard");
  }

  if (step === "grade") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <button
            onClick={() => setStep("role")}
            className="text-gray-400 hover:text-gray-600 mb-6 text-sm"
          >
            ← 뒤로
          </button>
          <h2 className="text-2xl font-bold mb-1">학년을 선택해주세요</h2>
          <p className="text-sm text-gray-400 mb-6">매년 3월에 자동으로 올라가요</p>

          <div className="flex flex-col gap-4">
            {SCHOOL_LEVELS.map((level) => (
              <div key={level}>
                <p className="text-xs font-semibold text-gray-400 mb-2">{level}학교</p>
                <div className="grid grid-cols-3 gap-2">
                  {GRADES.filter((g) => g.school === level).map((g) => (
                    <button
                      key={g.value}
                      onClick={() => setSelectedGrade(g.value)}
                      className={`py-3 rounded-xl text-base font-semibold border-2 transition-all ${
                        selectedGrade === g.value
                          ? "border-green-500 bg-green-50 text-green-700 scale-105"
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleChildGradeSave}
            disabled={!selectedGrade || loading}
            className="mt-8 w-full py-4 bg-green-500 text-white rounded-2xl font-semibold text-lg hover:bg-green-600 disabled:opacity-40"
          >
            {loading ? "저장 중..." : "완료"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h2 className="text-2xl font-bold">역할을 선택해주세요</h2>
      <div className="flex gap-4">
        <button
          onClick={handleParent}
          disabled={loading}
          className="w-40 h-40 flex flex-col items-center justify-center gap-3 border-2 border-blue-400 rounded-2xl hover:bg-blue-50 transition-colors disabled:opacity-50"
        >
          <span className="text-4xl">👨‍👩‍👧</span>
          <span className="text-lg font-semibold text-blue-600">부모</span>
          <span className="text-xs text-gray-400">숙제를 등록해요</span>
        </button>
        <button
          onClick={() => setStep("grade")}
          disabled={loading}
          className="w-40 h-40 flex flex-col items-center justify-center gap-3 border-2 border-green-400 rounded-2xl hover:bg-green-50 transition-colors disabled:opacity-50"
        >
          <span className="text-4xl">🧒</span>
          <span className="text-lg font-semibold text-green-600">자녀</span>
          <span className="text-xs text-gray-400">숙제를 완료해요</span>
        </button>
      </div>
    </main>
  );
}
