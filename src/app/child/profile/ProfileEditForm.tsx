"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { AVATARS, getAvatar } from "@/lib/avatars";
import { GRADES, currentSchoolYear, getEffectiveGrade, getGradeLabel } from "@/lib/grade";

interface Props {
  userId: string;
  displayName: string;
  avatarId: string | null;
  grade: number | null;
  gradeSchoolYear: number | null;
}

const AVATAR_CATEGORIES = [
  { key: "boy",    label: "남자아이" },
  { key: "girl",   label: "여자아이" },
  { key: "animal", label: "동물" },
] as const;

const SCHOOL_LEVELS = ["초등", "중등", "고등"] as const;

export default function ProfileEditForm({ userId, displayName, avatarId, grade, gradeSchoolYear }: Props) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [selectedAvatarId, setSelectedAvatarId] = useState(avatarId ?? "boy-medium");
  // 편집 시에는 현재 실효 학년을 기준점으로 표시
  const effectiveGrade = getEffectiveGrade(grade, gradeSchoolYear);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(effectiveGrade);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const current = getAvatar(selectedAvatarId);

  async function handleSave() {
    if (!name.trim() || !selectedGrade) return;
    setSaving(true);
    const supabase = createClient();
    await supabase.from("user_profiles").update({
      display_name: name.trim(),
      avatar_id: selectedAvatarId,
      grade: selectedGrade,
      grade_school_year: currentSchoolYear(),
    }).eq("id", userId);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      router.push("/child/dashboard");
      router.refresh();
    }, 800);
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 현재 선택 미리보기 */}
      <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center gap-2">
        <span className="text-7xl">{current.emoji}</span>
        <p className="text-lg font-bold">{name || "이름을 입력하세요"}</p>
        {selectedGrade && (
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
            {getGradeLabel(selectedGrade)}
          </span>
        )}
      </div>

      {/* 이름 입력 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <label className="text-sm text-gray-500 mb-2 block">이름</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 입력하세요"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:border-blue-400"
        />
      </div>

      {/* 학년 선택 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-gray-500 mb-3">학년</p>
        <div className="flex flex-col gap-3">
          {SCHOOL_LEVELS.map((level) => (
            <div key={level}>
              <p className="text-xs text-gray-400 font-semibold mb-2">{level}학교</p>
              <div className="grid grid-cols-3 gap-2">
                {GRADES.filter((g) => g.school === level).map((g) => (
                  <button
                    key={g.value}
                    onClick={() => setSelectedGrade(g.value)}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
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
      </div>

      {/* 아바타 선택 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-gray-500 mb-3">캐릭터 선택</p>
        {AVATAR_CATEGORIES.map(({ key, label }) => (
          <div key={key} className="mb-4">
            <p className="text-xs text-gray-400 font-semibold mb-2">{label}</p>
            <div className="flex flex-wrap gap-2">
              {AVATARS.filter((a) => a.category === key).map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatarId(avatar.id)}
                  className={`w-14 h-14 text-3xl rounded-2xl flex items-center justify-center transition-all border-2 ${
                    selectedAvatarId === avatar.id
                      ? "border-blue-500 bg-blue-50 scale-110 shadow-md"
                      : "border-gray-100 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  title={avatar.label}
                >
                  {avatar.emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={saving || !name.trim() || !selectedGrade}
        className="py-4 bg-blue-600 text-white rounded-2xl font-semibold text-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {saved ? "저장됨 ✓" : saving ? "저장 중..." : "저장하기"}
      </button>
    </div>
  );
}
