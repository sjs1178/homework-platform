"use client";

import { useState, useRef } from "react";
import type { CheckResult, Problem } from "@/lib/check-homework";

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

interface Props {
  homeworkId: string;
  checkId: string | null;
  existingResult: CheckResult | null;
  existingScore: { score: number; total: number } | null;
  isReviewed: boolean;
}

interface EditState {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string;
}

export default function HomeworkCheckForm({
  homeworkId, checkId: initialCheckId, existingResult, existingScore, isReviewed: initialReviewed
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<{ base64: string; mediaType: MediaType; preview: string }[]>([]);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(existingResult);
  const [score, setScore] = useState(existingScore);
  const [checkId, setCheckId] = useState<string | null>(initialCheckId);
  const [isReviewed, setIsReviewed] = useState(initialReviewed);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Record<number, EditState>>({});
  const [savedMsg, setSavedMsg] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        setImages((prev) => [...prev, {
          base64: dataUrl.split(",")[1],
          mediaType: file.type as MediaType,
          preview: dataUrl,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  async function handleCheck() {
    if (!images.length) return;
    setChecking(true);
    setError("");

    const res = await fetch("/api/check-homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        homeworkId,
        images: images.map(({ base64, mediaType }) => ({ base64, mediaType })),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError("채점 중 오류가 발생했어요.");
    } else {
      setResult(json.result);
      setScore({ score: json.result.score, total: json.result.total });
      setCheckId(json.checkId ?? null);
      setImages([]);
      setEditing({});
      setIsReviewed(false);
    }
    setChecking(false);
  }

  function startEdit(p: Problem) {
    setEditing((prev) => ({
      ...prev,
      [p.number]: {
        isCorrect: p.isCorrect,
        correctAnswer: p.correctAnswer ?? "",
        explanation: p.explanation ?? "",
      },
    }));
  }

  function cancelEdit(num: number) {
    setEditing((prev) => { const n = { ...prev }; delete n[num]; return n; });
  }

  async function saveCorrections() {
    if (!result || !checkId) return;
    const editedNums = Object.keys(editing).map(Number);
    if (!editedNums.length) return;

    setSaving(true);
    const corrections = editedNums.map((num) => {
      const orig = result.problems.find((p) => p.number === num)!;
      const edit = editing[num];
      return {
        problemNumber: num,
        subject: result.subject,
        question: orig.question,
        studentAnswer: orig.studentAnswer,
        aiIsCorrect: orig.isCorrect,
        aiCorrectAnswer: orig.correctAnswer ?? "",
        aiExplanation: orig.explanation ?? null,
        correctedIsCorrect: edit.isCorrect,
        correctedCorrectAnswer: edit.correctAnswer,
        correctedExplanation: edit.explanation,
      };
    });

    const res = await fetch("/api/correct-homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ checkId, corrections }),
    });

    if (res.ok) {
      // 로컬 result 업데이트
      const updatedProblems = result.problems.map((p) => {
        const edit = editing[p.number];
        if (!edit) return p;
        return { ...p, isCorrect: edit.isCorrect, correctAnswer: edit.correctAnswer, explanation: edit.explanation || null };
      });
      const newScore = updatedProblems.filter((p) => p.isCorrect).length;
      setResult({ ...result, problems: updatedProblems, score: newScore });
      setScore({ score: newScore, total: result.total });
      setEditing({});
      setIsReviewed(true);
      setSavedMsg("수정 내용이 저장됐습니다 ✓");
      setTimeout(() => setSavedMsg(""), 3000);
    }
    setSaving(false);
  }

  const hasEdits = Object.keys(editing).length > 0;

  return (
    <div className="flex flex-col gap-4">
      {!result && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-3">숙제 사진을 올려주세요 (여러 장 가능)</p>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          <button onClick={() => fileRef.current?.click()} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-500 text-sm">
            📷 사진 추가
          </button>
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img.preview} className="w-full h-24 object-cover rounded-lg" alt="" />
                  <button onClick={() => setImages((p) => p.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">×</button>
                </div>
              ))}
            </div>
          )}
          {images.length > 0 && (
            <button onClick={handleCheck} disabled={checking} className="mt-3 w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50">
              {checking ? "채점 중..." : `${images.length}장 채점하기`}
            </button>
          )}
          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
        </div>
      )}

      {result && score && (
        <div className="flex flex-col gap-3">
          {/* 점수 헤더 */}
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">점수</p>
              <p className="text-3xl font-bold text-blue-600">{score.score}<span className="text-lg text-gray-400">/{score.total}</span></p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{Math.round((score.score / score.total) * 100)}점</p>
              {isReviewed && <span className="text-xs text-green-500 font-semibold">✓ 검토 완료</span>}
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">{result.feedback}</p>

          {/* 문제별 카드 */}
          {result.problems.map((p) => {
            const ed = editing[p.number];
            return (
              <div key={p.number} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${(ed ? ed.isCorrect : p.isCorrect) ? "border-green-400" : "border-red-400"}`}>
                <div className="flex items-start gap-2">
                  <span className={`text-xl font-bold ${(ed ? ed.isCorrect : p.isCorrect) ? "text-green-500" : "text-red-500"}`}>
                    {(ed ? ed.isCorrect : p.isCorrect) ? "O" : "X"}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-gray-700">{p.number}번. {p.question}</p>
                      {!ed && (
                        <button onClick={() => startEdit(p)} className="text-xs text-blue-400 hover:text-blue-600 ml-2 flex-shrink-0">수정</button>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">학생 답: <span className="font-medium">{p.studentAnswer}</span></p>

                    {!ed ? (
                      <>
                        {!p.isCorrect && <p className="text-sm text-blue-600 mt-0.5">정답: <span className="font-medium">{p.correctAnswer}</span></p>}
                        {p.explanation && <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2">{p.explanation}</p>}
                      </>
                    ) : (
                      // 편집 모드
                      <div className="mt-2 flex flex-col gap-2 bg-yellow-50 rounded-xl p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditing((prev) => ({ ...prev, [p.number]: { ...ed, isCorrect: true } }))}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-bold border-2 ${ed.isCorrect ? "bg-green-500 text-white border-green-500" : "border-gray-200 text-gray-400"}`}
                          >O (정답)</button>
                          <button
                            onClick={() => setEditing((prev) => ({ ...prev, [p.number]: { ...ed, isCorrect: false } }))}
                            className={`flex-1 py-1.5 rounded-lg text-sm font-bold border-2 ${!ed.isCorrect ? "bg-red-500 text-white border-red-500" : "border-gray-200 text-gray-400"}`}
                          >X (오답)</button>
                        </div>
                        <input
                          value={ed.correctAnswer}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [p.number]: { ...ed, correctAnswer: e.target.value } }))}
                          placeholder="정답"
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                        />
                        <textarea
                          value={ed.explanation}
                          onChange={(e) => setEditing((prev) => ({ ...prev, [p.number]: { ...ed, explanation: e.target.value } }))}
                          placeholder="풀이 설명 (틀린 경우)"
                          rows={2}
                          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none"
                        />
                        <button onClick={() => cancelEdit(p.number)} className="text-xs text-gray-400 text-right">취소</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 저장 버튼 */}
          {hasEdits && (
            <button
              onClick={saveCorrections}
              disabled={saving}
              className="py-3 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50"
            >
              {saving ? "저장 중..." : "수정 내용 저장하기"}
            </button>
          )}

          {savedMsg && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-5 py-3 rounded-full text-sm font-semibold shadow-lg">
              {savedMsg}
            </div>
          )}

          <button onClick={() => { setResult(null); setScore(null); setEditing({}); }} className="py-2 text-sm text-gray-400 hover:text-gray-600 text-center">
            다시 채점하기
          </button>
        </div>
      )}
    </div>
  );
}
