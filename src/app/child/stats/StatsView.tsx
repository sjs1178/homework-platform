"use client";

import { useEffect, useState } from "react";
import { CAREERS, CareerPath } from "@/lib/careers";
import Icon from "@/components/ui/Icon";

interface AreaStat {
  area: string;
  total: number;
  completed: number;
  completionRate: number;
  avgScore: number | null;
}

interface SubjectStat {
  subject: string;
  total: number;
  completed: number;
  completionRate: number;
  avgScore: number | null;
  areas: AreaStat[];
}

interface PeerStat {
  subject: string;
  avgCompletionRate: number;
  avgScore: number | null;
}

interface Props {
  pairId: string;
  effectiveGrade: number;
  gradeLabel: string;
  childName: string;
}

function RateBar({ value, peer }: { value: number; peer?: number }) {
  return (
    <div style={{ position: "relative", height: 8, background: "var(--line)", borderRadius: 999, overflow: "visible", marginTop: 4 }}>
      <div style={{ height: 8, background: "var(--green)", borderRadius: 999, width: `${value}%` }} />
      {peer !== undefined && (
        <div
          style={{
            position: "absolute", top: "50%", transform: "translateY(-50%)",
            width: 2, height: 16, background: "var(--amber)", borderRadius: 2,
            left: `${peer}%`,
          }}
          title={`동학년 평균 ${peer}%`}
        />
      )}
    </div>
  );
}

function GapBadge({ rate, importance }: { rate: number | null; importance: string }) {
  if (rate === null) return <span style={{ fontSize: 11, color: "var(--faint)" }}>데이터 없음</span>;
  if (rate >= 80) return <span style={{ fontSize: 11, fontWeight: 700, color: "var(--green-d)" }}>잘 하고 있어요</span>;
  if (importance === "필수") return <span style={{ fontSize: 11, fontWeight: 700, color: "var(--red)" }}>더 집중 필요</span>;
  return <span style={{ fontSize: 11, fontWeight: 700, color: "var(--amber-d)" }}>조금 더 해봐요</span>;
}

const IMPORTANCE_STYLE: Record<string, [string, string]> = {
  "필수": ["var(--red-50)", "var(--red)"],
  "중요": ["var(--amber-100)", "var(--amber-d)"],
};

