"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";

interface TodayHomework {
  id: string;
  subject: string;
  description: string;
  due_date: string;
  due_time: string | null;
  is_completed: boolean;
  hasCheck: boolean;
  childName: string;
}

const SUBJECT_MAP: Record<string, [string, string]> = {
  수학: ["#EEF2FF", "#4F46E5"],
  국어: ["#FEF2F2", "#E11D48"],
  영어: ["#ECFEFF", "#0891B2"],
};

interface Props {
  homeworks: TodayHomework[];
  multiChild: boolean;
}

export default function TodayHomeworkList({ homeworks: init, multiChild }: Props) {
  const [homeworks, setHomeworks] = useState(init);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [detailHw, setDetailHw] = useState<TodayHomework | null>(null);
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

  return (
    <>
      {/* 헤더 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          margin: "22px 4px 11px",
        }}
      >
        <h2 style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>
          오늘의 숙제
        </h2>
        {homeworks.length > 0 && (
          <span
            style={{
              background: homeworks.every((h) => h.hasCheck) ? "var(--green-100)" : "var(--amber-100)",
              color: homeworks.every((h) => h.hasCheck) ? "var(--green-d)" : "var(--amber-d)",
              padding: "3px 10px",
              borderRadius: 999,
              fontSize: 12.5,
              fontWeight: 700,
              whiteSpace: "nowrap",
            }}
          >
            {homeworks.filter((h) => h.hasCheck).length}/{homeworks.length} 검사완료
          </span>
        )}
      </div>

      {homeworks.length === 0 ? (
        <div
          style={{
            background: "#fff",
            borderRadius: "var(--r-card)",
            padding: "32px 16px",
            boxShadow: "var(--sh-sm)",
            textAlign: "center",
          }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: 20, background: "#E9F4EC",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 12px",
          }}>
            <Icon name="clipboard-check" size={34} color="#9DB3A6" stroke={1.9} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 800, color: "var(--text)", margin: "0 0 4px" }}>검사할 숙제가 없어요</p>
          <p style={{ fontSize: 12.5, color: "var(--faint)", margin: "0 0 14px", fontWeight: 600 }}>숙제를 입력하면 여기서 확인할 수 있어요</p>
          <Link
            href="/parent/homework/new"
            style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "10px 20px", borderRadius: 12,
              background: "var(--green)", color: "#fff",
              fontSize: 13, fontWeight: 800, textDecoration: "none",
            }}
          >
            <Icon name="plus" size={15} stroke={2.5} color="#fff" />
            숙제 입력하기
          </Link>
        </div>
      ) : (
        homeworks.map((hw) => {
          const statusIcon = hw.hasCheck ? "circle-check" : hw.is_completed ? "clipboard-check" : "clock";
          const statusColor = hw.hasCheck ? "var(--green)" : hw.is_completed ? "var(--amber)" : "var(--faint)";
          const statusBg = hw.hasCheck ? "var(--green-50)" : hw.is_completed ? "var(--amber-100)" : "#F5F5F4";
          const borderColor = hw.hasCheck ? "var(--green-200)" : hw.is_completed ? "var(--amber-200)" : "var(--line)";
          const [subBg, subColor] = SUBJECT_MAP[hw.subject] ?? ["var(--green-50)", "var(--green-d)"];
          const isDeleting = deleting === hw.id;

          return (
            <div
              key={hw.id}
              onClick={() => setDetailHw(hw)}
              style={{
                background: "#fff",
                borderRadius: "var(--r-card)",
                padding: 15,
                marginBottom: 12,
                border: `1.5px solid ${borderColor}`,
                boxShadow: "var(--sh-md)",
                opacity: isDeleting ? 0.4 : 1,
                transition: "opacity .2s",
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", gap: 13 }}>
                <span
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 13,
                    background: statusBg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon name={statusIcon} size={19} color={statusColor} stroke={2} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 8, marginBottom: 4, alignItems: "center", overflow: "hidden" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", fontWeight: 700,
                      fontSize: 12, padding: "4px 9px", borderRadius: 8,
                      background: subBg, color: subColor, whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                      {hw.subject}
                    </span>
                    {multiChild && (
                      <span style={{ fontSize: 11.5, fontWeight: 700, color: "var(--green-d)", background: "var(--green-50)", padding: "2px 7px", borderRadius: 6 }}>
                        {hw.childName}
                      </span>
                    )}
                    {hw.due_time && (
                      <span style={{ fontSize: 12, color: "var(--faint)", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {hw.due_time.slice(0, 5)}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {hw.description}
                  </div>
                </div>

                {/* 미완료 숙제 더보기 메뉴 */}
                {!hw.is_completed && (
                  <div style={{ position: "relative", flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === hw.id ? null : hw.id)}
                      style={{
                        width: 34, height: 34, borderRadius: 10, border: "none",
                        background: menuOpenId === hw.id ? "var(--green-100)" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        cursor: "pointer", padding: 0,
                      }}
                    >
                      <Icon name="more-vertical" size={17} color="var(--muted)" stroke={2} />
                    </button>
                    {menuOpenId === hw.id && (
                      <div
                        ref={menuRef}
                        style={{
                          position: "absolute", right: 0, top: 38, zIndex: 50,
                          background: "#fff", borderRadius: 14, boxShadow: "0 8px 30px rgba(0,0,0,.15)",
                          border: "1px solid var(--line)", overflow: "hidden",
                          minWidth: 150,
                        }}
                      >
                        <Link
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
                        </Link>
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

              <div
                style={{
                  marginTop: 10, fontSize: 12.5, fontWeight: 700, display: "flex",
                  alignItems: "center", gap: 6, justifyContent: "space-between",
                }}
              >
                <span style={{ color: hw.hasCheck ? "var(--green-d)" : hw.is_completed ? "var(--amber-d)" : "var(--faint)" }}>
                  {hw.hasCheck ? "검사 완료" : hw.is_completed ? "완료 · 검사 대기" : "미완료"}
                </span>
                <Icon name="chevron-right" size={14} color="var(--faint)" stroke={2} />
              </div>
            </div>
          );
        })
      )}

      {/* 숙제 상세 팝업 */}
      {detailHw && (() => {
        const [dBg, dColor] = SUBJECT_MAP[detailHw.subject] ?? ["var(--green-50)", "var(--green-d)"];
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
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontSize: 13, fontWeight: 800, padding: "3px 10px", borderRadius: 8,
                    background: dBg, color: dColor,
                  }}>
                    {detailHw.subject}
                  </span>
                  {multiChild && (
                    <span style={{ fontSize: 12, fontWeight: 700, color: "var(--green-d)", background: "var(--green-50)", padding: "2px 8px", borderRadius: 6 }}>
                      {detailHw.childName}
                    </span>
                  )}
                </div>
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
                    {detailHw.hasCheck ? "검사 완료" : detailHw.is_completed ? "완료 (검사 대기)" : "미완료"}
                  </span>
                </div>
              </div>

              {detailHw.hasCheck ? (
                <Link
                  href={`/parent/homework/check?id=${detailHw.id}`}
                  onClick={() => setDetailHw(null)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", height: 48, borderRadius: 14, border: "none",
                    background: "var(--green-100)", color: "var(--green-d)",
                    fontWeight: 800, fontSize: 14, cursor: "pointer",
                    marginTop: 18, textDecoration: "none",
                  }}
                >
                  <Icon name="sparkles" size={18} color="var(--green-d)" stroke={2} />
                  검사 결과 보기
                </Link>
              ) : detailHw.is_completed ? (
                <Link
                  href={`/parent/homework/check?id=${detailHw.id}`}
                  onClick={() => setDetailHw(null)}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    width: "100%", height: 48, borderRadius: 14, border: "none",
                    background: "var(--green)", color: "#fff",
                    fontWeight: 800, fontSize: 14, cursor: "pointer",
                    boxShadow: "var(--sh-green)", marginTop: 18, textDecoration: "none",
                  }}
                >
                  지금 검사하기
                  <Icon name="arrow-right" size={16} stroke={2.4} color="#fff" />
                </Link>
              ) : (
                <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
                  <Link
                    href={`/parent/homework/check?id=${detailHw.id}`}
                    onClick={() => setDetailHw(null)}
                    style={{
                      flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      height: 48, borderRadius: 14, border: "none",
                      background: "var(--green)", color: "#fff",
                      fontWeight: 800, fontSize: 14, cursor: "pointer",
                      boxShadow: "var(--sh-green)", textDecoration: "none",
                    }}
                  >
                    <Icon name="clipboard-check" size={17} color="#fff" stroke={2} />
                    완료 / 검사
                  </Link>
                  <button
                    onClick={() => { setDetailHw(null); handleDelete(detailHw.id); }}
                    style={{
                      height: 48, padding: "0 16px", borderRadius: 14,
                      border: "1.5px solid #FECDD3", background: "#FFF1F2",
                      color: "#E11D48", fontWeight: 800, fontSize: 14, cursor: "pointer",
                    }}
                  >
                    <Icon name="trash-2" size={17} color="#E11D48" stroke={2} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </>
  );
}
