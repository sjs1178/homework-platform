"use client";

import { useState, useRef } from "react";
import type { CheckResult } from "@/lib/check-homework";

type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

interface Props {
  homeworkId: string;
  existingResult: CheckResult | null;
  existingScore: { score: number; total: number } | null;
}

export default function HomeworkCheckForm({ homeworkId, existingResult, existingScore }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<{ base64: string; mediaType: MediaType; preview: string }[]>([]);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(existingResult);
  const [score, setScore] = useState(existingScore);
  const [error, setError] = useState("");

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        const mediaType = file.type as MediaType;
        setImages((prev) => [...prev, { base64, mediaType, preview: dataUrl }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
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
      setImages([]);
    }
    setChecking(false);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 이미지 업로드 */}
      {!result && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm text-gray-500 mb-3">숙제 사진을 올려주세요 (여러 장 가능)</p>
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFileChange} className="hidden" />
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 hover:border-blue-400 hover:text-blue-500 text-sm"
          >
            📷 사진 추가
          </button>
          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative">
                  <img src={img.preview} className="w-full h-24 object-cover rounded-lg" alt="" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center"
                  >×</button>
                </div>
              ))}
            </div>
          )}
          {images.length > 0 && (
            <button
              onClick={handleCheck}
              disabled={checking}
              className="mt-3 w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50"
            >
              {checking ? "채점 중..." : `${images.length}장 채점하기`}
            </button>
          )}
          {error && <p className="text-red-500 text-sm text-center mt-2">{error}</p>}
        </div>
      )}

      {/* 채점 결과 — 부모: 정답 포함 전체 표시 */}
      {result && score && (
        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">점수</p>
              <p className="text-3xl font-bold text-blue-600">{score.score}<span className="text-lg text-gray-400">/{score.total}</span></p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{Math.round((score.score / score.total) * 100)}점</p>
              <p className="text-sm text-gray-400">{result.feedback}</p>
            </div>
          </div>

          {result.problems.map((p) => (
            <div key={p.number} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${p.isCorrect ? "border-green-400" : "border-red-400"}`}>
              <div className="flex items-start gap-2">
                <span className={`text-xl font-bold ${p.isCorrect ? "text-green-500" : "text-red-500"}`}>
                  {p.isCorrect ? "O" : "X"}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-700">{p.number}번. {p.question}</p>
                  <p className="text-sm text-gray-500 mt-1">학생 답: <span className="font-medium">{p.studentAnswer}</span></p>
                  {!p.isCorrect && (
                    <p className="text-sm text-blue-600 mt-0.5">정답: <span className="font-medium">{p.correctAnswer}</span></p>
                  )}
                  {p.explanation && (
                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 rounded-lg p-2">{p.explanation}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          <button
            onClick={() => { setResult(null); setScore(null); }}
            className="py-2 text-sm text-gray-400 hover:text-gray-600"
          >
            다시 채점하기
          </button>
        </div>
      )}
    </div>
  );
}
