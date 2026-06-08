"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GRADES, currentSchoolYear } from "@/lib/grade";

interface Pair {
  id: string;
  invite_code: string;
  pair_name: string | null;
  child_id: string | null;
  childName: string | null;
  childAvatar: string | null;
  childGrade: string;
}

interface Props {
  parentId: string;
  pairs: Pair[];
}

const SCHOOL_LEVELS = ["초등", "중등", "고등"] as const;

export default function FamilyManager({ parentId, pairs: initialPairs }: Props) {
  const router = useRouter();
  const [pairs, setPairs] = useState(initialPairs);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [gradeEditingPairId, setGradeEditingPairId] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [gradeSaving, setGradeSaving] = useState(false);

  async function addChild() {
    setLoading(true);
    const res = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", parentId }),
    });
    const json = await res.json();
    if (json.pair) setPairs((prev) => [...prev, { ...json.pair, childName: null, childAvatar: null, childGrade: "" }]);
    setLoading(false);
  }

  async function removeChild(pairId: string) {
    if (!confirm("이 자녀와의 연결을 해제할까요?")) return;
    setLoading(true);
    await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "remove", pairId }),
    });
    setPairs((prev) => prev.filter((p) => p.id !== pairId));
    setLoading(false);
    router.refresh();
  }

  async function deletePair(pairId: string) {
    if (!confirm("초대 코드를 삭제할까요?")) return;
    setLoading(true);
    await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "delete", pairId }),
    });
    setPairs((prev) => prev.filter((p) => p.id !== pairId));
    setLoading(false);
  }

  function openGradeEdit(pairId: string) {
    setGradeEditingPairId(pairId);
    setSelectedGrade(null);
  }

  async function saveGrade(pairId: string, childId: string) {
    if (!selectedGrade) return;
    setGradeSaving(true);
    const gradeLabel = GRADES.find((g) => g.value === selectedGrade)?.label ?? "";
    await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "setGrade",
        childId,
        grade: selectedGrade,
        gradeSchoolYear: currentSchoolYear(),
      }),
    });
    setPairs((prev) =>
      prev.map((p) => p.id === pairId ? { ...p, childGrade: gradeLabel } : p)
    );
    setGradeEditingPairId(null);
    setSelectedGrade(null);
    setGradeSaving(false);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopied(code);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="flex flex-col gap-4">
      {pairs.length === 0 && (
        <div className="bg-white rounded-2xl p-6 text-center text-gray-400 shadow-sm">
          연결된 자녀가 없습니다.
        </div>
      )}

      {pairs.map((pair) => (
        <div key={pair.id} className="bg-white rounded-2xl shadow-sm p-4">
          {pair.child_id ? (
            <div className="flex flex-col gap-3">
              {/* 자녀 정보 행 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{pair.childAvatar ?? "🧒"}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{pair.childName ?? "자녀"}</p>
                      {pair.childGrade ? (
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                          {pair.childGrade}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-xs">
                          학년 미설정
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-green-500">연결됨</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openGradeEdit(pair.id)}
                    className="px-3 py-1.5 text-sm text-blue-500 border border-blue-200 rounded-lg hover:bg-blue-50"
                  >
                    학년 설정
                  </button>
                  <button
                    onClick={() => removeChild(pair.id)}
                    disabled={loading}
                    className="px-3 py-1.5 text-sm text-red-500 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    연결 해제
                  </button>
                </div>
              </div>

              {/* 학년 선택 패널 */}
              {gradeEditingPairId === pair.id && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-400 mb-3">학년을 선택하세요 (매년 3월 자동 승급)</p>
                  <div className="flex flex-col gap-2">
                    {SCHOOL_LEVELS.map((level) => (
                      <div key={level}>
                        <p className="text-xs text-gray-400 font-semibold mb-1.5">{level}학교</p>
                        <div className="grid grid-cols-6 gap-1.5">
                          {GRADES.filter((g) => g.school === level).map((g) => (
                            <button
                              key={g.value}
                              onClick={() => setSelectedGrade(g.value)}
                              className={`py-2 rounded-lg text-sm font-semibold border-2 transition-all ${
                                selectedGrade === g.value
                                  ? "border-green-500 bg-green-50 text-green-700"
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
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => saveGrade(pair.id, pair.child_id!)}
                      disabled={!selectedGrade || gradeSaving}
                      className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm font-semibold hover:bg-green-600 disabled:opacity-40"
                    >
                      {gradeSaving ? "저장 중..." : "저장"}
                    </button>
                    <button
                      onClick={() => { setGradeEditingPairId(null); setSelectedGrade(null); }}
                      className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-xs text-gray-400 mb-2">자녀 대기 중 — 초대 코드를 공유하세요</p>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-widest text-blue-600">{pair.invite_code}</span>
                <button
                  onClick={() => copyCode(pair.invite_code)}
                  className="px-2 py-1 text-xs border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {copied === pair.invite_code ? "복사됨!" : "복사"}
                </button>
                <button
                  onClick={() => deletePair(pair.id)}
                  disabled={loading}
                  className="ml-auto px-2 py-1 text-xs text-red-400 hover:text-red-600"
                >
                  삭제
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addChild}
        disabled={loading}
        className="flex items-center justify-center gap-2 py-4 border-2 border-dashed border-blue-300 rounded-2xl text-blue-500 hover:bg-blue-50 disabled:opacity-50"
      >
        <span className="text-xl">+</span>
        <span className="font-semibold">자녀 추가</span>
      </button>
    </div>
  );
}
