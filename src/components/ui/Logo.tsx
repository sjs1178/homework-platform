/**
 * kiddoloop 브랜드 컴포넌트
 * 가이드: brand_assets/LOGO_INTEGRATION.md
 *
 * 경로(viewBox 0 0 100 100, strokeWidth 13):
 *   고리: M62.68 22.81 A30 30 0 1 0 77.19 37.32
 *   체크: M44 50 L53 59 L74 30
 */

type Variant = "color" | "white" | "mono";

interface MarkProps {
  size?: number;
  variant?: Variant;
}

/** 심볼만 (고리+체크, 투명 배경) */
export function KiddoloopMark({ size = 32, variant = "color" }: MarkProps) {
  const ring =
    variant === "white" ? "#FFFFFF" : variant === "mono" ? "#13241B" : "#16A34A";
  const check =
    variant === "white" ? "#FBBF24" : variant === "mono" ? "#13241B" : "#F59E0B";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      aria-label="kiddoloop"
      style={{ display: "block", flexShrink: 0 }}
    >
      <path
        d="M62.68 22.81 A30 30 0 1 0 77.19 37.32"
        stroke={ring}
        strokeWidth="13"
        strokeLinecap="round"
      />
      <path
        d="M44 50 L53 59 L74 30"
        stroke={check}
        strokeWidth="13"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** 앱 아이콘 타일 (그린 그라데이션 라운드 스퀘어 + 흰 심볼) */
export function KiddoloopAppicon({ size = 78 }: { size?: number }) {
  const rx = Math.round(size * 0.308); // 78→24, 60→18 …
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: rx,
        background: "linear-gradient(150deg,#22C55E 0%,#15803D 100%)",
        boxShadow: "0 14px 30px -10px rgba(21,128,61,.65)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/* variant=white → 고리 흰색 + 체크 밝은 호박 */}
      <KiddoloopMark size={Math.round(size * 0.62)} variant="white" />
    </div>
  );
}

/** 가로 조합 로고 (심볼 + "kiddoloop" 워드마크 + 선택적 역할 뱃지) */
export function LogoLockup({
  height = 32,
  variant = "color",
  badge,
}: {
  height?: number;
  variant?: Variant;
  badge?: "parent" | "child";
}) {
  const textColor =
    variant === "white" ? "#FFFFFF" : variant === "mono" ? "#13241B" : "#13241B";

  const badgeStyles: Record<string, React.CSSProperties> = {
    parent: {
      background: "#EFF6FF",
      color: "#2563EB",
      border: "1px solid #BFDBFE",
    },
    child: {
      background: "#ECFDF5",
      color: "#16A34A",
      border: "1px solid #BBF7D0",
    },
  };

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: Math.round(height * 0.3) }}>
      <KiddoloopMark size={height} variant={variant} />
      <span
        style={{
          fontFamily: "'Fredoka', sans-serif",
          fontWeight: 600,
          fontSize: Math.round(height * 0.88),
          color: textColor,
          letterSpacing: "-0.01em",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        kiddoloop
      </span>
      {badge && (
        <span
          style={{
            fontSize: Math.round(height * 0.46),
            fontWeight: 700,
            padding: `${Math.round(height * 0.1)}px ${Math.round(height * 0.25)}px`,
            borderRadius: 999,
            lineHeight: 1,
            whiteSpace: "nowrap",
            ...badgeStyles[badge],
          }}
        >
          {badge === "parent" ? "부모" : "자녀"}
        </span>
      )}
    </div>
  );
}
