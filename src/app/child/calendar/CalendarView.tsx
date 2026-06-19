"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import DayDetail from "./DayDetail";
import Icon from "@/components/ui/Icon";

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
  year: number;
  month: number;
  homeworks: Homework[];
  childId: string;
  pairIds: string[];
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const SUBJECT_COLORS: Record<string, string> = {
  수학: "#4F46E5", 국어: "#E11D48", 영어: "#0891B2",
};

export default function CalendarView({ year: initYear, month: initMonth, homeworks: initHomeworks, childId, pairIds }: Props) {
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [homeworks, setHomeworks] = useState(initHomeworks);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  async function navigateMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }

    setLoading(true);
    setSelectedDate(null);
    const supabase = createClient();
    const from = `${newYear}-${String(newMonth).padStart(2, "0")}-01`;
    const lastDay = new Date(newYear, newMonth, 0).getDate();
    const to = `${newYear}-${String(newMonth).padStart(2, "0")}-${lastDay}`;

    const { data: hws } = await supabase
      .from("homeworks")
      .select("*")
      .in("pair_id", pairIds)
      .gte("due_date", from)
      .lte("due_date", to)
      .order("due_date");

    const hwIds = (hws ?? []).map((h: Homework) => h.id);
    let checkedIds = new Set<string>();
    if (hwIds.length) {
      const { data: checks } = await supabase
        .from("homework_checks")
        .select("homework_id")
        .in("homework_id", hwIds);
      checkedIds = new Set(checks?.map((c: { homework_id: string }) => c.homework_id) ?? []);
    }

    setHomeworks((hws ?? []).map((h: Homework) => ({ ...h, hasCheck: checkedIds.has(h.id) })));
    setYear(newYear);
    setMonth(newMonth);
    setLoading(false);
  }

  const countByDate: Record<string, { total: number; done: number }> = {};
  homeworks.forEach((h) => {
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
    setHomeworks((prev) => prev.map((h) => (h.id === id ? { ...h, is_completed: true } : h)));
  }

  const selectedHomeworks = selectedDate ? homeworks.filter((h) => h.due_date === selectedDate) : [];

  return (
    <div>
      {/* 월 네비게이터 */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 16, padding: "0 4px",
        }}
      >
        <button
          onClick={() => navigateMonth(-1)}
          disabled={loading}
          style={{
            width: 36, height: 36, borderRadius: 10, border: "none",
            background: "#fff", boxShadow: "var(--sh-sm)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", opacity: loading ? 0.5 : 1,
          }}
        >
          <Icon name="chevron-left" size={18} color="var(--text-soft)" stroke={2.2} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>
          {year}년 {MONTH_NAMES[month - 1]}
        </span>
        <button
          onClick={() => navigateMonth(1)}
          disabled={loading}
          style={{
            width: 36, height: 36, borderRadius: 10, border: "none",
            background: "#fff", boxShadow: "var(--sh-sm)",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", opacity: loading ? 0.5 : 1,
          }}
        >
          <Icon name="chevron-right" size={18} color="var(--text-soft)" stroke={2.2} />
        </button>
      </div>

      {/* 캘린더 카드 */}
      <div
        style={{
          background: "#fff", borderRadius: "var(--r-card)",
          boxShadow: "var(--sh-md)", padding: "14px 12px 16px",
          marginBottom: 14, opacity: loading ? 0.6 : 1, transition: "opacity .15s",
        }}
      >
        {/* 요일 헤더 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
          {DAY_LABELS.map((d, i) => (
            <div
              key={d}
              style={{
                textAlign: "center", fontSize: 12, fontWeight: 700, padding: "4px 0",
                color: i === 0 ? "#E11D48" : i === 6 ? "#4F46E5" : "var(--faint)",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 3 }}>
          {blanks.map((_, i) => <div key={`b${i}`} />)}
          {days.map((day) => {
            const dateStr = formatDate(day);
            const count = countByDate[dateStr];
            const isSelected = selectedDate === dateStr;
            const isToday = dateStr === todayStr;
            const allDone = count && count.done === count.total;
            const isPast = dateStr < todayStr;
            const weekday = new Date(dateStr + "T00:00:00").getDay();
            const isSun = weekday === 0;
            const isSat = weekday === 6;

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                style={{
                  position: "relative", display: "flex", flexDirection: "column",
                  alignItems: "center", paddingTop: 6, paddingBottom: 6,
                  borderRadius: 10, border: "none", cursor: "pointer",
                  background: isSelected
                    ? "var(--green-100)"
                    : isToday
                    ? "var(--green-50)"
                    : "transparent",
                  outline: isToday ? "2px solid var(--green-200)" : "none",
                  outlineOffset: -1,
                }}
              >
                <span
                  style={{
                    fontSize: 13.5, fontWeight: isToday ? 800 : 600,
                    color: isSelected
                      ? "var(--green-d)"
                      : isToday
                      ? "var(--green)"
                      : isSun
                      ? "#E11D48"
                      : isSat
                      ? "#4F46E5"
                      : isPast
                      ? "var(--faint)"
                      : "var(--text)",
                  }}
                >
                  {day}
                </span>
                {count ? (
                  <span
                    style={{
                      marginTop: 2, fontSize: 10, fontWeight: 800, whiteSpace: "nowrap",
                      color: allDone ? "var(--green-d)" : "var(--amber-d)",
                    }}
                  >
                    {allDone ? "✓" : `${count.done}/${count.total}`}
                  </span>
                ) : (
                  <span style={{ height: 14 }} />
                )}
                {/* 도트 */}
                {count && (
                  <span
                    style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: allDone ? "var(--green)" : "var(--amber)",
                      position: "absolute", bottom: 3,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 범례 */}
      <div style={{ display: "flex", gap: 14, padding: "0 4px", marginBottom: 16 }}>
        {[
          { color: "var(--green)", label: "완료" },
          { color: "var(--amber)", label: "미완료" },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "block" }} />
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* 숙제 등록 요청 */}
      <a
        href="/child/homework-request"
        style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          padding: "13px 0", borderRadius: 14,
          background: "#fff", border: "1.5px solid var(--green-200)",
          boxShadow: "var(--sh-sm)", textDecoration: "none", marginBottom: 16,
        }}
      >
        <Icon name="send" size={17} color="var(--green)" stroke={2.2} />
        <span style={{ fontSize: 14, fontWeight: 800, color: "var(--green-d)" }}>부모님께 숙제 등록 요청하기</span>
      </a>

      {/* 선택된 날짜 */}
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
