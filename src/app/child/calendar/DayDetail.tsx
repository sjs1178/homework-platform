"use client";

import { useState } from "react";

interface Homework {
  id: string;
  subject: string;
  description: string;
  due_date: string;
  due_time: string | null;
  is_completed: boolean;
  reward_amount: number;
  hasCheck?: boolean;
}

interface Props {
  date: string;
  homeworks: Homework[];
  childId: string;
  onComplete: (id: string) => void;
}

export default function DayDetail({ date, homeworks, childId, onComplete }: Props) {
  const [completing, setCompleting] = useState<string | null>(null);
  const [toast, setToast] = useState("");

  const label = new Date(date + "T00:00:00").toLocaleDateString("ko-KR", {
    month: "long", day: "numeric", weekday: "short",
  });

  async function handleComplete(hw: Homework) {
    if (hw.is_completed || completing) return;
    setCompleting(hw.id);

    const res = await fetch("/api/complete-homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeworkId: hw.id, childId }),
    });

    if (res.ok) {
      onComplete(hw.id);
      setToast(hw.reward_amount > 0 ? `🎉 완료! 리워드 ${hw.reward_amount} 적립!` : "🎉 완료!");
      setTimeout(() => setToast(""), 3000);
    }
    setCompleting(null);
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <p className="text-sm font-semibold text-gray-500 mb-3">{label}</p>
      {homeworks.length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-4">숙제가 없어요 🎉</p>
      ) : (
        <div className="flex flex-col gap-3">
          {homeworks.map((hw) => (
            <div
              key={hw.id}
              className={`flex items-center gap-3 p-3 rounded-xl border ${
                hw.is_completed ? "bg-green-50 border-green-200" : "border-gray-100"
              }`}
            >
              <div className="flex-1">
                <span className="text-xs font-semibold text-blue-500 mr-2">{hw.subject}</span>
                <span className={`text-sm ${hw.is_completed ? "line-through text-gray-400" : ""}`}>
                  {hw.description}
                </span>
                {hw.due_time && (
                  <p className="text-xs text-gray-400 mt-0.5">{hw.due_time.slice(0, 5)}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1">
                {hw.is_completed ? (
                  <>
                    <span className="text-green-500 text-sm font-semibold">완료✓</span>
                    {hw.hasCheck && (
                      <a
                        href={`/child/results?id=${hw.id}`}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        결과보기 →
                      </a>
                    )}
                  </>
                ) : (
                  <button
                    onClick={() => handleComplete(hw)}
                    disabled={completing === hw.id}
                    className="px-3 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-semibold hover:bg-blue-600 disabled:opacity-50"
                  >
                    {completing === hw.id ? "..." : "완료"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-5 py-3 rounded-full text-sm font-semibold shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}