export default function StatsView({ pairId, effectiveGrade, gradeLabel, childName }: Props) {
  const [tab, setTab] = useState<"stats" | "career">("stats");
  const [subjects, setSubjects] = useState<SubjectStat[]>([]);
  const [peer, setPeer] = useState<PeerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selectedCareer, setSelectedCareer] = useState<CareerPath | null>(null);

  useEffect(() => {
    fetch(`/api/stats?pairId=${pairId}&effectiveGrade=${effectiveGrade}`)
      .then((r) => r.json())
      .then((d) => {
        setSubjects(d.subjects ?? []);
        setPeer(d.peer ?? []);
        setLoading(false);
      });
  }, [pairId, effectiveGrade]);

  function getPeer(subject: string) {
    return peer.find((p) => p.subject === subject);
  }

  function getMyRate(subject: string): number | null {
    const s = subjects.find((s) => s.subject === subject);
    return s ? s.completionRate : null;
  }

  const SUBJECT_EMOJI: Record<string, string> = {
    국어: "📖", 수학: "🔢", 영어: "🌏", 과학: "🔬", 사회: "🌍",
    도덕: "💛", 역사: "📜", 음악: "🎵", 미술: "🎨", 체육: "⚽",
    정보: "💻", 실과: "🔧",
  };

  // ─── 과목별 현황 ──────────────────────────────────────
  const statsTab = (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {loading && (
        <div style={{ background: "#fff", borderRadius: "var(--r-card)", padding: 32, textAlign: "center", color: "var(--faint)", boxShadow: "var(--sh-sm)" }}>
          분석 중...
        </div>
      )}

      {!loading && subjects.length === 0 && (
        <div style={{ background: "#fff", borderRadius: "var(--r-card)", padding: 32, textAlign: "center", boxShadow: "var(--sh-sm)" }}>
          <div style={{
            width: 88, height: 88, borderRadius: 26, background: "#E9F4EC",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <Icon name="bar-chart-3" size={46} color="#9DB3A6" stroke={1.9} />
          </div>
          <p style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>아직 데이터가 없어요</p>
          <p style={{ fontSize: 13.5, color: "var(--faint)", marginTop: 4 }}>숙제를 완료하면 통계가 쌓여요</p>
        </div>
      )}

      {subjects.map((s) => {
        const peerData = getPeer(s.subject);
        const isOpen = expanded === s.subject;
        return (
          <div key={s.subject} style={{ background: "#fff", borderRadius: "var(--r-card)", boxShadow: "var(--sh-sm)", overflow: "hidden" }}>
            <button
              onClick={() => setExpanded(isOpen ? null : s.subject)}
              style={{ width: "100%", padding: 16, textAlign: "left", background: "none", border: "none", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{SUBJECT_EMOJI[s.subject] ?? "📝"}</span>
                  <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text)" }}>{s.subject}</span>
                  <span style={{ fontSize: 12, color: "var(--faint)" }}>{s.total}회</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14 }}>
                  {s.avgScore !== null && (
                    <span style={{ fontWeight: 800, color: "var(--green-d)" }}>{s.avgScore}점</span>
                  )}
                  <span style={{ fontWeight: 800, color: "var(--text)" }}>{s.completionRate}%</span>
                  <span style={{ color: "var(--faint)", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>
              <RateBar value={s.completionRate} peer={peerData?.avgCompletionRate} />
              {peerData && (
                <p style={{ fontSize: 12, color: "var(--faint)", marginTop: 6 }}>
                  동학년 평균 {peerData.avgCompletionRate}%
                  {peerData.avgScore !== null && ` · ${peerData.avgScore}점`}
                  {s.completionRate > peerData.avgCompletionRate
                    ? " — 평균보다 높아요 🎉"
                    : s.completionRate === peerData.avgCompletionRate
                    ? " — 평균과 같아요"
                    : " — 평균보다 낮아요"}
                </p>
              )}
            </button>

            {/* 영역별 세부 */}
            {isOpen && (
              <div style={{ borderTop: "1px solid var(--line)", padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {s.areas.map((a) => (
                  <div key={a.area} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
                    <span style={{ color: "var(--text-soft)", width: "40%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.area}</span>
                    <div style={{ flex: 1, margin: "0 12px" }}>
                      <RateBar value={a.completionRate} />
                    </div>
                    <div style={{ textAlign: "right", fontSize: 12, color: "var(--muted)", width: 56, whiteSpace: "nowrap" }}>
                      <span>{a.completionRate}%</span>
                      {a.avgScore !== null && <span style={{ marginLeft: 4 }}>({a.avgScore}점)</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {!loading && subjects.length > 0 && (
        <p style={{ fontSize: 12, textAlign: "center", color: "var(--faint)", marginTop: 4 }}>
          주황 선은 동학년 평균 위치입니다
        </p>
      )}
    </div>
  );

  // ─── 직업군 가이드 ────────────────────────────────────
  const careerTab = (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 직업군 선택 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {CAREERS.map((c) => {
          const isSelected = selectedCareer?.id === c.id;
          return (
            <button
              key={c.id}
              onClick={() => setSelectedCareer(isSelected ? null : c)}
              style={{
                padding: 12, borderRadius: 16, textAlign: "left",
                border: `2.5px solid ${isSelected ? "var(--green)" : "var(--line)"}`,
                background: isSelected ? "var(--green-50)" : "#fff",
                cursor: "pointer", transition: "all .15s",
              }}
            >
              <span style={{ fontSize: 24 }}>{c.emoji}</span>
              <p style={{ fontSize: 14, fontWeight: 700, color: "var(--text)", marginTop: 4 }}>{c.name}</p>
              <p style={{ fontSize: 12, color: "var(--faint)" }}>{c.shortDesc}</p>
            </button>
          );
        })}
      </div>

      {/* 선택된 직업군 분석 */}
      {selectedCareer && (
        <div style={{ background: "#fff", borderRadius: "var(--r-card)", boxShadow: "var(--sh-md)", padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 30 }}>{selectedCareer.emoji}</span>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--text)" }}>{selectedCareer.name}</h3>
              {gradeLabel && (
                <p style={{ fontSize: 12, fontWeight: 700, color: "var(--green-d)", marginTop: 2 }}>{gradeLabel} 기준 분석</p>
              )}
            </div>
          </div>

          <p style={{ fontSize: 13, color: "var(--muted)", marginTop: 12, marginBottom: 16, lineHeight: 1.6 }}>
            {effectiveGrade <= 6 ? selectedCareer.elementaryTip : selectedCareer.middleTip}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: "var(--text-soft)" }}>핵심 과목 분석</p>
            {selectedCareer.coreSubjects.map(({ subject, importance }) => {
              const myRate = getMyRate(subject);
              const [impBg, impColor] = IMPORTANCE_STYLE[importance] ?? ["var(--line)", "var(--muted)"];
              return (
                <div
                  key={subject}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "10px 0", borderBottom: "1px solid var(--line)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 18 }}>{SUBJECT_EMOJI[subject] ?? "📝"}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text)" }}>{subject}</span>
                      <span style={{
                        fontSize: 11, padding: "2px 7px", borderRadius: 999,
                        fontWeight: 700, background: impBg, color: impColor,
                      }}>
                        {importance}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    {myRate !== null
                      ? <span style={{ fontSize: 14, fontWeight: 800, color: "var(--green-d)" }}>{myRate}%</span>
                      : <span style={{ fontSize: 12, color: "var(--faint)" }}>-</span>
                    }
                    <div style={{ marginTop: 2 }}>
                      <GapBadge rate={myRate} importance={importance} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ background: "var(--green-50)", borderRadius: 14, padding: 12, border: "1px solid var(--green-200)" }}>
            <p style={{ fontSize: 12, fontWeight: 800, color: "var(--green-d)", marginBottom: 4 }}>한 줄 로드맵</p>
            <p style={{ fontSize: 12.5, color: "var(--green-dd)", lineHeight: 1.6 }}>{selectedCareer.roadmap}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div>
      {/* 탭 */}
      <div style={{ display: "flex", background: "#fff", borderRadius: 16, padding: 3, boxShadow: "0 1px 4px rgba(0,0,0,.06)", marginBottom: 16 }}>
        <button
          onClick={() => setTab("stats")}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px 0", borderRadius: 13, border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 700,
            background: tab === "stats" ? "#16A34A" : "transparent",
            color: tab === "stats" ? "#fff" : "#7B8A81",
            transition: "all .2s",
          }}
        >
          <Icon name="bar-chart-3" size={17} color={tab === "stats" ? "#fff" : "#7B8A81"} stroke={2.2} />
          과목별 현황
        </button>
        <button
          onClick={() => setTab("career")}
          style={{
            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            padding: "10px 0", borderRadius: 13, border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 700,
            background: tab === "career" ? "#16A34A" : "transparent",
            color: tab === "career" ? "#fff" : "#7B8A81",
            transition: "all .2s",
          }}
        >
          <Icon name="target" size={17} color={tab === "career" ? "#fff" : "#7B8A81"} stroke={2.2} />
          직업군 가이드
        </button>
      </div>

      {tab === "stats" ? statsTab : (
        <>
          {careerTab}
          <p style={{ textAlign: "center", fontSize: 12, color: "var(--muted)", fontWeight: 600, marginTop: 16 }}>
            본 가이드는 AI가 생성한 자료이며, 실제와 다를 수 있습니다.
          </p>
        </>
      )}
    </div>
  );
}
