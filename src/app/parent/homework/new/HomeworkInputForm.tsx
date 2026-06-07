"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { HomeworkItem, SubjectRule } from "@/lib/types";

interface Props {
  pairId: string;
  rules: SubjectRule[];
}

export default function HomeworkInputForm({ pairId, rules }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parsed, setParsed] = useState<HomeworkItem[] | null>(null);
  const [error, setError] = useState("");

  async function handleParse() {
    if (!text.trim()) return;
    setParsing(true);
    setError("");
    setParsed(null);

    const res = await fetch("/api/parse-homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, rules }),
    });
    const json = await res.json();

    if (!res.ok || !json.items?.length) {
      setError("숙제를 찾지 못했어요. 다시 입력해보세요.");
    } else {
      setParsed(json.items);
    }
    setParsing(false);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setError("");
    setParsed(null);

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      const mediaType = file.type as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

      const res = await fetch("/api/parse-homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mediaType, rules }),
      });
      const json = await res.json();

      if (!res.ok || !json.items?.length) {
        setError("이미지에서 숙제를 찾지 못했어요.");
      } else {
        setParsed(json.items);
      }
      setParsing(false);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!parsed?.length) return;
    setSaving(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const insertRows = parsed.map((item) => ({
      pair_id: pairId,
      subject: item.subject,
      description: item.description,
      due_date: item.dueDate,
      due_time: item.dueTime ?? null,
      end_time: item.endTime ?? null,
      reward_amount: 0,
      created_by: user.id,
    }));

    await supabase.from("homeworks").insert(insertRows);

    setSaving(false);
    router.push("/parent/dashboard");
  }

  function updateItem(index: number, field: keyof HomeworkItem, value: string) {
    if (!parsed) return;
    const updated = [...parsed];
    updated[index] = { ...updated[index], [field]: value };
    setParsed(updated);
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 텍스트 입력 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-gray-500 mb-2">자연어로 입력하세요</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"수학 학습지 내일까지\n영어학원 숙제 목요일 오후 7시"}
          rows={4}
          className="w-full border border-gray-200 rounded-lg p-3 text-sm focus:outline-none focus:border-blue-400 resize-none"
        />
        <button
          onClick={handleParse}
          disabled={!text.trim() || parsing}
          className="mt-2 w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-semibold"
        >
          {parsing ? "분석 중..." : "AI로 분석하기"}
        </button>
      </div>

      {/* 이미지 입력 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-gray-500 mb-2">또는 숙제 사진을 업로드하세요</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={parsing}
          className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-blue-400 hover:text-blue-500 disabled:opacity-50 text-sm"
        >
          {parsing ? "분석 중..." : "📷 사진 선택"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm text-center">{error}</p>}

      {/* 파싱 결과 */}
      {parsed && parsed.length > 0 && (
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">분석 결과 ({parsed.length}개) — 수정 후 저장하세요</p>
          <div className="flex flex-col gap-3">
            {parsed.map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    value={item.subject}
                    onChange={(e) => updateItem(i, "subject", e.target.value)}
                    className="w-24 border border-gray-200 rounded px-2 py-1 text-sm font-semibold text-blue-600"
                  />
                  <input
                    value={item.description}
                    onChange={(e) => updateItem(i, "description", e.target.value)}
                    className="flex-1 border border-gray-200 rounded px-2 py-1 text-sm"
                  />
                </div>
                <div className="flex gap-2 text-xs text-gray-500">
                  <input
                    type="date"
                    value={item.dueDate}
                    onChange={(e) => updateItem(i, "dueDate", e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1"
                  />
                  <input
                    type="time"
                    value={item.dueTime ?? ""}
                    onChange={(e) => updateItem(i, "dueTime", e.target.value)}
                    className="border border-gray-200 rounded px-2 py-1"
                    placeholder="시간(선택)"
                  />
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-semibold"
          >
            {saving ? "저장 중..." : "저장하기"}
          </button>
        </div>
      )}
    </div>
  );
}
