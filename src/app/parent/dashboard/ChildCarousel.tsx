"use client";

import { useRef, useState, useCallback } from "react";
import Icon from "@/components/ui/Icon";

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

export interface ChildData {
  pairId: string;
  childName: string;
  childAvatar: string;
  gradeLabel: string;
  streak: number;
  weeklyDone: number;
  weeklyDots: boolean[];
  balance: number;
  unit: string;
}

interface Props {
  children: ChildData[];
  onSelect?: (index: number) => void;
}

export default function ChildCarousel({ children, onSelect }: Props) {
  const [current, setCurrent] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const todayIdx = (new Date().getDay() + 6) % 7;

  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(idx, children.length - 1));
      setCurrent(clamped);
      setDragOffset(0);
      onSelect?.(clamped);
    },
    [children.length, onSelect]
  );

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
    setDragging(true);
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - touchStartX.current;
    touchDeltaX.current = dx;
    setDragOffset(dx);
  }

  function handleTouchEnd() {
    setDragging(false);
    const threshold = 60;
    if (touchDeltaX.current < -threshold) {
      goTo(current + 1);
    } else if (touchDeltaX.current > threshold) {
      goTo(current - 1);
    } else {
      setDragOffset(0);
    }
  }

  if (children.length === 0) return null;

  return (
    <div>
      <div
        ref={containerRef}
        style={{ overflow: "hidden", position: "relative" }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            display: "flex",
            gap: 12,
            transition: dragging ? "none" : "transform 0.3s ease",
            transform: `translateX(calc(-${current * 100}% - ${current * 12}px + ${dragOffset}px))`,
          }}
        >
          {children.map((child, idx) => (
            <div
              key={child.pairId}
              style={{
                minWidth: "100%",
                flexShrink: 0,
              }}
            >
              <HeroCard child={child} todayIdx={todayIdx} isActive={idx === current} />
            </div>
          ))}
        </div>

        {/* 우측 피크 힌트 */}
        {children.length > 1 && current < children.length - 1 && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: 0,
              bottom: 0,
              width: 28,
              background: "linear-gradient(to left, rgba(241,247,243,0.9), transparent)",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="chevron-right" size={18} color="var(--green)" stroke={2.5} />
          </div>
        )}

        {/* 좌측 피크 힌트 */}
        {children.length > 1 && current > 0 && (
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 28,
              background: "linear-gradient(to right, rgba(241,247,243,0.9), transparent)",
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="chevron-left" size={18} color="var(--green)" stroke={2.5} />
          </div>
        )}
      </div>

      {/* 인디케이터 도트 */}
      {children.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginTop: 10,
          }}
        >
          {children.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              style={{
                width: idx === current ? 18 : 7,
                height: 7,
                borderRadius: 999,
                background: idx === current ? "var(--green)" : "var(--green-200)",
                border: "none",
                padding: 0,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function HeroCard({ child, todayIdx }: { child: ChildData; todayIdx: number; isActive: boolean }) {
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
              fontSize: 26,
              fontWeight: 800,
              border: "2px solid rgba(255,255,255,.5)",
              flexShrink: 0,
            }}
          >
            {child.childAvatar || child.childName[0]}
          </div>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800 }}>{child.childName}</div>
            {child.gradeLabel && (
              <div style={{ fontSize: 12.5, opacity: 0.85, fontWeight: 600, marginTop: 1 }}>
                {child.gradeLabel}
              </div>
            )}
          </div>
        </div>
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
          {child.balance.toLocaleString()}{child.unit}
        </div>
      </div>

      {/* 스트릭 + 주간 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Icon name="flame" size={20} color="#FFD27D" stroke={0} fill="#FFD27D" />
          <span style={{ fontSize: 14.5, fontWeight: 800, whiteSpace: "nowrap" }}>
            {child.streak > 0 ? `${child.streak}일 연속!` : "숙제 완료하면 스트릭 시작!"}
          </span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, opacity: 0.92, whiteSpace: "nowrap" }}>
          이번 주 {child.weeklyDone}/5 완료
        </span>
      </div>

      {/* 주간 도트 */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 11, position: "relative" }}>
        {DAY_LABELS.map((label, i) => {
          const done = child.weeklyDots[i];
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
