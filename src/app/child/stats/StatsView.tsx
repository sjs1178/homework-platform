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
    <div className="relative h-2 bg-gray-100 rounded-full overflow-visible mt-1">
      <div className="h-2 bg-blue-400 rounded-full" style={{ width: `${value}%` }} />
      {peer !== undefined && (
        <div
          className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-orange-400 rounded"
          style={{ left: `${peer}%` }}
          title={`동학년 평균 ${peer}%`}
        />
      )}
    </div>
  );
}

function GapBadge({ rate, importance }: { rate: number | null; importance: string }) {
  if (rate === null) return <span className="text-xs text-gray-400">📚 데이터 없음</span>;
  if (rate >= 80) return <span className="text-xs text-green-600 font-semibold">✅ 잘 하고 있어요</span>;
  if (importance === "필수") return <span className="text-xs text-red-500 font-semibold">⚠️ 더 집중 필요</span>;
  return <span className="text-xs text-yellow-600 font-semibold">📈 조금 더 해봐요</span>;
}

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
    <div className="flex flex-col gap-3">
      {loading && (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm">
          분석 중...
        </div>
      )}

      {!loading && subjects.length === 0 && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
          <div style={{
            width: 88, height: 88, borderRadius: 26, background: "#E9F4EC",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 14px",
          }}>
            <Icon name="bar-chart-3" size={46} color="#9DB3A6" stroke={1.9} />
          </div>
          <p className="text-gray-800 font-extrabold text-base">아직 데이터가 없어요</p>
          <p className="text-gray-400 text-sm mt-1">숙제를 완료하면 통계가 쌓여요</p>
        </div>
      )}

      {subjects.map((s) => {
        const peerData = getPeer(s.subject);
        const isOpen = expanded === s.subject;
        return (
          <div key={s.subject} className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <button
              onClick={() => setExpanded(isOpen ? null : s.subject)}
              className="w-full p-4 text-left"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{SUBJECT_EMOJI[s.subject] ?? "📝"}</span>
                  <span className="font-semibold">{s.subject}</span>
                  <span className="text-xs text-gray-400">{s.total}회</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {s.avgScore !== null && (
                    <span className="font-bold text-blue-600">{s.avgScore}점</span>
                  )}
                  <span className="font-bold">{s.completionRate}%</span>
                  <span className="text-gray-300">{isOpen ? "▲" : "▼"}</span>
                </div>
              </div>
              <RateBar value={s.completionRate} peer={peerData?.avgCompletionRate} />
              {peerData && (
                <p className="text-xs text-gray-400 mt-1.5">
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
              <div className="border-t border-gray-100 px-4 pb-4 pt-3 flex flex-col gap-2">
                {s.areas.map((a) => (
                  <div key={a.area} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 w-1/2 truncate">{a.area}</span>
                    <div className="flex-1 mx-3">
                      <RateBar value={a.completionRate} />
                    </div>
                    <div className="text-right text-xs text-gray-500 w-16">
                      <span>{a.completionRate}%</span>
                      {a.avgScore !== null && <span className="ml-1">({a.avgScore}점)</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {!loading && subjects.length > 0 && (
        <p className="text-xs text-center text-gray-400 mt-1">
          주황 선은 동학년 평균 위치입니다
        </p>
      )}
    </div>
  );

  // ─── 직업군 가이드 ────────────────────────────────────
  const careerTab = (
    <div className="flex flex-col gap-4">
      {/* 직업군 선택 */}
      <div className="grid grid-cols-2 gap-2">
        {CAREERS.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCareer(selectedCareer?.id === c.id ? null : c)}
            className={`p-3 rounded-2xl text-left border-2 transition-all ${
              selectedCareer?.id === c.id
                ? "border-indigo-500 bg-indigo-50"
                : "border-gray-100 bg-white hover:border-gray-300"
            }`}
          >
            <span className="text-2xl">{c.emoji}</span>
            <p className="text-sm font-semibold mt-1">{c.name}</p>
            <p className="text-xs text-gray-400">{c.shortDesc}</p>
          </button>
        ))}
      </div>

      {/* 선택된 직업군 분석 */}
      {selectedCareer && (
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-3xl">{selectedCareer.emoji}</span>
            <div>
              <h3 className="font-bold">{selectedCareer.name}</h3>
              {gradeLabel && (
                <p className="text-xs text-indigo-500 font-semibold">{gradeLabel} 기준 분석</p>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3 mb-4 leading-relaxed">
            {effectiveGrade <= 6 ? selectedCareer.elementaryTip : selectedCareer.middleTip}
          </p>

          <div className="flex flex-col gap-3 mb-4">
            <p className="text-sm font-semibold text-gray-700">핵심 과목 분석</p>
            {selectedCareer.coreSubjects.map(({ subject, importance }) => {
              const myRate = getMyRate(subject);
              const peerData = getPeer(subject);
              return (
                <div key={subject} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{SUBJECT_EMOJI[subject] ?? "📝"}</span>
                    <div>
                      <span className="text-sm font-semibold">{subject}</span>
                      <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
                        importance === "필수" ? "bg-red-100 text-red-600" :
                        importance === "중요" ? "bg-yellow-100 text-yellow-700" :
                        "bg-gray-100 text-gray-500"
                      }`}>{importance}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    {myRate !== null
                      ? <span className="text-sm font-bold text-blue-600">{myRate}%</span>
                      : <span className="text-xs text-gray-300">-</span>
                    }
                    <div className="mt-0.5">
                      <GapBadge rate={myRate} importance={importance} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-indigo-50 rounded-xl p-3">
            <p className="text-xs font-semibold text-indigo-700 mb-1">한 줄 로드맵</p>
            <p className="text-xs text-indigo-600 leading-relaxed">{selectedCareer.roadmap}</p>
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
