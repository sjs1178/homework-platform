"use client";

import { useEffect, useState } from "react";

interface Homework {
  id: string;
  pair_id: string;
  subject: string;
  description: string;
  due_date: string;
  due_time: string | null;
  reward_amount: number;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  pair_name: string | null;
  parent_name: string | null;
  child_name: string | null;
}

export default function HomeworksView() {
  const [homeworks, setHomeworks] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "completed" | "pending">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/homeworks")
      .then((r) => r.json())
      .then((d) => { setHomeworks(d.homeworks ?? []); setLoading(false); });
  }, []);

  const filtered = homeworks.filter((h) => {
    const matchSearch =
      h.subject?.toLowerCase().includes(search.toLowerCase()) ||
      h.description?.toLowerCase().includes(search.toLowerCase()) ||
      h.parent_name?.toLowerCase().includes(search.toLowerCase()) ||
      h.child_name?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "completed" && h.is_completed) ||
      (filter === "pending" && !h.is_completed);
    return matchSearch && matchFilter;
  });

  const completedCount = homeworks.filter((h) => h.is_completed).length;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>숙제 등록 데이터</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
            전체 {homeworks.length}건 · 완료 {completedCount}건 · 미완료 {homeworks.length - completedCount}건
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <FilterBtn label="전체" value="all" current={filter} onClick={setFilter} />
          <FilterBtn label="완료" value="completed" current={filter} onClick={setFilter} />
          <FilterBtn label="미완료" value="pending" current={filter} onClick={setFilter} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="과목·설명·이름 검색..."
            style={{
              width: 200, height: 34, borderRadius: 8,
              border: "1.5px solid #E2E8F0", padding: "0 12px",
              fontSize: 13, color: "#0F172A", outline: "none",
            }}
          />
        </div>
      </div>

      {loading ? (
        <p style={{ color: "#94A3B8" }}>불러오는 중...</p>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["등록일", "과목", "설명", "마감일", "완료", "리워드", "부모", "자녀"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#64748B", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((hw, i) => {
                const isLast = i === filtered.length - 1;
                const isOpen = expanded === hw.id;
                return (
                  <>
                    <tr
                      key={hw.id}
                      onClick={() => setExpanded(isOpen ? null : hw.id)}
                      style={{
                        borderBottom: isOpen || !isLast ? "1px solid #F1F5F9" : "none",
                        cursor: "pointer",
                        background: isOpen ? "#F8FAFF" : undefined,
                        opacity: hw.is_completed ? 0.7 : 1,
                      }}
                    >
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>
                        <span style={{ marginRight: 5, fontSize: 10, color: "#94A3B8" }}>{isOpen ? "▼" : "▶"}</span>
                        {fmtDate(hw.created_at)}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <SubjectBadge subject={hw.subject} />
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#334155", maxWidth: 220 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {hw.description}
                        </div>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>
                        {hw.due_date}{hw.due_time ? ` ${hw.due_time.slice(0, 5)}` : ""}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <span style={{
                          fontSize: 11.5, fontWeight: 700, padding: "2px 8px", borderRadius: 999,
                          background: hw.is_completed ? "#DCFCE7" : "#FEF9C3",
                          color: hw.is_completed ? "#15803D" : "#A16207",
                        }}>
                          {hw.is_completed ? "완료" : "미완료"}
                        </span>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748B" }}>
                        {hw.reward_amount > 0 ? hw.reward_amount : "—"}
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#334155" }}>{hw.parent_name ?? "—"}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#334155" }}>{hw.child_name ?? "—"}</td>
                    </tr>

                    {isOpen && (
                      <tr key={hw.id + "-detail"} style={{ borderBottom: isLast ? "none" : "1px solid #F1F5F9", background: "#F8FAFF" }}>
                        <td colSpan={8} style={{ padding: "12px 24px 16px 32px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "8px 40px" }}>
                            <DetailItem label="숙제 ID" value={hw.id} mono />
                            <DetailItem label="페어 ID" value={hw.pair_id} mono />
                            <DetailItem label="완료 일시" value={hw.completed_at ? fmtDatetime(hw.completed_at) : "—"} />
                          </div>
                          <div style={{ marginTop: 10, fontSize: 12.5, color: "#334155" }}>
                            <span style={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", marginRight: 8 }}>전체 설명</span>
                            {hw.description}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ padding: "32px", textAlign: "center", color: "#94A3B8", fontSize: 13 }}>
                    데이터가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FilterBtn({ label, value, current, onClick }: {
  label: string; value: string; current: string; onClick: (v: "all" | "completed" | "pending") => void;
}) {
  const active = current === value;
  return (
    <button
      onClick={() => onClick(value as "all" | "completed" | "pending")}
      style={{
        height: 34, padding: "0 14px", borderRadius: 8, fontSize: 12.5, fontWeight: 700,
        border: active ? "1.5px solid #3B82F6" : "1.5px solid #E2E8F0",
        background: active ? "#EFF6FF" : "#fff",
        color: active ? "#1D4ED8" : "#64748B",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

function SubjectBadge({ subject }: { subject: string }) {
  const colors: Record<string, [string, string]> = {
    수학: ["#EDE9FE", "#5B21B6"],
    국어: ["#FEE2E2", "#B91C1C"],
    영어: ["#DBEAFE", "#1D4ED8"],
    과학: ["#D1FAE5", "#065F46"],
    사회: ["#FEF3C7", "#92400E"],
  };
  const [bg, fg] = colors[subject] ?? ["#F1F5F9", "#475569"];
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: bg, color: fg, whiteSpace: "nowrap" }}>
      {subject}
    </span>
  );
}

function DetailItem({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</div>
      <div style={{ fontSize: 12, color: "#334155", fontFamily: mono ? "monospace" : undefined, wordBreak: "break-all" }}>{value}</div>
    </div>
  );
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit" });
}

function fmtDatetime(d: string) {
  return new Date(d).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}
