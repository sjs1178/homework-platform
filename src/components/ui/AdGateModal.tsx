"use client";

import { useState, useEffect } from "react";
import Icon from "./Icon";

interface Props {
  onWatchComplete: () => void;
  onManualEntry: () => void;
  onClose: () => void;
}

const AD_DURATION = 5;

export default function AdGateModal({ onWatchComplete, onManualEntry, onClose }: Props) {
  const [watching, setWatching] = useState(false);
  const [countdown, setCountdown] = useState(AD_DURATION);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!watching) return;
    if (countdown <= 0) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [watching, countdown]);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(19,36,27,.55)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        paddingBottom: "var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "100%", maxWidth: 430,
          background: "#fff", borderRadius: "24px 24px 0 0",
          padding: "24px 20px 32px",
          display: "flex", flexDirection: "column", gap: 16,
        }}
      >
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 17, fontWeight: 800, color: "var(--text)" }}>AI 기능 무료 이용</p>
            <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600, marginTop: 2 }}>
              광고를 보면 AI 분석을 1회 무료로 이용할 수 있어요
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}
          >
            <Icon name="x" size={20} color="var(--faint)" stroke={2} />
          </button>
        </div>

        {/* 광고 영역 (placeholder) */}
        <div
          style={{
            width: "100%", height: 160, borderRadius: 16,
            border: "2px dashed var(--line-strong)",
            background: "var(--surface-2)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          {watching && !done ? (
            <>
              <div
                style={{
                  width: 52, height: 52, borderRadius: "50%",
                  background: "var(--green-100)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <span style={{ fontSize: 22, fontWeight: 800, color: "var(--green-d)" }}>
                  {countdown}
                </span>
              </div>
              <p style={{ fontSize: 13, color: "var(--muted)", fontWeight: 600 }}>광고 시청 중...</p>
            </>
          ) : done ? (
            <>
              <Icon name="check-circle" size={36} color="var(--green)" stroke={2} />
              <p style={{ fontSize: 13, color: "var(--green-d)", fontWeight: 800 }}>시청 완료!</p>
            </>
          ) : (
            <>
              {/* ── 광고 placeholder ── 실제 광고 SDK로 교체 ── */}
              <Icon name="image" size={28} color="var(--faint)" stroke={1.5} />
              <p style={{ fontSize: 12.5, color: "var(--faint)", fontWeight: 600, textAlign: "center" }}>
                광고 영역
              </p>
              <p style={{ fontSize: 11, color: "var(--faint)", fontWeight: 500, fontFamily: "monospace" }}>
                [AD_PLACEHOLDER — 추후 광고 SDK로 교체]
              </p>
            </>
          )}
        </div>

        {/* 버튼 영역 */}
        {!watching && !done && (
          <button
            onClick={() => setWatching(true)}
            style={{
              width: "100%", height: 52, borderRadius: 16, border: "none",
              background: "var(--green)", color: "#fff",
              fontWeight: 800, fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "var(--sh-green)",
            }}
          >
            <Icon name="sparkles" size={18} color="#fff" stroke={2} />
            광고 보고 AI 이용하기
          </button>
        )}

        {done && (
          <button
            onClick={onWatchComplete}
            style={{
              width: "100%", height: 52, borderRadius: 16, border: "none",
              background: "var(--green)", color: "#fff",
              fontWeight: 800, fontSize: 15, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "var(--sh-green)",
            }}
          >
            <Icon name="sparkles" size={18} color="#fff" stroke={2} />
            AI 이용하기
          </button>
        )}

        <button
          onClick={onManualEntry}
          style={{
            width: "100%", height: 44, borderRadius: 14,
            border: "1.5px solid var(--line-strong)", background: "#fff",
            color: "var(--text-soft)", fontWeight: 700, fontSize: 14, cursor: "pointer",
          }}
        >
          광고 없이 직접 입력하기
        </button>
      </div>
    </div>
  );
}
