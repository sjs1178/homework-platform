"use client";

import { useEffect, useState } from "react";

interface CheckResult {
  problem: string;
  correct: boolean;
  answer?: string;
}

interface HomeworkCheck {
  id: string;
  homework_id: string;
  pair_id: string;
  results: CheckResult[];
  score: number;
  total_problems: number;
  created_at: string;
  subject: string | null;
  description: string | null;
  due_date: string | null;
  parent_name: string | null;
  child_name: string | null;
}

export default function HomeworkChecksView() {
  const [checks, setChecks] = useState<HomeworkCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/homework-checks")
      .then((r) => r.json())
      .then((d) => { setChecks(d.checks ?? []); setLoading(false); });
  }, []);

  const filtered = checks.filter((c) =>
    c.subject?.toLowerCase().includes(search.toLowerCase()) ||
    c.child_name?.toLowerCase().includes(search.toLowerCase()) ||
    c.parent_name?.toLowerCase().includes(search.toLowerCase())
  );

  const avgScore = checks.length > 0
    ? Math.round(checks.reduce((acc, c) => acc + (c.total_problems > 0 ? c.score / c.total_problems * 100 : 0), 0) / checks.length)
    : 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0F172A" }}>숙제 검사 데이터</h1>
          <p style={{ fontSize: 13, color: "#64748B", marginTop: 4 }}>
            전체 {checks.length}건 · 평균 정답률 {avgScore}%
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="과목·자녀·부모 이름 검색..."
          style={{
            width: 220, height: 38, borderRadius: 8,
            border: "1.5px solid #E2E8F0", padding: "0 12px",
            fontSize: 13, color: "#0F172A", outline: "none",
          }}
        />
      </div>

      {loading ? (
        <p style={{ color: "#94A3B8" }}>불러오는 중...</p>
      ) : (
        <div style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                {["검사일시", "과목", "설명", "마감일", "점수", "정답률", "자녀", "부모"].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontSize: 11.5, fontWeight: 700, color: "#64748B", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => {
                const isLast = i === filtered.length - 1;
                const isOpen = expanded === c.id;
                const pct = c.total_problems > 0 ? Math.round(c.score / c.total_problems * 100) : 0;
                return (
                  <>
                    <tr
                      key={c.id}
                      onClick={() => setExpanded(isOpen ? null : c.id)}
                      style={{
                        borderBottom: isOpen || !isLast ? "1px solid #F1F5F9" : "none",
                        cursor: "pointer",
                        background: isOpen ? "#F8FAFF" : undefined,
                      }}
                    >
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>
                        <span style={{ marginRight: 5, fontSize: 10, color: "#94A3B8" }}>{isOpen ? "▼" : "▶"}</span>
                        {fmtDatetime(c.created_at)}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <SubjectBadge subject={c.subject ?? "—"} />
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#334155", maxWidth: 200 }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {c.description ?? "—"}
                        </div>
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 12, color: "#64748B", whiteSpace: "nowrap" }}>
                        {c.due_date ?? "—"}
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 13, fontWeight: 700, color: "#0F172A" }}>
                        {c.score} / {c.total_problems}
                      </td>
                      <td style={{ padding: "11px 14px" }}>
                        <ScoreBadge pct={pct} />
                      </td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#334155" }}>{c.child_name ?? "—"}</td>
                      <td style={{ padding: "11px 14px", fontSize: 13, color: "#334155" }}>{c.parent_name ?? "—"}</td>
                    </tr>

                    {isOpen && (
                      <tr key={c.id + "-detail"} style={{ borderBottom: isLast ? "none" : "1px solid #F1F5F9", background: "#F8FAFF" }}>
                        <td colSpan={8} style={{ padding: "14px 24px 18px 32px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, auto)", gap: "8px 40px", marginBottom: 14 }}>
                            <DetailItem label="검사 ID" value={c.id} mono />
                            <DetailItem label="숙제 ID" value={c.homework_id} mono />
                            <DetailItem label="페어 ID" value={c.pair_id} mono />
                          </div>
                          {Array.isArray(c.results) && c.results.length > 0 && (
                            <div>
                              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                                문항별 결과
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                                {c.results.map((r, idx) => (
                                  <div
                                    key={idx}
                                    style={{
                                      display: "flex", alignItems: "flex-start", gap: 10,
                                      padding: "6px 10px", borderRadius: 6,
                                      background: r.correct ? "#F0FDF4" : "#FFF1F2",
                                      border: `1px solid ${r.correct ? "#BBF7D0" : "#FECDD3"}`,
                                    }}
                                  >
                                    <span style={{ fontWeight: 700, fontSize: 12, color: r.correct ? "#15803D" : "#BE123C", width: 20 }}>
                                      {r.correct ? "○" : "✕"}
                                    </span>
                                    <span style={{ fontSize: 12, color: "#334155", flex: 1 }}>{r.problem}</span>
                                    {r.answer && (
                                      <span style={{ fontSize: 11, color: "#64748B" }}>답: {r.answer}</span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
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

function ScoreBadge({ pct }: { pct: number }) {
  const [bg, color] =
    pct >= 80 ? ["#DCFCE7", "#15803D"] :
    pct >= 60 ? ["#FEF9C3", "#A16207"] :
    ["#FEE2E2", "#B91C1C"];
  return (
    <span style={{ fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 999, background: bg, color }}>
      {pct}%
    </span>
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

function fmtDatetime(d: string) {
  return new Date(d).toLocaleString("ko-KR", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit",
  });
}
