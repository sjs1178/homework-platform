"use client";

import { useState } from "react";
import DayDetail from "./DayDetail";

interface Homework {
  id: string;
  subject: string;
  description: string;
  due_date: string;
  due_time: string | null;
  is_completed: boolean;
  reward_amount: number;
}

interface Props {
  year: number;
  month: number;
  homeworks: Homework[];
  childId: string;
}

export default function CalendarView({ year, month, homeworks, childId }: Props) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [localHomeworks, setLocalHomeworks] = useState(homeworks);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  const countByDate: Record<string, { total: number; done: number }> = {};
  localHomeworks.forEach((h) => {
    if (!countByDate[h.due_date]) countByDate[h.due_date] = { total: 0, done: 0 };
    countByDate[h.due_date].total++;
    if (h.is_completed) countByDate[h.due_date].done++;
  });

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay });

  function formatDate(day: number) {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function handleComplete(id: string) {
    setLocalHomeworks((prev) =>
      prev.map((h) => (h.id === id ? { ...h, is_completed: true } : h))
    );
  }

  const selectedHomeworks = selectedDate
    ? localHomeworks.filter((h) => h.due_date === selectedDate)
    : [];

  return (
    <div>
      {/* 캘린더 그리드 */}
      <div className="bg-white rounded-2xl shadow-sm p-4 mb-4">
        <div className="grid grid-cols-7 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map((d) => (
            <div key={d} className="text-center text-xs text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {blanks.map((_, i) => <div key={`b${i}`} />)}
          {days.map((day) => {
            const dateStr = formatDate(day);
            const count = countByDate[dateStr];
            const isSelected = selectedDate === dateStr;
            const allDone = count && count.done === count.total;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                className={`relative flex flex-col items-center py-2 rounded-xl transition-colors ${
                  isSelected ? "bg-blue-100" : "hover:bg-gray-50"
                }`}
              >
                <span className="text-sm">{day}</span>
                {count && (
                  <span className={`text-xs mt-0.5 font-bold ${allDone ? "text-green-500" : "text-blue-500"}`}>
                    {allDone ? "✓" : `${count.done}/${count.total}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 선택된 날짜 상세 */}
      {selectedDate && (
        <DayDetail
          date={selectedDate}
          homeworks={selectedHomeworks}
          childId={childId}
          onComplete={handleComplete}
        />
      )}
    </div>
  );
}
