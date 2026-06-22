import Skeleton from "@/components/ui/Skeleton";
import BottomNav from "@/components/ui/BottomNav";

export default function Loading() {
  return (
    <div style={{ minHeight: "100svh", background: "#F1F7F3", display: "flex", flexDirection: "column", maxWidth: 430, margin: "0 auto" }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "0 20px 80px" }}>
        <Skeleton>
          {/* 헤더 */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 2px" }}>
            <Skeleton.Bar width={120} height={26} />
            <div style={{ display: "flex", gap: 8 }}>
              <Skeleton.Circle size={40} />
              <Skeleton.Circle size={40} />
            </div>
          </div>
          {/* 히어로 카드 */}
          <div style={{ borderRadius: 24, background: "linear-gradient(150deg,#1FB259 0%,#15803D 100%)", padding: "20px 22px 18px", height: 180 }}>
            <Skeleton.Bar width="50%" height={16} style={{ background: "rgba(255,255,255,.2)" }} />
            <Skeleton.Bar width="30%" height={32} style={{ marginTop: 12, background: "rgba(255,255,255,.15)" }} />
          </div>
          {/* 미션 배너 */}
          <Skeleton.Card height={66} style={{ marginTop: 14 }} />
          {/* 오늘의 숙제 */}
          <Skeleton.Bar width={100} height={14} style={{ marginTop: 20, marginBottom: 10 }} />
          <Skeleton.Card height={80} style={{ marginTop: 0 }} />
          <Skeleton.Card height={80} style={{ marginTop: 10 }} />
          {/* 퀵액션 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 11, marginTop: 16 }}>
            <Skeleton.Card height={90} />
            <Skeleton.Card height={90} />
          </div>
        </Skeleton>
      </div>
      <BottomNav active="홈" role="parent" />
    </div>
  );
}
