"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import { toKSTDateString } from "@/lib/date";

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
  onUncomplete: (id: string) => void;
}

const SUBJECT_COLORS: Record<string, [string, string]> = {
  수학: ["#EEF2FF", "#4F46E5"],
  국어: ["#FEF2F2", "#E11D48"],
  영어: ["#ECFEFF", "#0891B2"],
};

export default function DayDetail({ date, homeworks, childId, onComplete, onUncomplete }: Props) {
  const [completing, setCompleting] = useState<string | null>(null);
  const [toast, setToast] = useState("");
  const [detailHw, setDetailHw] = useState<Homework | null>(null);

  const todayStr = toKSTDateString();
  const isToday = date === todayStr;

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
      setDetailHw(null);
      setToast(hw.reward_amount > 0 ? `완료! +${hw.reward_amount} 적립!` : "완료!");
      setTimeout(() => setToast(""), 3000);
    }
    setCompleting(null);
  }

  async function handleUncomplete(hw: Homework) {
    if (!hw.is_completed || completing) return;
    setCompleting(hw.id);

    const res = await fetch("/api/uncomplete-homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeworkId: hw.id }),
    });

    if (res.ok) {
      onUncomplete(hw.id);
      setDetailHw(null);
      setToast("완료가 취소되었어요");
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
                onClick={() => setDetailHw(hw)}
                style={{
                  borderRadius: 16,
                  border: `1.5px solid ${hw.is_completed ? "var(--green-200)" : "var(--line)"}`,
                  background: hw.is_completed ? "var(--green-50)" : "#FAFAF8",
                  padding: "13px 13px",
                  display: "flex", alignItems: "flex-start", gap: 12,
                  cursor: "pointer",
                }}
              >
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
                        flexShrink: 0,
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
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >
                    {hw.description}
                  </div>
                </div>

                <span style={{ flexShrink: 0, marginTop: 6 }}>
                  <Icon name="chevron-right" size={16} color="var(--faint)" stroke={2} />
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* 상세 팝업 */}
      {detailHw && (() => {
        const [dBg, dColor] = SUBJECT_COLORS[detailHw.subject] ?? ["var(--green-50)", "var(--green-d)"];
        const canUncomplete = isToday && detailHw.is_completed;
        return (
          <div
            style={{
              position: "fixed", inset: 0, zIndex: 1000,
              background: "rgba(0,0,0,.45)", display: "flex",
              alignItems: "center", justifyContent: "center", padding: 20,
            }}
            onClick={() => setDetailHw(null)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#fff", borderRadius: 24, padding: "24px 22px 22px",
                width: "100%", maxWidth: 360, boxShadow: "var(--sh-md)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <span style={{
                  fontSize: 13, fontWeight: 800, padding: "3px 10px", borderRadius: 8,
                  background: dBg, color: dColor,
                }}>
                  {detailHw.subject}
                </span>
                <button onClick={() => setDetailHw(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                  <Icon name="x" size={20} color="var(--muted)" stroke={2} />
                </button>
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", lineHeight: 1.6, marginBottom: 16, wordBreak: "break-word" }}>
                {detailHw.description}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13.5, color: "var(--text-soft)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="calendar" size={15} color="var(--muted)" stroke={2} />
                  <span style={{ fontWeight: 600 }}>
                    {detailHw.due_date}{detailHw.due_time ? ` ${detailHw.due_time.slice(0, 5)}` : ""}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="check-circle" size={15} color={detailHw.is_completed ? "var(--green)" : "var(--faint)"} stroke={2} />
                  <span style={{ fontWeight: 700, color: detailHw.is_completed ? "var(--green-d)" : "var(--muted)" }}>
                    {detailHw.is_completed ? "완료" : "미완료"}
                  </span>
                </div>
                {detailHw.reward_amount > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="star" size={15} color="var(--amber-d)" stroke={0} fill="var(--amber-d)" />
                    <span style={{ fontWeight: 800, color: "var(--amber-d)" }}>+{detailHw.reward_amount}</span>
                  </div>
                )}
              </div>

              {detailHw.is_completed && detailHw.hasCheck && (
                <a
                  href={`/child/results?id=${detailHw.id}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", height: 48, borderRadius: 14, border: "none",
                    background: "var(--green-100)", color: "var(--green-d)",
                    fontWeight: 800, fontSize: 14, cursor: "pointer",
                    marginTop: 18, textDecoration: "none",
                  }}
                >
                  <Icon name="sparkles" size={18} color="var(--green-d)" stroke={2} />
                  채점 결과 보기
                </a>
              )}

              {!detailHw.is_completed && (
                <button
                  onClick={() => handleComplete(detailHw)}
                  disabled={completing === detailHw.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", height: 48, borderRadius: 14, border: "none",
                    background: "var(--green)", color: "#fff",
                    fontWeight: 800, fontSize: 14, cursor: "pointer",
                    boxShadow: "var(--sh-green)", marginTop: 18,
                    opacity: completing === detailHw.id ? 0.6 : 1,
                  }}
                >
                  <Icon name="check-circle" size={18} color="#fff" stroke={2} />
                  {completing === detailHw.id ? "처리 중..." : "완료하기"}
                </button>
              )}

              {canUncomplete && (
                <button
                  onClick={() => handleUncomplete(detailHw)}
                  disabled={completing === detailHw.id}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", height: 48, borderRadius: 14,
                    border: "1.5px solid var(--line-strong)", background: "#fff",
                    color: "var(--muted)",
                    fontWeight: 800, fontSize: 14, cursor: "pointer",
                    marginTop: detailHw.hasCheck ? 10 : 18,
                    opacity: completing === detailHw.id ? 0.6 : 1,
                  }}
                >
                  <Icon name="rotate-ccw" size={16} color="var(--muted)" stroke={2} />
                  {completing === detailHw.id ? "처리 중..." : "완료 취소하기"}
                </button>
              )}
            </div>
          </div>
        );
      })()}

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
