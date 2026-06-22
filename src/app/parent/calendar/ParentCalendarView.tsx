"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { toKSTDateString } from "@/lib/date";
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
  childName?: string | null;
}

interface Props {
  year: number;
  month: number;
  homeworks: Homework[];
}

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const MONTH_NAMES = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
const SUBJECT_COLORS: Record<string, [string, string]> = {
  수학: ["#EEF2FF", "#4F46E5"],
  국어: ["#FEF2F2", "#E11D48"],
  영어: ["#ECFEFF", "#0891B2"],
};

export default function ParentCalendarView({ year: initYear, month: initMonth, homeworks: initHomeworks }: Props) {
  const [year, setYear] = useState(initYear);
  const [month, setMonth] = useState(initMonth);
  const [homeworks, setHomeworks] = useState(initHomeworks);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(toKSTDateString());
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [detailHw, setDetailHw] = useState<Homework | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenuOpenId(null), []);

  useEffect(() => {
    if (!menuOpenId) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu();
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpenId, closeMenu]);

  async function handleDelete(hwId: string) {
    if (!confirm("이 숙제를 삭제할까요? 연결된 모든 계정에서 사라져요.")) return;
    setDeleting(hwId);
    closeMenu();
    await fetch("/api/parent/homework-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ homeworkId: hwId }),
    });
    setHomeworks((prev) => prev.filter((h) => h.id !== hwId));
    setDeleting(null);
  }

  const todayStr = toKSTDateString();
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();

  async function navigateMonth(delta: number) {
    let newMonth = month + delta;
    let newYear = year;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    if (newMonth < 1) { newMonth = 12; newYear--; }

    setLoading(true);
    setSelectedDate(null);

    const res = await fetch(`/api/parent/calendar-homework?year=${newYear}&month=${newMonth}`);
    const json = await res.json();

    setHomeworks(json.homeworks ?? []);
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

  const selectedHomeworks = selectedDate ? homeworks.filter((h) => h.due_date === selectedDate) : [];

  const dateLabel = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("ko-KR", {
        month: "long", day: "numeric", weekday: "short",
      })
    : "";

  return (
    <div>
      {/* 월 네비게이터 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "0 4px" }}>
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
      <div style={{
        background: "#fff", borderRadius: "var(--r-card)",
        boxShadow: "var(--sh-md)", padding: "14px 12px 16px",
        marginBottom: 14, opacity: loading ? 0.6 : 1, transition: "opacity .15s",
      }}>
        {/* 요일 헤더 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
          {DAY_LABELS.map((d, i) => (
            <div key={d} style={{
              textAlign: "center", fontSize: 12, fontWeight: 700, padding: "4px 0",
              color: i === 0 ? "#E11D48" : i === 6 ? "#4F46E5" : "var(--faint)",
            }}>
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
                  background: isSelected ? "var(--green-100)" : isToday ? "var(--green-50)" : "transparent",
                  outline: isToday ? "2px solid var(--green-200)" : "none",
                  outlineOffset: -1,
                }}
              >
                <span style={{
                  fontSize: 13.5, fontWeight: isToday ? 800 : 600,
                  color: isSelected ? "var(--green-d)" : isToday ? "var(--green)"
                    : isSun ? "#E11D48" : isSat ? "#4F46E5"
                    : isPast ? "var(--faint)" : "var(--text)",
                }}>
                  {day}
                </span>
                {count ? (
                  <span style={{ marginTop: 2, fontSize: 10, fontWeight: 800, whiteSpace: "nowrap", color: allDone ? "var(--green-d)" : "var(--amber-d)" }}>
                    {allDone ? "✓" : `${count.done}/${count.total}`}
                  </span>
                ) : (
                  <span style={{ height: 14 }} />
                )}
                {count && (
                  <span style={{
                    width: 5, height: 5, borderRadius: "50%",
                    background: allDone ? "var(--green)" : "var(--amber)",
                    position: "absolute", bottom: 3,
                  }} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 범례 */}
      <div style={{ display: "flex", gap: 14, padding: "0 4px", marginBottom: 16 }}>
        {[{ color: "var(--green)", label: "완료" }, { color: "var(--amber)", label: "미완료" }].map(({ color, label }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "block" }} />
            <span style={{ fontSize: 12, color: "var(--muted)", fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>

      {/* 선택된 날짜 상세 */}
      {/* 숙제 상세 팝업 */}
      {detailHw && (() => {
        const [dBg, dColor] = SUBJECT_COLORS[detailHw.subject] ?? ["var(--green-50)", "var(--green-d)"];
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
                {detailHw.childName && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="user" size={15} color="var(--muted)" stroke={2} />
                    <span style={{ fontWeight: 600 }}>{detailHw.childName}</span>
                  </div>
                )}
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
              {!detailHw.is_completed && (
                <a
                  href={`/parent/homework/check?id=${detailHw.id}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", height: 48, borderRadius: 14, border: "none",
                    background: "var(--green)", color: "#fff",
                    fontWeight: 800, fontSize: 14, cursor: "pointer",
                    boxShadow: "var(--sh-green)", marginTop: 18, textDecoration: "none",
                  }}
                >
                  <Icon name="clipboard-check" size={18} color="#fff" stroke={2} />
                  완료 / 검사
                </a>
              )}
              {detailHw.is_completed && (
                <a
                  href={`/parent/homework/check?id=${detailHw.id}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", height: 48, borderRadius: 14, border: "none",
                    background: "var(--green-100)", color: "var(--green-d)",
                    fontWeight: 800, fontSize: 14, cursor: "pointer",
                    marginTop: 18, textDecoration: "none",
                  }}
                >
                  <Icon name="sparkles" size={18} color="var(--green-d)" stroke={2} />
                  {detailHw.hasCheck ? "채점 결과 보기" : "검사하기"}
                </a>
              )}
            </div>
          </div>
        );
      })()}

      {selectedDate && (
        <div style={{ background: "#fff", borderRadius: "var(--r-card)", boxShadow: "var(--sh-md)", overflow: "hidden" }}>
          <div style={{
            padding: "13px 16px 11px", borderBottom: "1px solid var(--line)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="calendar" size={16} color="var(--green)" stroke={2} />
              <span style={{ fontSize: 14, fontWeight: 800, color: "var(--text)" }}>{dateLabel}</span>
            </div>
            {selectedHomeworks.length > 0 && (
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: selectedHomeworks.filter(h => h.is_completed).length === selectedHomeworks.length ? "var(--green-d)" : "var(--amber-d)",
                background: selectedHomeworks.filter(h => h.is_completed).length === selectedHomeworks.length ? "var(--green-100)" : "var(--amber-100)",
                padding: "3px 9px", borderRadius: 999,
              }}>
                {selectedHomeworks.filter(h => h.is_completed).length}/{selectedHomeworks.length} 완료
              </span>
            )}
          </div>

          {selectedHomeworks.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎉</div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--muted)" }}>이날은 숙제가 없어요!</p>
            </div>
          ) : (
            <div style={{ padding: "10px 14px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedHomeworks.map((hw) => {
                const [subjectBg, subjectColor] = SUBJECT_COLORS[hw.subject] ?? ["var(--green-50)", "var(--green-d)"];
                const isDeleting = deleting === hw.id;
                return (
                  <div key={hw.id} style={{
                    borderRadius: 16,
                    border: `1.5px solid ${hw.is_completed ? "var(--green-200)" : "var(--line)"}`,
                    background: hw.is_completed ? "var(--green-50)" : "#FAFAF8",
                    padding: "13px 13px",
                    display: "flex", alignItems: "flex-start", gap: 12,
                    opacity: isDeleting ? 0.4 : 1, transition: "opacity .2s",
                    position: "relative",
                  }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0, marginTop: 1,
                      background: hw.is_completed ? "var(--green)" : "var(--line-strong)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {hw.is_completed && <Icon name="check" size={16} color="#fff" stroke={3} />}
                    </span>

                    <div
                      style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                      onClick={() => setDetailHw(hw)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 5 }}>
                        <span style={{
                          fontSize: 11.5, fontWeight: 800, padding: "2px 8px", borderRadius: 7,
                          background: subjectBg, color: subjectColor, whiteSpace: "nowrap", flexShrink: 0,
                        }}>
                          {hw.subject}
                        </span>
                        {hw.childName && (
                          <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--muted)", whiteSpace: "nowrap", flexShrink: 0 }}>
                            {hw.childName}
                          </span>
                        )}
                        {hw.due_time && (
                          <span style={{ fontSize: 11.5, color: "var(--faint)", fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0 }}>
                            {hw.due_time.slice(0, 5)}
                          </span>
                        )}
                        {hw.reward_amount > 0 && (
                          <span style={{ fontSize: 11.5, fontWeight: 800, color: "var(--amber-d)", whiteSpace: "nowrap", marginLeft: "auto", flexShrink: 0 }}>
                            +{hw.reward_amount}
                          </span>
                        )}
                      </div>
                      <div style={{
                        fontSize: 15, fontWeight: 700, color: "var(--text)",
                        textDecoration: hw.is_completed ? "line-through" : "none",
                        opacity: hw.is_completed ? 0.5 : 1, lineHeight: 1.4,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {hw.description}
                      </div>
                      {hw.is_completed && hw.hasCheck && (
                        <a href={`/parent/homework/check?id=${hw.id}`} style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          marginTop: 6, fontSize: 12.5, fontWeight: 700,
                          color: "var(--green-d)", textDecoration: "none",
                        }}>
                          <Icon name="sparkles" size={13} color="var(--green-d)" stroke={2} />
                          채점 결과 보기
                        </a>
                      )}
                      {hw.is_completed && !hw.hasCheck && (
                        <a href={`/parent/homework/check?id=${hw.id}`} style={{
                          display: "inline-flex", alignItems: "center", gap: 4,
                          marginTop: 6, fontSize: 12.5, fontWeight: 700,
                          color: "var(--green)", textDecoration: "none",
                        }}>
                          <Icon name="clipboard-check" size={13} color="var(--green)" stroke={2} />
                          검사하기
                        </a>
                      )}
                    </div>

                    {/* 미완료 숙제 더보기 메뉴 */}
                    {!hw.is_completed && (
                      <div style={{ position: "relative", flexShrink: 0, marginTop: 1 }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setMenuOpenId(menuOpenId === hw.id ? null : hw.id); }}
                          style={{
                            width: 30, height: 30, borderRadius: 8, border: "none",
                            background: menuOpenId === hw.id ? "var(--green-100)" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            cursor: "pointer", padding: 0,
                          }}
                        >
                          <Icon name="more-vertical" size={16} color="var(--muted)" stroke={2} />
                        </button>
                        {menuOpenId === hw.id && (
                          <div
                            ref={menuRef}
                            style={{
                              position: "absolute", right: 0, top: 34, zIndex: 50,
                              background: "#fff", borderRadius: 14, boxShadow: "0 8px 30px rgba(0,0,0,.15)",
                              border: "1px solid var(--line)", overflow: "hidden",
                              minWidth: 150, animation: "fadeIn .12s ease",
                            }}
                          >
                            <a
                              href={`/parent/homework/check?id=${hw.id}`}
                              onClick={closeMenu}
                              style={{
                                display: "flex", alignItems: "center", gap: 10,
                                padding: "13px 16px", fontSize: 14, fontWeight: 700,
                                color: "var(--green-d)", textDecoration: "none",
                                borderBottom: "1px solid var(--line)",
                              }}
                            >
                              <Icon name="clipboard-check" size={17} color="var(--green)" stroke={2} />
                              완료 / 검사
                            </a>
                            <button
                              onClick={() => handleDelete(hw.id)}
                              style={{
                                display: "flex", alignItems: "center", gap: 10, width: "100%",
                                padding: "13px 16px", fontSize: 14, fontWeight: 700,
                                color: "#E11D48", background: "none", border: "none",
                                cursor: "pointer", textAlign: "left",
                              }}
                            >
                              <Icon name="trash-2" size={17} color="#E11D48" stroke={2} />
                              삭제
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
