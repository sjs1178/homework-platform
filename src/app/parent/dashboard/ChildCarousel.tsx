"use client";

import { useRef, useState, useCallback, useEffect } from "react";
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
  items: ChildData[];
  onSelect?: (index: number) => void;
}

export default function ChildCarousel({ items, onSelect }: Props) {
  const [current, setCurrent] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchDeltaX = useRef(0);
  const isHorizontalSwipe = useRef<boolean | null>(null);
  const animFrame = useRef(0);
  const todayIdx = (new Date().getDay() + 6) % 7;

  const getTranslateX = useCallback(
    (index: number, offset = 0) =>
      `translateX(calc(-${index * 100}% + ${offset - index * 12}px))`,
    []
  );

  useEffect(() => {
    if (trackRef.current) {
      trackRef.current.style.transition = "transform 0.3s ease";
      trackRef.current.style.transform = getTranslateX(current);
    }
  }, [current, getTranslateX]);

  const goTo = useCallback(
    (idx: number) => {
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      setCurrent(clamped);
      onSelect?.(clamped);
    },
    [items.length, onSelect]
  );

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    touchDeltaX.current = 0;
    isHorizontalSwipe.current = null;
    if (trackRef.current) {
      trackRef.current.style.transition = "none";
    }
  }

  function handleTouchMove(e: React.TouchEvent) {
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (isHorizontalSwipe.current === null) {
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        isHorizontalSwipe.current = Math.abs(dx) > Math.abs(dy);
      }
      return;
    }

    if (!isHorizontalSwipe.current) return;

    touchDeltaX.current = dx;
    cancelAnimationFrame(animFrame.current);
    animFrame.current = requestAnimationFrame(() => {
      if (trackRef.current) {
        trackRef.current.style.transform = getTranslateX(current, dx);
      }
    });
  }

  function snapToNearest() {
    cancelAnimationFrame(animFrame.current);
    if (trackRef.current) {
      trackRef.current.style.transition = "transform 0.3s ease";
    }

    const dx = touchDeltaX.current;
    const threshold = 60;

    if (dx < -threshold && current < items.length - 1) {
      goTo(current + 1);
    } else if (dx > threshold && current > 0) {
      goTo(current - 1);
    } else {
      if (trackRef.current) {
        trackRef.current.style.transform = getTranslateX(current);
      }
    }

    touchDeltaX.current = 0;
    isHorizontalSwipe.current = null;
  }

  if (items.length === 0) return null;

  return (
    <div>
      <div
        style={{
          overflow: "hidden",
          position: "relative",
          touchAction: items.length > 1 ? "pan-y" : "auto",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={snapToNearest}
        onTouchCancel={snapToNearest}
      >
        <div
          ref={trackRef}
          style={{
            display: "flex",
            gap: 12,
            transform: getTranslateX(current),
            transition: "transform 0.3s ease",
          }}
        >
          {items.map((child, idx) => (
            <div
              key={child.pairId}
              style={{ minWidth: "100%", flexShrink: 0 }}
            >
              <HeroCard child={child} todayIdx={todayIdx} isActive={idx === current} />
            </div>
          ))}
        </div>

        {items.length > 1 && current < items.length - 1 && (
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

        {items.length > 1 && current > 0 && (
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

      {items.length > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 6,
            marginTop: 10,
          }}
        >
          {items.map((_, idx) => (
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
