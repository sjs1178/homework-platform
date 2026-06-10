"use client";

import Icon from "@/components/ui/Icon";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

interface Props {
  childName: string;
  childInitial: string;
  childAvatar: string;
  gradeLabel: string;
  streak: number;
  weeklyDone: number;
  weeklyDots: boolean[];
  balance: number;
  unit: string;
  pairId: string;
}

export default function DashboardHero({
  childName, childInitial, childAvatar, gradeLabel, streak, weeklyDone, weeklyDots, balance, unit,
}: Props) {
  const todayIdx = (new Date().getDay() + 6) % 7; // Mon=0

  return (
    <div
      style={{
        borderRadius: 24,
        padding: "19px 19px 17px",
        background: "linear-gradient(150deg,#1FB259 0%,#15803D 100%)",
        color: "#fff",
        boxShadow: "var(--sh-hero-green)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 배경 원 장식 */}
      <div
        style={{
          position: "absolute",
          right: -30,
          top: -30,
          width: 120,
          height: 120,
          borderRadius: "50%",
          background: "rgba(255,255,255,.08)",
          pointerEvents: "none",
        }}
      />

      {/* 자녀 row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255,255,255,.22)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: childAvatar && childAvatar.length > 1 ? 26 : 18,
              fontWeight: 800,
              border: "2px solid rgba(255,255,255,.5)",
              flexShrink: 0,
              whiteSpace: "nowrap",
            }}
          >
            {childAvatar || childInitial}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{childName}</div>
            {gradeLabel && (
              <div style={{ fontSize: 12.5, opacity: 0.85, fontWeight: 600, marginTop: 1, whiteSpace: "nowrap" }}>
                {gradeLabel}
              </div>
            )}
          </div>
        </div>

        {/* 포인트 pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 5,
            background: "rgba(255,193,7,.95)",
            color: "#7c4a02",
            padding: "7px 12px",
            borderRadius: 999,
            fontSize: 13.5,
            fontWeight: 800,
            boxShadow: "0 4px 10px -3px rgba(0,0,0,.25)",
            whiteSpace: "nowrap",
          }}
        >
          <Icon name="star" size={15} color="#7c4a02" stroke={0} fill="#7c4a02" />
          {balance.toLocaleString()}{unit}
        </div>
      </div>

      {/* 스트릭 + 주간 완료 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 18,
          position: "relative",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Icon name="flame" size={20} color="#FFD27D" stroke={0} fill="#FFD27D" />
          <span style={{ fontSize: 14.5, fontWeight: 800, whiteSpace: "nowrap" }}>
            {streak > 0 ? `${streak}일 연속!` : "숙제 완료하면 스트릭 시작!"}
          </span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.92, whiteSpace: "nowrap" }}>
          이번 주 {weeklyDone}/5 완료
        </span>
      </div>

      {/* 주간 도트 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 11,
          position: "relative",
        }}
      >
        {DAY_LABELS.map((label, i) => {
          const done = weeklyDots[i];
          const isToday = i === todayIdx;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, opacity: isToday ? 1 : 0.7 }}>{label}</span>
              <span
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: done ? "#fff" : isToday ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.13)",
                  border: isToday && !done ? "2px dashed rgba(255,255,255,.8)" : "none",
                }}
              >
                {done && <Icon name="check" size={15} color="#16A34A" stroke={3} />}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
