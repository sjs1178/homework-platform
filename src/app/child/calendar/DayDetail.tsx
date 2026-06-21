"use client";

import { useState } from "react";
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
  date: string;
  homeworks: Homework[];
  childId: string;
  onComplete: (id: string) => void;
}

const SUBJECT_COLORS: Record<string, [string, string]> = {
  수학: ["#EEF2FF", "#4F46E5"],
  국어: ["#FEF2F2", "#E11D48"],
  영어: ["#ECFEFF", "#0891B2"],
};

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
      setToast(hw.reward_amount > 0 ? `🎉 완료! +${hw.reward_amount} 적립!` : "🎉 완료!");
      setTimeout(() => setToast(""), 3000);
    }
    setCompleting(null);
  }

  const doneCount = homeworks.filter((h) => h.is_completed).length;

  return (
    <div
      style={{
        background: "#fff", borderRadius: "var(--r-card)",
        boxShadow: "var(--sh-md)", overflow: "hidden",
      }}
    >
      {/* 날짜 헤더 */}
      <div
        style={{
          padding: "13px 16px 11px",
          borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Icon name="calendar" size={16} color="var(--green)" stroke={2} />
          <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{label}</span>
        </div>
        {homeworks.length > 0 && (
          <span
            style={{
              fontSize: 12, fontWeight: 700,
              color: doneCount === homeworks.length ? "var(--green-d)" : "var(--amber-d)",
              background: doneCount === homeworks.length ? "var(--green-100)" : "var(--amber-100)",
              padding: "3px 9px", borderRadius: 999,
            }}
          >
            {doneCount}/{homeworks.length} 완료
          </span>
        )}
      </div>

      {homeworks.length === 0 ? (
        <div style={{ padding: "32px 16px", textAlign: "center" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
          <p style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>이날은 숙제가 없어요!</p>
        </div>
      ) : (
        <div style={{ padding: "10px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
          {homeworks.map((hw) => {
            const [subjectBg, subjectColor] = SUBJECT_COLORS[hw.subject] ?? ["var(--green-50)", "var(--green-d)"];
            return (
              <div
                key={hw.id}
                style={{
                  borderRadius: 16,
                  border: `1.5px solid ${hw.is_completed ? "var(--green-200)" : "var(--line)"}`,
                  background: hw.is_completed ? "var(--green-50)" : "#FAFAF8",
                  padding: "13px 13px",
                  display: "flex", alignItems: "flex-start", gap: 12,
                }}
              >
                {/* 완료 체크 */}
                <span
                  style={{
                    width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                    background: hw.is_completed ? "var(--green)" : "var(--line-strong)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {hw.is_completed && <Icon name="check" size={16} color="#fff" stroke={3} />}
                </span>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5, overflow: "hidden" }}>
                    <span
                      style={{
                        fontSize: 11.5, fontWeight: 800, padding: "2px 8px", borderRadius: 7,
                        background: subjectBg, color: subjectColor, whiteSpace: "nowrap",
                        overflow: "hidden", textOverflow: "ellipsis", minWidth: 0,
                      }}
                    >
                      {hw.subject}
                    </span>
                    {hw.due_time && (
                      <span style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {hw.due_time.slice(0, 5)}
                      </span>
                    )}
                    {hw.reward_amount > 0 && (
                      <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--amber-d)", whiteSpace: "nowrap", marginLeft: "auto" }}>
                        +{hw.reward_amount}
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: 15, fontWeight: 700, color: "var(--text)",
                      textDecoration: hw.is_completed ? "line-through" : "none",
                      opacity: hw.is_completed ? 0.5 : 1, lineHeight: 1.4,
                    }}
                  >
                    {hw.description}
                  </div>

                  {/* 결과 보기 링크 */}
                  {hw.is_completed && hw.hasCheck && (
                    <a
                      href={`/child/results?id=${hw.id}`}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        marginTop: 6, fontSize: 12.5, fontWeight: 700,
                        color: "var(--green-d)", textDecoration: "none",
                      }}
                    >
                      <Icon name="sparkles" size={13} color="var(--green-d)" stroke={2} />
                      채점 결과 보기
                    </a>
                  )}
                </div>

                {/* 완료 버튼 */}
                {!hw.is_completed && (
                  <button
                    onClick={() => handleComplete(hw)}
                    disabled={completing === hw.id}
                    style={{
                      height: 38, padding: "0 14px", borderRadius: 11, border: "none",
                      background: "var(--green)", color: "#fff",
                      fontWeight: 800, fontSize: 13.5, cursor: "pointer",
                      boxShadow: "0 4px 10px -4px rgba(22,163,74,.6)",
                      opacity: completing === hw.id ? 0.6 : 1, flexShrink: 0,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {completing === hw.id ? "..." : "완료"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div
          style={{
            position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
            background: "var(--text)", color: "#fff",
            padding: "12px 20px", borderRadius: 999,
            fontSize: 13.5, fontWeight: 700, boxShadow: "var(--sh-md)",
            whiteSpace: "nowrap", zIndex: 100,
          }}
        >
          {toast}
        </div>
      )}
    </div>
  );
}
